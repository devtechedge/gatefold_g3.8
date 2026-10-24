import React from 'react';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { query } from '@/lib/db/database';
import { getCurrentUser } from '@/lib/auth/session';
import CheckInScannerClient from '@/components/CheckInScannerClient';

export const dynamic = 'force-dynamic';

export default async function CheckInPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const eventRes = await query(`SELECT * FROM events WHERE id = $1`, [id]);
  if (eventRes.rows.length === 0) {
    notFound();
  }
  const event = eventRes.rows[0];

  // Fetch attendees / tickets issued for this event
  const attendeesRes = await query(
    `SELECT it.id, it.public_id, it.attendee_name, it.status, it.qr_payload, tt.name as ticket_name, ci.scanned_at, ci.scanned_by_staff_name
     FROM issued_tickets it
     JOIN ticket_types tt ON tt.id = it.ticket_type_id
     LEFT JOIN check_ins ci ON ci.ticket_id = it.id
     WHERE it.occurrence_id IN (SELECT id FROM event_occurrences WHERE event_id = $1)
     ORDER BY it.issued_at ASC`,
    [id]
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-6">
        <CheckInScannerClient
          event={event}
          tickets={attendeesRes.rows}
          staffUser={user}
        />
      </main>

      <Footer />
    </div>
  );
}
