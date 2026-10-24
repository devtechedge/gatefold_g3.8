import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ReservationService } from '@/lib/services/reservation-service';
import { TicketService } from '@/lib/services/ticket-service';
import TicketBadge from '@/components/TicketBadge';
import { CheckCircle2, ArrowRight, Printer, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ReservationTokenPage({
  params,
}: {
  params: Promise<{ publicToken: string }>;
}) {
  const { publicToken } = await params;
  const reservation = await ReservationService.getReservationByPublicToken(publicToken);

  if (!reservation) {
    notFound();
  }

  // Generate QR codes for all issued tickets
  const ticketsWithQrs = await Promise.all(
    (reservation.tickets || []).map(async (tkt) => {
      const qrDataUrl = await TicketService.generateQrCodeDataUrl(tkt.qrPayload);
      return {
        ...tkt,
        event: reservation.event,
        qrDataUrl,
      };
    })
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-10">
        {/* Success Header */}
        <div className="bg-white border border-stone-200 rounded-xl p-8 shadow-xs text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-800">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <span className="text-2xs font-mono uppercase tracking-widest text-emerald-700 font-semibold block">
            Confirmed & Issued
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
            {reservation.event?.title}
          </h1>
          <p className="text-sm text-stone-600 max-w-lg mx-auto">
            Your admission tickets have been issued with tamper-resistant HMAC cryptographic signatures. Present these QR codes at the gate for entry.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-stone-500">
            <span>Reference: {reservation.id}</span>
            <span aria-hidden="true">·</span>
            <span>Token: {reservation.publicToken.substring(0, 16)}...</span>
            <span aria-hidden="true">·</span>
            <span className="text-stone-900 font-semibold">{reservation.tickets?.length || 0} Tickets Active</span>
          </div>
        </div>

        {/* Issued Tickets Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-stone-400">Gate Passes</span>
              <h2 className="text-xl font-serif font-bold text-stone-900">Issued Tickets</h2>
            </div>
            <div className="text-xs text-stone-500 flex items-center gap-1 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Authoritative QR verification enabled</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {ticketsWithQrs.map((tkt) => (
              <div key={tkt.id} className="space-y-3">
                <TicketBadge ticket={tkt as any} qrDataUrl={tkt.qrDataUrl} />
                <div className="text-center">
                  <Link
                    href={`/ticket/${tkt.publicId}`}
                    className="text-xs font-medium text-stone-700 hover:text-stone-950 inline-flex items-center gap-1 font-mono"
                  >
                    <span>Open standalone ticket pass</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Order Ledger */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
          <span className="text-2xs font-mono uppercase tracking-widest text-stone-400">Authoritative Ledger</span>
          <h2 className="text-base font-serif font-bold text-stone-900">
            Reservation Record & Audit
          </h2>

          <div className="space-y-2 text-xs divide-y divide-stone-100">
            <div className="flex justify-between py-2">
              <span className="text-stone-500">Buyer</span>
              <span className="font-medium text-stone-900">{reservation.buyerName} ({reservation.buyerEmail})</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-stone-500">Total Volume</span>
              <span className="font-mono text-stone-900">${(reservation.totalAmountInCents / 100).toFixed(2)} USD</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-stone-500">Confirmed At</span>
              <span className="font-mono text-stone-900">
                {reservation.confirmedAt ? new Date(reservation.confirmedAt).toUTCString() : 'Confirmed'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-stone-500">Inventory Status</span>
              <span className="font-mono text-emerald-700 font-semibold">TRANSFERRED FROM HELD TO SOLD</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
