import { NextRequest, NextResponse } from 'next/server';
import { TicketService } from '@/lib/services/ticket-service';
import { getCurrentUser, canCheckIn } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!canCheckIn(user.role)) {
      return NextResponse.json({ error: 'Unauthorized staff member', code: 'UNAUTHORIZED' }, { status: 403 });
    }

    const body = await req.json();
    if (!body.qrPayloadOrCode) {
      return NextResponse.json({ error: 'Ticket code or QR payload required', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const result = await TicketService.verifyAndCheckIn({
      qrPayloadOrCode: body.qrPayloadOrCode,
      staffUser: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      gateOrDevice: body.gateOrDevice || 'Main Scanner 1',
      eventId: body.eventId,
      notes: body.notes,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message, code: err.code || 'INTERNAL_ERROR' }, { status: 500 });
  }
}
