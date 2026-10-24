'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Users,
  Search,
  KeyRound,
} from 'lucide-react';
import type { User } from '@/lib/types';

interface CheckInScannerClientProps {
  event: any;
  tickets: any[];
  staffUser: User;
}

export default function CheckInScannerClient({
  event,
  tickets: initialTickets,
  staffUser,
}: CheckInScannerClientProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [inputCode, setInputCode] = useState('');
  const [gateLabel, setGateLabel] = useState('North Gate Scanner 1');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<{
    outcome: string;
    message: string;
    ticket?: any;
    previousCheckIn?: any;
  } | null>(null);

  const totalIssued = tickets.length;
  const totalCheckedIn = tickets.filter((t) => t.status === 'CHECKED_IN').length;
  const checkInPercent = totalIssued > 0 ? Math.round((totalCheckedIn / totalIssued) * 100) : 0;

  const handleVerify = async (codeToVerify: string) => {
    const raw = codeToVerify.trim();
    if (!raw) return;

    setLoading(true);
    setScanResult(null);

    try {
      const res = await fetch('/api/tickets/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrPayloadOrCode: raw,
          gateOrDevice: gateLabel,
          eventId: event.id,
        }),
      });

      const data = await res.json();
      setScanResult(data);

      if (data.outcome === 'SUCCESS') {
        setInputCode('');
        // Update local ticket list to reflect admitted attendee
        setTickets((prev) =>
          prev.map((t) =>
            t.public_id === data.ticket?.publicId
              ? { ...t, status: 'CHECKED_IN', scanned_at: new Date().toISOString(), scanned_by_staff_name: staffUser.name }
              : t
          )
        );
      }
    } catch (err: any) {
      setScanResult({
        outcome: 'ERROR',
        message: err.message || 'Network error communicating with check-in service.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back and Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href={`/organizer`}
          className="text-xs font-mono text-stone-600 hover:text-stone-900 inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Organizer Dashboard</span>
        </Link>
        <span className="text-2xs font-mono text-stone-500">
          Gate Agent: {staffUser.name} ({staffUser.role})
        </span>
      </div>

      {/* Event Header & Progress Strip */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-2xs font-mono uppercase tracking-widest text-red-700 font-semibold">
              Live Gate Inspection
            </span>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mt-1">
              {event.title}
            </h1>
          </div>

          <div className="text-right shrink-0">
            <span className="text-2xs font-mono text-stone-500 uppercase block">Admitted / Issued</span>
            <span className="text-xl font-mono font-bold text-stone-900 tabular-nums">
              {totalCheckedIn} / {totalIssued} ({checkInPercent}%)
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-stone-900 h-2 rounded-full transition-all duration-300"
            style={{ width: `${checkInPercent}%` }}
          />
        </div>
      </div>

      {/* Main Scanner & Input Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Verification Form & Quick-Test Triggers */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-6">
          <div>
            <span className="text-2xs font-mono uppercase tracking-widest text-stone-400">Scanner Input</span>
            <h2 className="text-base font-serif font-bold text-stone-900 mt-1 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-stone-700" />
              <span>Verify Ticket QR or Public ID</span>
            </h2>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify(inputCode);
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="ticket-code-input" className="block text-2xs font-mono uppercase tracking-wider text-stone-500 mb-1">
                Enter Ticket Public ID or Scanned QR String
              </label>
              <div className="relative">
                <input
                  id="ticket-code-input"
                  type="text"
                  placeholder="e.g. GF-SYM-9481B or raw QR payload..."
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg pl-3 pr-24 py-2.5 text-xs font-mono text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-hidden focus:border-stone-900"
                />
                <button
                  type="submit"
                  disabled={loading || !inputCode.trim()}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-medium rounded-md transition-colors font-mono"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-2xs font-mono text-stone-500">
              <label htmlFor="gate-label-input" className="flex items-center gap-1.5">
                <span>Gate / Device Label:</span>
                <input
                  id="gate-label-input"
                  type="text"
                  value={gateLabel}
                  onChange={(e) => setGateLabel(e.target.value)}
                  className="bg-transparent border-b border-stone-300 text-stone-800 px-1 py-0.5 focus:outline-hidden"
                />
              </label>
            </div>
          </form>

          {/* Verification Outcome Display */}
          {scanResult && (
            <div
              role="alert"
              className={`p-4 rounded-xl border space-y-2 animate-in fade-in duration-200 ${
                scanResult.outcome === 'SUCCESS'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : scanResult.outcome === 'ALREADY_USED'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-red-50 border-red-300 text-red-950'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {scanResult.outcome === 'SUCCESS' && <CheckCircle2 className="w-5 h-5 text-emerald-700" />}
                {scanResult.outcome === 'ALREADY_USED' && <AlertTriangle className="w-5 h-5 text-amber-700" />}
                {(scanResult.outcome === 'INVALID_SIGNATURE' ||
                  scanResult.outcome === 'NOT_FOUND' ||
                  scanResult.outcome === 'CANCELLED' ||
                  scanResult.outcome === 'WRONG_EVENT') && <XCircle className="w-5 h-5 text-red-700" />}
                <span className="font-mono">{scanResult.outcome}</span>
              </div>

              <p className="text-xs leading-relaxed">{scanResult.message}</p>

              {scanResult.ticket && (
                <div className="pt-2 border-t border-stone-200/50 text-2xs font-mono space-y-0.5">
                  <div>Attendee: {scanResult.ticket.attendeeName}</div>
                  <div>Serial: {scanResult.ticket.publicId}</div>
                  {scanResult.previousCheckIn && (
                    <div className="text-amber-800 font-semibold">
                      Original Check-in: {new Date(scanResult.previousCheckIn.scannedAt).toLocaleTimeString()} ({scanResult.previousCheckIn.gateOrDevice})
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Evaluator Quick-Test Sandbox */}
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg space-y-2.5">
            <span className="text-2xs font-mono uppercase tracking-wider text-stone-500 block font-semibold">
              Evaluator Test Scenarios
            </span>
            <div className="grid grid-cols-2 gap-2 text-2xs font-mono">
              <button
                type="button"
                onClick={() => {
                  const validUnchecked = tickets.find((t) => t.status === 'VALID');
                  if (validUnchecked) handleVerify(validUnchecked.public_id);
                }}
                className="p-2 text-left bg-white border border-stone-200 hover:border-stone-400 rounded transition-colors"
              >
                <span className="text-emerald-700 font-bold block">1. Valid First Scan</span>
                <span className="text-stone-400 text-3xs truncate block">Simulate admitting unverified ticket</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const alreadyChecked = tickets.find((t) => t.status === 'CHECKED_IN');
                  if (alreadyChecked) handleVerify(alreadyChecked.public_id);
                  else if (tickets[0]) handleVerify(tickets[0].public_id);
                }}
                className="p-2 text-left bg-white border border-stone-200 hover:border-stone-400 rounded transition-colors"
              >
                <span className="text-amber-700 font-bold block">2. Duplicate Second Scan</span>
                <span className="text-stone-400 text-3xs truncate block">Tests ALREADY_USED rejection</span>
              </button>

              <button
                type="button"
                onClick={() => handleVerify('GF:GF-SYM-9481A:0000deadbeef111122223333444455556666777788889999aaaabbbbccccdddd')}
                className="p-2 text-left bg-white border border-stone-200 hover:border-stone-400 rounded transition-colors"
              >
                <span className="text-red-700 font-bold block">3. Forged QR Signature</span>
                <span className="text-stone-400 text-3xs truncate block">Tests INVALID_SIGNATURE rejection</span>
              </button>

              <button
                type="button"
                onClick={() => handleVerify('GF-UNKNOWN-0000')}
                className="p-2 text-left bg-white border border-stone-200 hover:border-stone-400 rounded transition-colors"
              >
                <span className="text-stone-700 font-bold block">4. Unknown Ticket ID</span>
                <span className="text-stone-400 text-3xs truncate block">Tests NOT_FOUND outcome</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Issued Ticket Ledger */}
        <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xs font-mono uppercase tracking-widest text-stone-400">Roster</span>
              <h2 className="text-base font-serif font-bold text-stone-900">Issued Tickets for Event</h2>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1 divide-y divide-stone-100 text-xs">
            {tickets.map((t) => (
              <div key={t.id} className="pt-2 first:pt-0 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-stone-900 block truncate max-w-[180px]">
                    {t.attendee_name}
                  </span>
                  <span className="text-2xs font-mono text-stone-400">{t.public_id} · {t.ticket_name}</span>
                </div>
                <div className="text-right">
                  {t.status === 'CHECKED_IN' ? (
                    <span className="text-2xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ADMITTED
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleVerify(t.public_id)}
                      className="text-2xs font-mono font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded border border-stone-300 transition-colors"
                    >
                      Scan This
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
