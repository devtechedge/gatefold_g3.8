import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-8 font-sans">
        <div className="border-b border-stone-200 pb-4">
          <span className="text-2xs font-mono uppercase tracking-widest text-stone-400">Institutional Governance</span>
          <h1 className="text-3xl font-serif font-bold text-stone-900 mt-1">
            Accessibility Statement
          </h1>
          <p className="text-xs text-stone-500 font-mono mt-1">WCAG 2.2 AA Compliance Target · October 2026</p>
        </div>

        <div className="space-y-6 text-sm text-stone-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-stone-900">1. Standards Commitment</h2>
            <p>
              Gatefold is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for all visitors and apply the relevant accessibility standards based on the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-stone-900">2. Interactive Assistive Technology Provisions</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone-600">
              <li>Semantic HTML elements throughout (headings, articles, lists, navigation regions, native inputs, and dialogs).</li>
              <li>Visible high-contrast focus indicators on all interactive buttons, links, and form fields.</li>
              <li>Live ARIA announcements for critical status transitions such as scanner outcomes and hold expirations.</li>
              <li>Color is never used as the sole indicator of ticket status or transaction outcome.</li>
              <li>Respect for system-level <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">prefers-reduced-motion</code> settings.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-serif font-bold text-stone-900">3. Physical Venue Accessibility Disclosures</h2>
            <p>
              Every published event occurrence includes a structured accessibility metadata disclosure, detailing step-free level entry, hearing loop availability, and restroom locations.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
