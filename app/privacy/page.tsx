import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-8 font-sans">
        <div className="border-b border-stone-200 pb-4">
          <span className="text-2xs font-mono uppercase tracking-widest text-stone-400">Institutional Governance</span>
          <h1 className="text-3xl font-serif font-bold text-stone-900 mt-1">
            Privacy & Data Retention Notice
          </h1>
          <p className="text-xs text-stone-500 font-mono mt-1">Version 1.0 · Updated October 2026</p>
        </div>

        <div className="space-y-6 text-sm text-stone-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-stone-900">1. Data Collected During Demonstration</h2>
            <p>
              When evaluating Gatefold, user-entered buyer names, email addresses, and optional attendee preferences are persisted strictly within the demonstration PostgreSQL instance to facilitate ticket issuance, reservation lookup, and check-in audits.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-stone-900">2. No Third-Party Telemetry or Ad Trackers</h2>
            <p>
              Gatefold does not integrate third-party advertising cookies, external behavioral tracking pixels, or monetized data brokers. All state transitions, token resolutions, and QR scans operate directly against the authoritative platform backend.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-stone-900">3. Cryptographic Token Protection</h2>
            <p>
              Reservation access URLs employ high-entropy opaque tokens. QR code payloads contain HMAC signatures derived using a server-side secret key; attendee personally identifiable information (PII) is never serialized directly into raw QR codes.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
