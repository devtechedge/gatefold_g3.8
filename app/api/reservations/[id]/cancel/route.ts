import { NextRequest, NextResponse } from 'next/server';
import { ReservationService } from '@/lib/services/reservation-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const actorId = body.actorId || 'buyer';

    const result = await ReservationService.cancelReservation(id, actorId);
    return NextResponse.json(result);
  } catch (err: any) {
    const status = err.code === 'NOT_FOUND' ? 404 : 500;
    return NextResponse.json({ error: err.message, code: err.code || 'INTERNAL_ERROR' }, { status });
  }
}
