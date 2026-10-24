import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { TicketService } from '@/lib/services/ticket-service';
import TicketBadge from '@/components/TicketBadge';
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function IndividualTicketPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const ticket = await TicketService.getTicketByPublicId(publicId);

  if (!ticket) {
    notFound();
  }

  const qrDataUrl = await TicketService.generateQrCodeDataUrl(ticket.qrPayload);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-lg mx-auto px-4 py-12 w-full space-y-6">
        <div>
          <Link
            href="/events"
            className="text-xs font-mono text-stone-600 hover:text-stone-900 inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Programme</span>
          </Link>
        </div>

        {/* Ticket Presentation */}
        <TicketBadge ticket={ticket} qrDataUrl={qrDataUrl} />

        {/* Check-In Audit Metadata Card */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-3 text-xs">
          <span className="text-2xs font-mono uppercase tracking-widest text-stone-400">Gate Verification Data</span>
          <div className="space-y-1.5 divide-y divide-stone-100">
            <div className="flex justify-between py-1">
              <span className="text-stone-500">Public Serial</span>
              <span className="font-mono font-semibold text-stone-900">{ticket.publicId}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-stone-500">HMAC Integrity</span>
              <span className="font-mono text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Valid Signature
              </span>
            </div>
            {ticket.checkIn && (
              <div className="flex justify-between py-1 bg-emerald-50 p-2 rounded">
                <span className="text-emerald-900 font-medium">Scanned At</span>
                <span className="font-mono text-emerald-800">
                  {new Date(ticket.checkIn.scannedAt).toLocaleTimeString()} ({ticket.checkIn.gateOrDevice})
                </span>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
