import { NextRequest, NextResponse } from 'next/server';
import { ReservationService } from '@/lib/services/reservation-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Also support lookup by public token if provided as id
    let reservation = await ReservationService.getReservationById(id);
    if (!reservation) {
      reservation = await ReservationService.getReservationByPublicToken(id);
    }

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json(reservation);
  } catch (err: any) {
    return NextResponse.json({ error: err.message, code: err.code || 'INTERNAL_ERROR' }, { status: 500 });
  }
}
