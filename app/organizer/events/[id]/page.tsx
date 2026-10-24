import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { query } from '@/lib/db/database';
import { getCurrentUser } from '@/lib/auth/session';
import EventManageClient from '@/components/EventManageClient';

export const dynamic = 'force-dynamic';

export default async function EventManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const eventRes = await query(
    `SELECT e.*, v.name as venue_name, v.city as venue_city 
     FROM events e 
     LEFT JOIN venues v ON v.id = e.venue_id 
     WHERE e.id = $1`,
    [id]
  );

  if (eventRes.rows.length === 0) {
    notFound();
  }
  const event = eventRes.rows[0];

  const ticketsRes = await query(
    `SELECT tt.*, ti.capacity, ti.held, ti.sold 
     FROM ticket_types tt 
     LEFT JOIN ticket_inventory ti ON ti.ticket_type_id = tt.id 
     WHERE tt.event_id = $1`,
    [id]
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        <EventManageClient
          event={event}
          ticketTypes={ticketsRes.rows}
          user={user}
        />
      </main>

      <Footer />
    </div>
  );
}
