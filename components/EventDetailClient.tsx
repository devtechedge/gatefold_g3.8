'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, MapPin, ShieldCheck, Ticket, AlertTriangle } from 'lucide-react';
import type { Event, TicketTypeWithInventory } from '@/lib/types';
import ReservationModal from './ReservationModal';

interface EventDetailClientProps {
  event: Event;
}

export default function EventDetailClient({ event }: EventDetailClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const ticketTypes = (event.ticketTypes || []) as TicketTypeWithInventory[];

  const isCancelled = event.status === 'CANCELLED';
  const isDraft = event.status === 'DRAFT';
  const totalRemaining = ticketTypes.reduce((acc, t) => acc + t.remainingCapacity, 0);
  const isSoldOut = totalRemaining === 0 && ticketTypes.length > 0;

  return (
    <div>
      {/* Cancellation Banner */}
      {isCancelled && (
        <div className="bg-red-700 text-white py-3 px-4 text-center text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-white shrink-0" />
          <span>Notice: This event has been cancelled by the host institution. New reservations are closed.</span>
        </div>
      )}

      {/* Hero Visual Marquee */}
      <div className="relative h-72 sm:h-96 w-full bg-stone-900 overflow-hidden">
        {event.heroImage ? (
          <Image
            src={event.heroImage}
            alt={event.title}
            fill
            priority
            className="object-cover opacity-85"
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full bg-stone-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

        <div className="absolute bottom-0 inset-x-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 text-white">
          <div className="flex items-center gap-2 text-2xs font-mono uppercase tracking-widest text-stone-300 mb-2">
            <span>{event.category}</span>
            <span aria-hidden="true">·</span>
            <span>Gatefold Archive</span>
            <span aria-hidden="true">·</span>
            <span className={isCancelled ? 'text-red-400' : 'text-emerald-400'}>{event.status}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-white max-w-3xl leading-tight">
            {event.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-stone-300 font-mono">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-stone-400" />
              <span>{new Date(event.startDate).toLocaleDateString(undefined, { dateStyle: 'full' })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-stone-400" />
              <span>Doors: {event.doorsOpenTime || 'See Schedule'} ({event.timezone})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-stone-400" />
              <span>{event.venue?.name}, {event.venue?.city}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Narrative, Programme, Venue, Policies */}
          <div className="lg:col-span-8 space-y-10">
            {/* Short Narrative */}
            <div>
              <p className="text-lg sm:text-xl text-stone-800 leading-relaxed font-sans font-normal border-b border-stone-200 pb-6">
                {event.shortDescription}
              </p>
            </div>

            {/* Long Description */}
            <div className="prose prose-stone max-w-none text-stone-700 text-sm sm:text-base leading-relaxed space-y-4">
              <h2 className="text-lg font-serif font-bold text-stone-900 border-b border-stone-200 pb-2">
                Curatorial Statement & Overview
              </h2>
              <div className="whitespace-pre-line font-sans text-stone-600">
                {event.description}
              </div>
            </div>

            {/* Schedule & Timing */}
            <div className="border border-stone-200 rounded-xl p-6 bg-white space-y-4">
              <h2 className="text-base font-serif font-bold text-stone-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-stone-700" />
                <span>Timezone-Aware Schedule</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-stone-700">
                <div className="p-3 bg-stone-50 rounded-lg">
                  <span className="text-stone-400 uppercase tracking-wider block text-2xs">Convenes</span>
                  <span className="font-semibold text-stone-900 block mt-1">
                    {new Date(event.startDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-stone-500 block">{event.doorsOpenTime} ({event.timezone})</span>
                </div>
                <div className="p-3 bg-stone-50 rounded-lg">
                  <span className="text-stone-400 uppercase tracking-wider block text-2xs">Concludes</span>
                  <span className="font-semibold text-stone-900 block mt-1">
                    {new Date(event.endDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-stone-500 block">Venue closing hours apply</span>
                </div>
              </div>
            </div>

            {/* Venue & Accessibility */}
            <div className="border border-stone-200 rounded-xl p-6 bg-white space-y-3">
              <h2 className="text-base font-serif font-bold text-stone-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-stone-700" />
                <span>Location & Venue Accessibility</span>
              </h2>
              <div className="text-xs text-stone-700 space-y-2">
                <p className="font-medium text-stone-900">
                  {event.venue?.name} — {event.venue?.address}, {event.venue?.city}, {event.venue?.country}
                </p>
                {event.venue?.accessibilityNotes && (
                  <p className="text-stone-600 bg-stone-50 p-3 rounded-lg border border-stone-100">
                    <strong className="text-stone-900 block mb-0.5">Accessibility notes:</strong>
                    {event.venue.accessibilityNotes}
                  </p>
                )}
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="border border-stone-200 rounded-xl p-6 bg-white space-y-2">
              <h2 className="text-base font-serif font-bold text-stone-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-stone-700" />
                <span>Cancellation & Transfer Policy</span>
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                {event.cancellationPolicy}
              </p>
              <p className="text-2xs text-stone-400 font-mono">
                Note: In this preview release, all reservations utilize simulated checkout. No real funds are collected.
              </p>
            </div>
          </div>

          {/* Right Column: Sticky Admission & Inventory Panel */}
          <div className="lg:col-span-4 sticky top-24 space-y-6">
            <div className="bg-white border border-stone-200/90 rounded-xl p-6 shadow-xs space-y-6">
              <div className="border-b border-stone-100 pb-4">
                <span className="text-2xs font-mono uppercase tracking-widest text-stone-400">Available Admission Tiers</span>
                <h2 className="text-lg font-serif font-bold text-stone-900 mt-1">
                  Ticket Inventory
                </h2>
              </div>

              {/* Ticket Type Rows */}
              <div className="space-y-3">
                {ticketTypes.map((tkt) => {
                  const isSold = tkt.remainingCapacity <= 0;
                  const isScarce = tkt.remainingCapacity > 0 && tkt.remainingCapacity <= 3;

                  return (
                    <div
                      key={tkt.id}
                      className="p-3.5 border border-stone-200 rounded-lg bg-stone-50/50 space-y-1.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xs font-semibold text-stone-900">{tkt.name}</h3>
                          <p className="text-2xs text-stone-500 mt-0.5">{tkt.description}</p>
                        </div>
                        <span className="font-mono text-xs font-bold text-stone-900 ml-2">
                          ${(tkt.priceInCents / 100).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-2xs font-mono">
                        <span className="text-stone-500">Max {tkt.maxPerOrder} per order</span>
                        {isSold ? (
                          <span className="text-stone-400 font-semibold uppercase">Sold out</span>
                        ) : isScarce ? (
                          <span className="text-red-700 font-semibold">{tkt.remainingCapacity} remaining</span>
                        ) : (
                          <span className="text-stone-600">{tkt.remainingCapacity} available</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Button */}
              <div>
                {isCancelled ? (
                  <button
                    disabled
                    className="w-full py-3 bg-stone-200 text-stone-500 text-xs font-semibold rounded-lg cursor-not-allowed"
                  >
                    Event Cancelled
                  </button>
                ) : isSoldOut ? (
                  <button
                    disabled
                    className="w-full py-3 bg-stone-200 text-stone-500 text-xs font-semibold rounded-lg cursor-not-allowed"
                  >
                    All Tiers Sold Out
                  </button>
                ) : (
                  <button
                    onClick={() => setModalOpen(true)}
                    className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>Select & Reserve Tickets</span>
                  </button>
                )}
                <p className="text-center text-2xs text-stone-400 font-mono mt-2.5">
                  10-minute hold · Transactional guarantee
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Booking Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-stone-200 py-3 px-6 pl-14 z-30 flex items-center justify-between shadow-md">
        <div>
          <span className="text-2xs font-mono text-stone-500 block">Admission</span>
          <span className="text-sm font-bold text-stone-900 font-mono">
            {ticketTypes[0] ? `$${(ticketTypes[0].priceInCents / 100).toFixed(2)}` : 'Entry'}
          </span>
        </div>

        <button
          disabled={isCancelled || isSoldOut}
          onClick={() => setModalOpen(true)}
          className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50 transition-colors"
        >
          {isCancelled ? 'Cancelled' : isSoldOut ? 'Sold Out' : 'Reserve'}
        </button>
      </div>

      {/* Reservation Hold Modal */}
      <ReservationModal
        event={event}
        ticketTypes={ticketTypes}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
