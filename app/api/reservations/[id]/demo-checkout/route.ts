import { NextRequest, NextResponse } from 'next/server';
import { ReservationService } from '@/lib/services/reservation-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const result = await ReservationService.completeDemoCheckout(id, body.attendees);
    return NextResponse.json(result);
  } catch (err: any) {
    const statusMap: Record<string, number> = {
      NOT_FOUND: 404,
      HOLD_EXPIRED: 410,
      INVALID_STATE: 400,
      CONFLICT: 409,
    };
    const status = statusMap[err.code] || 500;
    return NextResponse.json({ error: err.message, code: err.code || 'INTERNAL_ERROR' }, { status });
  }
}
