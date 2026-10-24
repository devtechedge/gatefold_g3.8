import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-8 font-sans">
        <div className="border-b border-stone-200 pb-4">
          <span className="text-2xs font-mono uppercase tracking-widest text-stone-400">Institutional Governance</span>
          <h1 className="text-3xl font-serif font-bold text-stone-900 mt-1">
            Terms of Demonstration & Service
          </h1>
          <p className="text-xs text-stone-500 font-mono mt-1">Version 1.0 · Updated October 2026</p>
        </div>

        <div className="space-y-6 text-sm text-stone-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-stone-900">1. Simulated Demonstration Environment</h2>
            <p>
              Gatefold is an event publishing, ticket inventory, atomic reservation, and check-in platform. In this release, all ticket reservations, checkouts, and financial transactions are strictly simulated. No actual financial charges are incurred, no live payment credentials are required, and no credit card billing takes place.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-stone-900">2. Inventory Holds & Deadlines</h2>
            <p>
              To prevent hoarding and starvation in scarce inventory scenarios, ticket selections trigger a server-enforced atomic hold lasting exactly ten (10) minutes. If checkout confirmation is not received before this deadline, the hold is marked EXPIRED and all held tickets immediately return to the public pool.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-stone-900">3. Tamper-Resistant Ticket Verification</h2>
            <p>
              Issued tickets contain an unpredictable alphanumeric serial and a cryptographically signed HMAC-SHA256 QR code. Gate check-in verifies both the signature and the authoritative database status. A ticket may be checked in exactly once; repeated scans return ALREADY_USED with the original timestamp.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-stone-900">4. Cancellation & Refund Policy</h2>
            <p>
              Event organizers may specify individual cancellation windows. When an event is cancelled by the institution, all active holds are safely released, and confirmed tickets are transitioned to CANCELLED in authoritative records.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
