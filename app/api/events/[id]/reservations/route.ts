import { NextRequest, NextResponse } from 'next/server';
import { ReservationService } from '@/lib/services/reservation-service';
import { query } from '@/lib/db/database';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Resolve id to eventId if slug passed
    let eventId = id;
    if (!id.startsWith('evt_')) {
      const lookup = await query(`SELECT id FROM events WHERE slug = $1`, [id]);
      if (lookup.rows.length > 0) {
        eventId = lookup.rows[0].id;
      }
    }

    const body = await req.json();
    const idempotencyKey = req.headers.get('x-idempotency-key') || body.idempotencyKey;

    const reservation = await ReservationService.createHold({
      eventId,
      buyerName: body.buyerName,
      buyerEmail: body.buyerEmail,
      buyerNotes: body.buyerNotes,
      lines: body.lines,
      idempotencyKey,
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (err: any) {
    const statusMap: Record<string, number> = {
      VALIDATION_ERROR: 400,
      NOT_FOUND: 404,
      CONFLICT: 409,
      SOLD_OUT: 409,
      HOLD_EXPIRED: 410,
    };
    const status = statusMap[err.code] || 500;
    return NextResponse.json({ error: err.message, code: err.code || 'INTERNAL_ERROR' }, { status });
  }
}
