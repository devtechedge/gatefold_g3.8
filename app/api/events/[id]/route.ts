import { NextRequest, NextResponse } from 'next/server';
import { EventService } from '@/lib/services/event-service';
import { query } from '@/lib/db/database';
import { getCurrentUser, canManageEvents } from '@/lib/auth/session';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Support lookup by slug or id
    let event = await EventService.getEventBySlug(id);
    if (!event) {
      // Lookup slug from id
      const lookup = await query(`SELECT slug FROM events WHERE id = $1`, [id]);
      if (lookup.rows.length > 0) {
        event = await EventService.getEventBySlug(lookup.rows[0].slug);
      }
    }

    if (!event) {
      return NextResponse.json({ error: 'Event not found', code: 'NOT_FOUND' }, { status: 404 });
    }
    return NextResponse.json(event);
  } catch (err: any) {
    return NextResponse.json({ error: err.message, code: err.code || 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!canManageEvents(user.role)) {
      return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    // Resolve event id if slug passed
    let eventId = id;
    if (!id.startsWith('evt_')) {
      const lookup = await query(`SELECT id FROM events WHERE slug = $1`, [id]);
      if (lookup.rows.length > 0) {
        eventId = lookup.rows[0].id;
      }
    }

    if (body.status) {
      const result = await EventService.setEventStatus(eventId, body.status, user.id);
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, code: err.code || 'INTERNAL_ERROR' }, { status: 500 });
  }
}
