'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ShieldCheck, Download, Users } from 'lucide-react';

interface AttendeesClientProps {
  event: any;
  initialAttendees: any[];
}

export default function AttendeesClient({ event, initialAttendees }: AttendeesClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'CHECKED_IN' | 'CANCELLED'>('ALL');

  const filtered = useMemo(() => {
    return initialAttendees.filter((att) => {
      const matchStatus = statusFilter === 'ALL' || att.ticket_status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        att.attendee_name.toLowerCase().includes(q) ||
        att.attendee_email.toLowerCase().includes(q) ||
        att.public_id.toLowerCase().includes(q) ||
        att.ticket_type_name.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [initialAttendees, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <span className="text-2xs font-mono uppercase tracking-widest text-stone-400">Attendee Roster</span>
          <h1 className="text-2xl font-serif font-bold text-stone-900 mt-1">
            {event.title}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 font-mono">
            Total Tickets Issued: {initialAttendees.length}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/organizer/events/${event.id}/check-in`}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs font-mono"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Launch Gate Scanner</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {(['ALL', 'CHECKED_IN', 'VALID', 'CANCELLED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors font-mono ${
                statusFilter === st
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              {st === 'ALL' ? 'All Attendees' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name, email, serial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 pl-8 pr-3 py-1.5 text-xs rounded-md text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-hidden focus:border-stone-500"
          />
        </div>
      </div>

      {/* Tabular Attendees List */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 font-mono text-2xs uppercase tracking-wider bg-stone-50/50">
                <th className="py-3 px-4">Attendee Name</th>
                <th className="py-3 px-4">Ticket Tier</th>
                <th className="py-3 px-4">Public Serial</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Gate Scan Details</th>
                <th className="py-3 px-4 text-right">Pass View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-500">
                    No attendees found matching filter.
                  </td>
                </tr>
              ) : (
                filtered.map((att) => (
                  <tr key={att.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-stone-900">{att.attendee_name}</div>
                      <div className="text-2xs text-stone-400 font-mono">{att.attendee_email}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-stone-800">
                      {att.ticket_type_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-2xs text-stone-600">
                      {att.public_id}
                    </td>
                    <td className="py-3 px-4">
                      {att.ticket_status === 'CHECKED_IN' ? (
                        <span className="text-2xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          CHECKED IN
                        </span>
                      ) : att.ticket_status === 'CANCELLED' ? (
                        <span className="text-2xs font-mono font-semibold text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          CANCELLED
                        </span>
                      ) : (
                        <span className="text-2xs font-mono font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                          VALID
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-2xs text-stone-500">
                      {att.scanned_at ? (
                        <div>
                          <span className="text-stone-800 block">
                            {new Date(att.scanned_at).toLocaleTimeString()}
                          </span>
                          <span className="text-stone-400 block">{att.gate_or_device || 'Main Gate'}</span>
                        </div>
                      ) : (
                        <span className="text-stone-300">Pending arrival</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/ticket/${att.public_id}`}
                        className="text-2xs font-mono text-stone-700 hover:text-stone-950 underline underline-offset-2"
                      >
                        Inspect QR
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
