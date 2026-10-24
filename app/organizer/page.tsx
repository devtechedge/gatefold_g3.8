import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { EventService } from '@/lib/services/event-service';
import { getCurrentUser } from '@/lib/auth/session';
import {
  Calendar,
  Ticket,
  Users,
  ShieldCheck,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OrganizerDashboardPage() {
  const user = await getCurrentUser();
  const overview = await EventService.getOrganizerOverview();

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-stone-500">
              <span>Gatefold Operations</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-stone-800">{user.name} ({user.role})</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
              Event Operations Console
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/organizer/events/new"
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </Link>
          </div>
        </div>

        {/* Operational Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-stone-400">
              <span className="text-2xs font-mono uppercase tracking-wider">Total Events</span>
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
              {overview.metrics.total_events}
            </div>
            <span className="text-2xs text-stone-500">Across all seasons</span>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-stone-400">
              <span className="text-2xs font-mono uppercase tracking-wider">Issued Tickets</span>
              <Ticket className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
              {overview.metrics.total_tickets_issued}
            </div>
            <span className="text-2xs text-stone-500">Confirmed & active passes</span>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-stone-400">
              <span className="text-2xs font-mono uppercase tracking-wider">Admitted Check-Ins</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
              {overview.metrics.total_checked_in}
            </div>
            <span className="text-2xs text-stone-500">Verified via gate scanner</span>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-stone-400">
              <span className="text-2xs font-mono uppercase tracking-wider">Active Holds</span>
              <Activity className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
              {overview.metrics.active_holds_count}
            </div>
            <span className="text-2xs text-stone-500">Pending 10-minute checkouts</span>
          </div>
        </div>

        {/* Managed Events Table */}
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xs font-mono uppercase tracking-widest text-stone-400">Institution Programme</span>
              <h2 className="text-lg font-serif font-bold text-stone-900">Configured Events</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-mono text-2xs uppercase tracking-wider">
                  <th className="py-2.5 pr-4">Event Title</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 pl-4 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {overview.events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 pr-4 font-semibold text-stone-900 max-w-xs truncate">
                      {evt.title}
                    </td>
                    <td className="py-3 px-4">
                      {evt.status === 'PUBLISHED' ? (
                        <span className="text-emerald-700 font-mono font-medium">PUBLISHED</span>
                      ) : evt.status === 'CANCELLED' ? (
                        <span className="text-red-700 font-mono font-medium">CANCELLED</span>
                      ) : (
                        <span className="text-stone-500 font-mono font-medium">DRAFT</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-2xs text-stone-500 uppercase">
                      {evt.category}
                    </td>
                    <td className="py-3 px-4 text-stone-600 font-mono text-2xs">
                      {new Date(evt.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3 pl-4 text-right space-x-2 font-mono text-2xs">
                      <Link
                        href={`/events/${evt.slug}`}
                        className="text-stone-600 hover:text-stone-950 underline underline-offset-2"
                      >
                        Public View
                      </Link>
                      <span className="text-stone-300">·</span>
                      <Link
                        href={`/organizer/events/${evt.id}/attendees`}
                        className="text-stone-900 hover:text-red-700 font-medium"
                      >
                        Attendees
                      </Link>
                      <span className="text-stone-300">·</span>
                      <Link
                        href={`/organizer/events/${evt.id}/check-in`}
                        className="text-red-700 hover:text-red-900 font-bold"
                      >
                        Gate Scanner
                      </Link>
                      <span className="text-stone-300">·</span>
                      <Link
                        href={`/organizer/events/${evt.id}`}
                        className="text-stone-600 hover:text-stone-950 font-medium"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lower Grid: Recent Reservations & Audit Trail */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Reservations */}
          <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
            <span className="text-2xs font-mono uppercase tracking-widest text-stone-400">Transactions</span>
            <h2 className="text-base font-serif font-bold text-stone-900">Recent Buyer Reservations</h2>

            <div className="divide-y divide-stone-100 text-xs">
              {overview.recentReservations.length === 0 ? (
                <p className="text-stone-500 py-4">No reservations recorded yet.</p>
              ) : (
                overview.recentReservations.map((res) => (
                  <div key={res.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-stone-900 block">{res.buyer_name}</span>
                      <span className="text-stone-500 text-2xs font-mono">{res.event_title}</span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-mono text-2xs font-semibold ${
                          res.status === 'CONFIRMED'
                            ? 'text-emerald-700'
                            : res.status === 'EXPIRED'
                            ? 'text-stone-400'
                            : res.status === 'CANCELLED'
                            ? 'text-red-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {res.status}
                      </span>
                      <span className="text-stone-400 block text-2xs font-mono">
                        ${(res.total_amount_in_cents / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Audit Event Stream */}
          <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
            <span className="text-2xs font-mono uppercase tracking-widest text-stone-400">Integrity Log</span>
            <h2 className="text-base font-serif font-bold text-stone-900">Authoritative Audit Trail</h2>

            <div className="space-y-3 text-xs">
              {overview.recentAudit.map((aud) => (
                <div key={aud.id} className="p-2.5 bg-stone-50 rounded-lg border border-stone-100 space-y-1">
                  <div className="flex items-center justify-between text-2xs font-mono">
                    <span className="font-bold text-stone-800">{aud.action}</span>
                    <span className="text-stone-400">{new Date(aud.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-2xs text-stone-600 font-mono truncate">
                    Actor: {aud.actor_email} · Target: {aud.target_type}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
