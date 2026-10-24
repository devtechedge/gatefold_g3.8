import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ReservationService } from '@/lib/services/reservation-service';
import CheckoutClient from '@/components/CheckoutClient';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ reservationId: string }>;
}) {
  const { reservationId } = await params;
  const reservation = await ReservationService.getReservationById(reservationId);

  if (!reservation) {
    notFound();
  }

  // If already confirmed, redirect directly to public reservation token view
  if (reservation.status === 'CONFIRMED') {
    redirect(`/reservation/${reservation.publicToken}`);
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <CheckoutClient reservation={reservation} />
      </main>

      <Footer />
    </div>
  );
}
