import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { EventService } from '@/lib/services/event-service';
import HomeEventGrid from '@/components/HomeEventGrid';

export const dynamic = 'force-dynamic';

export default async function EventsCatalogPage() {
  const { events } = await EventService.getPublicEvents({ limit: 50 });

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Header */}
        <div className="border-b border-stone-200 pb-8 mb-8">
          <div className="text-xs font-mono uppercase tracking-widest text-stone-400">
            Public Programme Catalogue
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 mt-2">
            Published Exhibitions & Performances
          </h1>
          <p className="mt-2 text-sm text-stone-600 max-w-2xl">
            Explore active cultural events, compare admission categories, inspect remaining inventory in real-time, and reserve guaranteed passes under server-enforced atomic hold limits.
          </p>
        </div>

        {/* Filterable Catalogue */}
        <HomeEventGrid initialEvents={events} />
      </main>

      <Footer />
    </div>
  );
}
