import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DEMO_USERS } from '@/lib/auth/session';
import type { OrganizerRole } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json();
    if (!role || !DEMO_USERS[role as OrganizerRole]) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const cookieStore = await cookies();
    cookieStore.set('gatefold_role', role, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ success: true, user: DEMO_USERS[role as OrganizerRole] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
