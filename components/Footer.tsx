import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <span className="font-serif tracking-tight text-2xl text-white font-medium">GATEFOLD</span>
            <p className="mt-2 text-sm text-stone-400 max-w-sm">
              Event publishing, atomic inventory holds, ticket issuance, and attendee check-in infrastructure for independent institutions, festivals, and cultural venues.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-stone-500 font-mono">
              <span>PostgreSQL Transaction Invariants</span>
              <span aria-hidden="true">·</span>
              <span>HMAC-SHA256 Signed QRs</span>
              <span aria-hidden="true">·</span>
              <span>ACID Guarantees</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-widest text-stone-400 font-mono mb-3">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/events" className="hover:text-white transition-colors">
                  Public Programme
                </Link>
              </li>
              <li>
                <Link href="/organizer" className="hover:text-white transition-colors">
                  Organizer Console
                </Link>
              </li>
              <li>
                <Link href="/organizer/events/evt_symposium/check-in" className="hover:text-white transition-colors">
                  Gate Check-In Scanner
                </Link>
              </li>
              <li>
                <Link href="/organizer/team" className="hover:text-white transition-colors">
                  Staff & Roles
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-widest text-stone-400 font-mono mb-3">Integrity & Policies</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Simulated Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy & Data Retention
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className="hover:text-white transition-colors">
                  Accessibility Statement
                </Link>
              </li>
              <li>
                <a href="/api/health" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Health Status
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} Gatefold Systems. Prototype release — demo payments only, no real currency processed.</p>
          <p className="font-mono">WCAG 2.2 AA compliant · Strict PostgreSQL Invariants</p>
        </div>
      </div>
    </footer>
  );
}
