import React from 'react';
import Image from 'next/image';
import type { IssuedTicket } from '@/lib/types';

interface TicketBadgeProps {
  ticket: IssuedTicket;
  qrDataUrl: string;
}

export default function TicketBadge({ ticket, qrDataUrl }: TicketBadgeProps) {
  const isCheckedIn = ticket.status === 'CHECKED_IN';
  const isCancelled = ticket.status === 'CANCELLED';

  return (
    <article className="relative bg-white border border-stone-200/90 rounded-xl overflow-hidden shadow-sm max-w-md w-full mx-auto font-sans">
      {/* Top Banner */}
      <div className="bg-stone-900 text-white p-5">
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-stone-400">
          <span>GATEFOLD ISSUANCE</span>
          <span>{ticket.publicId}</span>
        </div>
        <h2 className="mt-2 text-xl font-serif font-bold text-stone-50 leading-snug">
          {ticket.event?.title || 'Cultural Programme Event'}
        </h2>
        <div className="mt-2 flex items-center gap-2 text-xs text-stone-300">
          <span>{ticket.event?.venue?.name || 'Main Hall'}</span>
          <span aria-hidden="true">·</span>
          <span>{ticket.event?.venue?.city || 'Berlin'}</span>
        </div>
      </div>

      {/* Ticket Details */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-stone-400 uppercase tracking-wider block font-mono">Attendee</span>
            <span className="font-semibold text-stone-900 text-sm mt-0.5 block truncate">
              {ticket.attendeeName}
            </span>
          </div>
          <div>
            <span className="text-stone-400 uppercase tracking-wider block font-mono">Tier</span>
            <span className="font-semibold text-stone-900 text-sm mt-0.5 block">
              {ticket.ticketType?.name || 'General Admission'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-stone-400 uppercase tracking-wider block font-mono">Date</span>
            <span className="text-stone-800 font-medium mt-0.5 block">
              {ticket.event?.startDate ? new Date(ticket.event.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Upcoming'}
            </span>
          </div>
          <div>
            <span className="text-stone-400 uppercase tracking-wider block font-mono">Doors Open</span>
            <span className="text-stone-800 font-medium mt-0.5 block">
              {ticket.event?.doorsOpenTime || 'See Schedule'}
            </span>
          </div>
        </div>

        {/* Perforated Divider */}
        <div className="relative py-2">
          <div className="border-t-2 border-dashed border-stone-200" />
          <div className="absolute -left-7 top-1 w-4 h-4 rounded-full bg-[#FAF8F5] border-r border-stone-200" />
          <div className="absolute -right-7 top-1 w-4 h-4 rounded-full bg-[#FAF8F5] border-l border-stone-200" />
        </div>

        {/* QR Code and Verification Status */}
        <div className="flex flex-col items-center justify-center pt-2">
          {qrDataUrl && (
            <div className="p-2 border border-stone-200 bg-white rounded-lg shadow-2xs">
              <Image
                src={qrDataUrl}
                alt={`QR code for ticket ${ticket.publicId}`}
                width={200}
                height={200}
                className="w-48 h-48 block"
                unoptimized
              />
            </div>
          )}

          <div className="mt-3 text-center">
            {isCheckedIn ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                ADMITTED & CHECKED IN
              </span>
            ) : isCancelled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-800 border border-red-200">
                <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
                CANCELLED / VOID
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200">
                <span className="w-2 h-2 rounded-full bg-stone-600 inline-block" />
                VALID · READY FOR GATE SCAN
              </span>
            )}

            <p className="mt-1.5 text-2xs text-stone-400 font-mono">
              Cryptographically signed with HMAC-SHA256 · Authoritative check-in only
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
