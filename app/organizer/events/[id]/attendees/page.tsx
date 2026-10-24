import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { query } from '@/lib/db/database';
import { EventService } from '@/lib/services/event-service';
import { ArrowLeft, Search, ShieldCheck, Download } from 'lucide-react';
import AttendeesClient from '@/components/AttendeesClient';

export const dynamic = 'force-dynamic';

export default async function AttendeesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventRes = await query(`SELECT * FROM events WHERE id = $1`, [id]);
  if (eventRes.rows.length === 0) {
    notFound();
  }
  const event = eventRes.rows[0];
  const attendees = await EventService.getAttendeesForEvent(id);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-6">
        <div>
          <Link
            href="/organizer"
            className="text-xs font-mono text-stone-600 hover:text-stone-900 inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Organizer Console</span>
          </Link>
        </div>

        <AttendeesClient event={event} initialAttendees={attendees} />
      </main>

      <Footer />
    </div>
  );
}
