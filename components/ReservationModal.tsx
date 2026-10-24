'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, ShieldAlert, X } from 'lucide-react';
import type { Event, TicketTypeWithInventory } from '@/lib/types';

interface ReservationModalProps {
  event: Event;
  ticketTypes: TicketTypeWithInventory[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ReservationModal({ event, ticketTypes, isOpen, onClose }: ReservationModalProps) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    if (ticketTypes.length > 0) {
      initial[ticketTypes[0].id] = 1;
    }
    return initial;
  });

  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerNotes, setBuyerNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuantityChange = (tktId: string, qty: number) => {
    setQuantities((prev) => ({
      ...prev,
      [tktId]: qty,
    }));
  };

  const selectedLines = Object.entries(quantities)
    .filter(([_, qty]) => qty > 0)
    .map(([ticketTypeId, quantity]) => {
      const tkt = ticketTypes.find((t) => t.id === ticketTypeId);
      return {
        ticketTypeId,
        occurrenceId: tkt?.occurrenceId || '',
        quantity,
        priceInCents: tkt?.priceInCents || 0,
        name: tkt?.name || '',
      };
    });

  const totalCents = selectedLines.reduce((acc, l) => acc + l.priceInCents * l.quantity, 0);
  const totalCount = selectedLines.reduce((acc, l) => acc + l.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (totalCount === 0) {
      setErrorMessage('Please select at least 1 ticket to reserve.');
      return;
    }

    if (!buyerName.trim() || !buyerEmail.trim()) {
      setErrorMessage('Please provide your full name and valid email address.');
      return;
    }

    setLoading(true);

    try {
      const idempotencyKey = 'idmp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      const res = await fetch(`/api/events/${event.id}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-idempotency-key': idempotencyKey,
        },
        body: JSON.stringify({
          buyerName: buyerName.trim(),
          buyerEmail: buyerEmail.trim(),
          buyerNotes: buyerNotes.trim() || undefined,
          lines: selectedLines.map((l) => ({
            ticketTypeId: l.ticketTypeId,
            occurrenceId: l.occurrenceId,
            quantity: l.quantity,
          })),
          idempotencyKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'SOLD_OUT') {
          throw new Error('Sold out: Another visitor just reserved the remaining inventory. Please select another tier or fewer seats.');
        }
        throw new Error(data.error || 'Failed to place reservation hold.');
      }

      // Redirect to checkout
      router.push(`/checkout/${data.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-title"
        className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div>
            <span className="text-2xs font-mono uppercase tracking-widest text-stone-400">10-Minute Hold</span>
            <h2 id="reservation-title" className="text-base font-serif font-bold text-stone-50">
              Reserve Tickets: {event.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close reservation modal"
            className="p-1 rounded-md text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-800">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Ticket Tiers Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-mono uppercase tracking-wider text-stone-500">
              Select Tickets & Quantity
            </label>
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {ticketTypes.map((tkt) => {
                const maxAllowed = Math.min(tkt.maxPerOrder, tkt.remainingCapacity);
                const isUnavailable = tkt.remainingCapacity <= 0;

                return (
                  <div
                    key={tkt.id}
                    className={`p-3 rounded-lg border transition-all ${
                      isUnavailable
                        ? 'bg-stone-50 border-stone-200 opacity-60'
                        : (quantities[tkt.id] || 0) > 0
                        ? 'border-stone-900 bg-stone-50/50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-stone-900">{tkt.name}</span>
                          <span className="text-2xs font-mono text-stone-500">
                            ${(tkt.priceInCents / 100).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-2xs text-stone-500 mt-0.5">{tkt.description}</p>
                        <div className="mt-1 text-2xs font-mono">
                          {isUnavailable ? (
                            <span className="text-stone-400 font-semibold">Sold out</span>
                          ) : tkt.remainingCapacity <= 3 ? (
                            <span className="text-red-700 font-semibold">Only {tkt.remainingCapacity} remaining!</span>
                          ) : (
                            <span className="text-stone-500">{tkt.remainingCapacity} available</span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Select */}
                      {!isUnavailable ? (
                        <select
                          aria-label={`Select quantity for ${tkt.name}`}
                          value={quantities[tkt.id] || 0}
                          onChange={(e) => handleQuantityChange(tkt.id, parseInt(e.target.value, 10))}
                          className="bg-white border border-stone-300 rounded px-2 py-1 text-xs font-mono text-stone-900 focus:ring-1 focus:ring-stone-900"
                        >
                          {Array.from({ length: maxAllowed + 1 }).map((_, i) => (
                            <option key={i} value={i}>
                              {i}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-2xs font-mono text-stone-400 self-center">None</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Buyer Details */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <label className="block text-xs font-mono uppercase tracking-wider text-stone-500">
              Buyer Contact Details
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  aria-label="Buyer Full Name"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-hidden focus:border-stone-500"
                />
              </div>
              <div>
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  aria-label="Buyer Email Address"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-hidden focus:border-stone-500"
                />
              </div>
            </div>
            <div>
              <input
                type="text"
                placeholder="Special notes or accessibility requirements (optional)"
                aria-label="Special notes"
                value={buyerNotes}
                onChange={(e) => setBuyerNotes(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-hidden focus:border-stone-500"
              />
            </div>
          </div>

          {/* Transactional Invariant Notice */}
          <div className="p-3 bg-stone-100/70 rounded-lg text-2xs text-stone-600 flex items-start gap-2">
            <Clock className="w-3.5 h-3.5 text-stone-700 shrink-0 mt-0.5" />
            <span>
              Submitting places an atomic 10-minute hold on your selected tickets. If checkout is not completed within 10 minutes, held seats are automatically returned to public inventory.
            </span>
          </div>

          {/* Footer & Submit */}
          <div className="pt-2 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-stone-500 block">Total ({totalCount} tickets)</span>
              <span className="text-base font-bold font-mono text-stone-900">
                ${(totalCents / 100).toFixed(2)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || totalCount === 0}
                className="px-5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors shadow-xs"
              >
                {loading ? 'Reserving...' : 'Hold & Proceed'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
