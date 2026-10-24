import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { EventService } from '@/lib/services/event-service';
import { ArrowRight, Calendar, MapPin, ShieldCheck, Ticket, Users } from 'lucide-react';
import HomeEventGrid from '@/components/HomeEventGrid';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { events } = await EventService.getPublicEvents({ limit: 12 });
  const featured = events.find((e) => e.slug === 'acoustic-space-symposium') || events[0];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col selection:bg-stone-900 selection:text-white">
      <Navbar />

      <main className="flex-1">
        {/* Marquee Hero Section */}
        <section className="border-b border-stone-200/80 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
              {/* Left Column: Hero Narrative */}
              <div className="lg:col-span-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-stone-500 mb-4">
                    <span>Curatorial Programme 2026</span>
                    <span aria-hidden="true">·</span>
                    <span>Volume IV</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-950 tracking-tight leading-tight text-balance">
                    {featured ? featured.title : 'Architectural Sound & Materiality'}
                  </h1>

                  <p className="mt-5 text-base sm:text-lg text-stone-600 leading-relaxed font-sans max-w-xl">
                    {featured
                      ? featured.shortDescription
                      : 'An authoritative platform for ticket inventory, atomic reservations, and tamper-resistant check-in.'}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-5 text-xs text-stone-600 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-stone-400" />
                      <span>
                        {featured ? new Date(featured.startDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Upcoming'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-stone-400" />
                      <span>{featured?.venue?.name}, {featured?.venue?.city}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-stone-100 flex flex-wrap items-center gap-4">
                  <Link
                    href={`/events/${featured?.slug || 'acoustic-space-symposium'}`}
                    className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white font-medium text-sm rounded-lg transition-colors inline-flex items-center gap-2 shadow-xs"
                  >
                    <span>Reserve Tickets</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/events"
                    className="px-5 py-3 border border-stone-300 hover:border-stone-400 text-stone-800 font-medium text-sm rounded-lg transition-colors"
                  >
                    Browse Full Programme
                  </Link>
                </div>
              </div>

              {/* Right Column: Hero Visual Artwork */}
              <div className="lg:col-span-6 relative min-h-[320px] sm:min-h-[420px] rounded-xl overflow-hidden shadow-xs border border-stone-200">
                {featured?.heroImage && (
                  <Image
                    src={featured.heroImage}
                    alt={featured.title}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white text-xs font-mono">
                    <p className="uppercase tracking-widest text-stone-300">Live Inventory</p>
                    <p className="text-sm font-sans font-medium mt-0.5">Authoritative PostgreSQL ACID Concurrency</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Operational Proof & Invariants Strip */}
        <section className="bg-stone-100/70 border-b border-stone-200 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-stone-700">
              <div className="flex items-start gap-3">
                <Ticket className="w-4 h-4 text-stone-900 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold text-stone-900">Atomic Inventory Holds</strong>
                  <span className="text-stone-500">10-minute server-enforced countdown with zero overselling</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-stone-900 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold text-stone-900">Signed QR Verification</strong>
                  <span className="text-stone-500">HMAC-SHA256 signatures validated against database state</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="w-4 h-4 text-stone-900 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold text-stone-900">Role-Scoped Operations</strong>
                  <span className="text-stone-500">Owner, Operations Manager, and Gate Staff access tiers</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-stone-900 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold text-stone-900">Simulated Demo Checkout</strong>
                  <span className="text-stone-500">Explicit test workflows without real financial transaction</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filterable Programme Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs uppercase tracking-widest text-stone-400 font-mono">Current Season</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
                Upcoming Public Events
              </h2>
            </div>
            <Link
              href="/events"
              className="text-xs font-semibold text-stone-700 hover:text-stone-950 flex items-center gap-1 group font-mono uppercase tracking-wider"
            >
              <span>View All Events</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <HomeEventGrid initialEvents={events} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
