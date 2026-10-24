import { NextResponse } from 'next/server';
import { ReservationService } from '@/lib/services/reservation-service';

export async function POST() {
  try {
    const result = await ReservationService.expirePendingHolds();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message, code: err.code || 'INTERNAL_ERROR' }, { status: 500 });
  }
}
