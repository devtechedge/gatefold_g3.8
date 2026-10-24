import { NextRequest, NextResponse } from 'next/server';
import { EventService } from '@/lib/services/event-service';
import { getCurrentUser, canManageEvents } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await EventService.getPublicEvents({ search, category, limit, offset });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message, code: err.code || 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!canManageEvents(user.role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges', code: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await req.json();
    const result = await EventService.createEvent(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message, code: err.code || 'INTERNAL_ERROR' },
      { status: err.code === 'VALIDATION_ERROR' ? 400 : 500 }
    );
  }
}
