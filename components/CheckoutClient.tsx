'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, ShieldAlert, ArrowLeft, CheckCircle2, AlertOctagon } from 'lucide-react';
import type { Reservation } from '@/lib/types';

interface CheckoutClientProps {
  reservation: Reservation;
}

export default function CheckoutClient({ reservation }: CheckoutClientProps) {
  const router = useRouter();
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const diff = Math.floor((new Date(reservation.holdExpiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  const totalTickets = reservation.lines?.reduce((acc, l) => acc + l.quantity, 0) || 1;

  // Initialize attendee forms
  const [attendees, setAttendees] = useState<{ attendeeName: string; attendeeEmail: string }[]>(() => {
    return Array.from({ length: totalTickets }).map((_, i) => ({
      attendeeName: i === 0 ? reservation.buyerName : `${reservation.buyerName} (Guest ${i + 1})`,
      attendeeEmail: reservation.buyerEmail,
    }));
  });

  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live hold countdown
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.floor((new Date(reservation.holdExpiresAt).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setSecondsRemaining(0);
        clearInterval(timer);
      } else {
        setSecondsRemaining(diff);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [reservation.holdExpiresAt]);

  const isExpired = secondsRemaining <= 0 || reservation.status === 'EXPIRED';

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAttendeeChange = (index: number, field: 'attendeeName' | 'attendeeEmail', val: string) => {
    setAttendees((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpired) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/reservations/${reservation.id}/demo-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendees }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete checkout.');
      }

      router.push(`/reservation/${reservation.publicToken}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during confirmation.');
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you wish to cancel this reservation? Held inventory will be released back to the event.')) {
      return;
    }

    setCancelling(true);
    try {
      await fetch(`/api/reservations/${reservation.id}/cancel`, {
        method: 'POST',
      });
      router.push(reservation.event?.slug ? `/events/${reservation.event.slug}` : '/events');
    } catch {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href={reservation.event?.slug ? `/events/${reservation.event.slug}` : '/events'}
          className="text-xs font-mono text-stone-600 hover:text-stone-900 inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Event Details</span>
        </Link>
      </div>

      {/* Countdown and Hold Banner */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isExpired
            ? 'bg-red-50 border-red-300 text-red-900'
            : secondsRemaining < 120
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        <div className="flex items-start gap-3">
          <Clock className={`w-5 h-5 shrink-0 mt-0.5 ${isExpired ? 'text-red-600' : 'text-stone-700'}`} />
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-stone-500">
              {isExpired ? 'Hold Status' : 'Inventory Reservation Hold'}
            </div>
            <p className="text-sm font-medium mt-0.5">
              {isExpired
                ? 'Your 10-minute hold has expired. The tickets have been released back to public inventory.'
                : 'Tickets are temporarily held for you while you complete this simulated review.'}
            </p>
          </div>
        </div>

        <div className="text-right sm:border-l sm:border-stone-200 sm:pl-6 shrink-0">
          <span className="text-2xs font-mono text-stone-500 uppercase block">Time Remaining</span>
          <span
            className={`text-2xl font-mono font-bold tabular-nums ${
              isExpired ? 'text-red-700' : secondsRemaining < 120 ? 'text-amber-700' : 'text-stone-900'
            }`}
          >
            {formatCountdown(secondsRemaining)}
          </span>
        </div>
      </div>

      {/* Expired Fallback Card */}
      {isExpired && (
        <div className="p-8 bg-white border border-stone-200 rounded-xl text-center space-y-4">
          <AlertOctagon className="w-10 h-10 text-red-600 mx-auto" />
          <h2 className="text-lg font-serif font-bold text-stone-900">Reservation Hold Expired</h2>
          <p className="text-sm text-stone-600 max-w-md mx-auto">
            To prevent indefinite inventory locking, holds expire automatically after ten minutes. Please return to the event page to check if tickets are still available.
          </p>
          <Link
            href={reservation.event?.slug ? `/events/${reservation.event.slug}` : '/events'}
            className="inline-block px-5 py-2.5 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-800 transition-colors"
          >
            Check Event Availability
          </Link>
        </div>
      )}

      {/* Active Checkout Form */}
      {!isExpired && (
        <form onSubmit={handleConfirm} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Attendee Forms & Summary */}
          <div className="lg:col-span-7 space-y-6">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-800">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Event Summary Card */}
            <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
              <span className="text-2xs font-mono uppercase tracking-widest text-stone-400">Order Overview</span>
              <h1 className="text-xl font-serif font-bold text-stone-900">
                {reservation.event?.title}
              </h1>

              <div className="space-y-2 pt-2 border-t border-stone-100">
                {reservation.lines?.map((line) => (
                  <div key={line.id} className="flex items-center justify-between text-xs py-1">
                    <span className="text-stone-700">
                      {line.ticketTypeName} × {line.quantity}
                    </span>
                    <span className="font-mono font-medium text-stone-900">
                      ${((line.pricePerUnitInCents * line.quantity) / 100).toFixed(2)}
                    </span>
                  </div>
                ))}

                <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100 font-semibold">
                  <span className="text-stone-900">Total Due (Simulated)</span>
                  <span className="font-mono text-sm text-stone-900">
                    ${(reservation.totalAmountInCents / 100).toFixed(2)} USD
                  </span>
                </div>
              </div>
            </div>

            {/* Attendee Badges Customization */}
            <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
              <div>
                <span className="text-2xs font-mono uppercase tracking-widest text-stone-400">Badge Personalization</span>
                <h2 className="text-base font-serif font-bold text-stone-900 mt-1">
                  Issued Ticket Attendee Details
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Enter the name and email that will appear on each cryptographic gate pass.
                </p>
              </div>

              <div className="space-y-4 pt-2 border-t border-stone-100">
                {attendees.map((att, idx) => (
                  <div key={idx} className="p-3.5 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                    <span className="text-2xs font-mono uppercase tracking-wider text-stone-500 block">
                      Ticket {idx + 1} of {totalTickets}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-2xs text-stone-500 mb-1">Attendee Full Name</label>
                        <input
                          type="text"
                          required
                          value={att.attendeeName}
                          onChange={(e) => handleAttendeeChange(idx, 'attendeeName', e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded px-2.5 py-1.5 text-xs text-stone-900 focus:outline-hidden focus:border-stone-500"
                        />
                      </div>
                      <div>
                        <label className="block text-2xs text-stone-500 mb-1">Attendee Email</label>
                        <input
                          type="email"
                          required
                          value={att.attendeeEmail}
                          onChange={(e) => handleAttendeeChange(idx, 'attendeeEmail', e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded px-2.5 py-1.5 text-xs text-stone-900 focus:outline-hidden focus:border-stone-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Explicit Demo Checkout & Action */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5 shadow-xs">
              <div>
                <span className="text-2xs font-mono uppercase tracking-widest text-stone-400">Payment Simulation</span>
                <h2 className="text-base font-serif font-bold text-stone-900 mt-1">
                  Simulated Demo Checkout
                </h2>
              </div>

              {/* Explicit Demo Mandate Banner */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-950">
                  <CheckCircle2 className="w-4 h-4 text-amber-700" />
                  <span>Demo checkout — no real payment was collected</span>
                </div>
                <p className="text-2xs text-amber-800 leading-relaxed">
                  This platform release evaluates database concurrency, ticket inventory locks, and QR verification. No actual banking or payment gateway is invoked.
                </p>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500">Buyer</span>
                  <span className="font-medium text-stone-900">{reservation.buyerName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500">Email</span>
                  <span className="font-medium text-stone-900">{reservation.buyerEmail}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500">Payment Method</span>
                  <span className="font-mono text-stone-700">Simulated Demo Card (•••• 4242)</span>
                </div>
                <div className="flex justify-between py-1 text-sm font-bold text-stone-900">
                  <span>Grand Total</span>
                  <span className="font-mono">${(reservation.totalAmountInCents / 100).toFixed(2)}</span>
                </div>
              </div>

              {/* Confirm Button */}
              <div className="pt-3 space-y-3">
                <button
                  type="submit"
                  disabled={loading || isExpired}
                  className="w-full py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'Confirming & Issuing Tickets...' : 'Confirm Demo Reservation & Issue Tickets'}
                </button>

                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleCancel}
                  className="w-full py-2 text-xs text-stone-500 hover:text-red-700 transition-colors font-medium text-center"
                >
                  {cancelling ? 'Releasing hold...' : 'Cancel Reservation & Release Tickets'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
