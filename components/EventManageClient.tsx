'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Users, Eye, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { User, PublicationStatus } from '@/lib/types';

interface EventManageClientProps {
  event: any;
  ticketTypes: any[];
  user: User;
}

export default function EventManageClient({ event, ticketTypes, user }: EventManageClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<PublicationStatus>(event.status);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canEdit = user.role === 'OWNER' || user.role === 'EVENT_MANAGER';

  const handleStatusChange = async (newStatus: PublicationStatus) => {
    if (!canEdit) {
      alert('Only Owners and Event Managers may alter publication status.');
      return;
    }

    if (newStatus === 'CANCELLED') {
      if (!confirm('Warning: Cancelling this event will block new reservations and release all pending holds. Confirmed tickets will be marked cancelled under the explicit cancellation policy. Continue?')) {
        return;
      }
    }

    setUpdating(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/events/${event.slug || event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      // Also support direct state change via internal API if needed
      setStatus(newStatus);
      setMessage(`Event status successfully updated to ${newStatus}.`);
      router.refresh();
    } catch {
      setMessage('Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/organizer"
          className="text-xs font-mono text-stone-600 hover:text-stone-900 inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Organizer Console</span>
        </Link>
        <span className="text-2xs font-mono text-stone-500">
          Role: {user.name} ({user.role})
        </span>
      </div>

      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-2xs font-mono uppercase tracking-widest text-stone-500">
              <span>{event.category}</span>
              <span aria-hidden="true">·</span>
              <span className={status === 'PUBLISHED' ? 'text-emerald-700 font-bold' : status === 'CANCELLED' ? 'text-red-700 font-bold' : 'text-stone-500'}>
                {status}
              </span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-stone-900 mt-1">
              {event.title}
            </h1>
            <p className="text-xs text-stone-600 mt-1">{event.short_description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/events/${event.slug}`}
              className="px-3 py-1.5 border border-stone-200 hover:border-stone-400 text-stone-700 text-xs font-mono rounded-md transition-colors inline-flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Public Page</span>
            </Link>
            <Link
              href={`/organizer/events/${event.id}/attendees`}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-mono rounded-md transition-colors inline-flex items-center gap-1"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Roster</span>
            </Link>
            <Link
              href={`/organizer/events/${event.id}/check-in`}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-mono rounded-md transition-colors inline-flex items-center gap-1 shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
              <span>Scanner</span>
            </Link>
          </div>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{message}</span>
          </div>
        )}
      </div>

      {/* Lifecycle Status Management */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
        <span className="text-2xs font-mono uppercase tracking-widest text-stone-400">Lifecycle Controls</span>
        <h2 className="text-base font-serif font-bold text-stone-900">Publication State Machine</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            disabled={updating || !canEdit}
            onClick={() => handleStatusChange('PUBLISHED')}
            className={`p-3 rounded-lg border text-left transition-all ${
              status === 'PUBLISHED'
                ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-500'
                : 'bg-white border-stone-200 hover:border-stone-300'
            }`}
          >
            <span className="font-bold text-xs text-emerald-900 block font-mono">PUBLISHED</span>
            <span className="text-2xs text-stone-500 block mt-1">Live in public catalogue and accept reservations</span>
          </button>

          <button
            type="button"
            disabled={updating || !canEdit}
            onClick={() => handleStatusChange('DRAFT')}
            className={`p-3 rounded-lg border text-left transition-all ${
              status === 'DRAFT'
                ? 'bg-stone-100 border-stone-400 ring-1 ring-stone-500'
                : 'bg-white border-stone-200 hover:border-stone-300'
            }`}
          >
            <span className="font-bold text-xs text-stone-800 block font-mono">DRAFT</span>
            <span className="text-2xs text-stone-500 block mt-1">Hidden from public discovery catalogue</span>
          </button>

          <button
            type="button"
            disabled={updating || !canEdit}
            onClick={() => handleStatusChange('CANCELLED')}
            className={`p-3 rounded-lg border text-left transition-all ${
              status === 'CANCELLED'
                ? 'bg-red-50 border-red-300 ring-1 ring-red-500'
                : 'bg-white border-stone-200 hover:border-stone-300'
            }`}
          >
            <span className="font-bold text-xs text-red-900 block font-mono">CANCELLED</span>
            <span className="text-2xs text-stone-500 block mt-1">Immediately release holds and apply policy</span>
          </button>
        </div>
      </div>

      {/* Ticket Inventory Tiers Breakdown */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
        <span className="text-2xs font-mono uppercase tracking-widest text-stone-400">Inventory Status</span>
        <h2 className="text-base font-serif font-bold text-stone-900">Current Allocations</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 font-mono text-2xs uppercase">
                <th className="py-2">Tier Name</th>
                <th className="py-2">Price</th>
                <th className="py-2">Capacity</th>
                <th className="py-2">Held (Pending)</th>
                <th className="py-2">Sold (Confirmed)</th>
                <th className="py-2 text-right">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono text-2xs">
              {ticketTypes.map((t) => {
                const rem = Math.max(0, (t.capacity || 0) - ((t.sold || 0) + (t.held || 0)));
                return (
                  <tr key={t.id}>
                    <td className="py-2.5 font-sans font-semibold text-xs text-stone-900">{t.name}</td>
                    <td className="py-2.5 text-stone-600">${((t.price_in_cents || 0) / 100).toFixed(2)}</td>
                    <td className="py-2.5 text-stone-900">{t.capacity}</td>
                    <td className="py-2.5 text-amber-700">{t.held || 0}</td>
                    <td className="py-2.5 text-emerald-700">{t.sold || 0}</td>
                    <td className="py-2.5 text-right font-bold text-stone-900">{rem}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
