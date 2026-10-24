import { NextResponse } from 'next/server';
import { query } from '@/lib/db/database';

export async function GET() {
  try {
    const dbCheck = await query('SELECT 1 as healthy');
    return NextResponse.json({
      status: 'healthy',
      database: dbCheck.rows[0]?.healthy === 1 ? 'connected' : 'error',
      engine: 'PostgreSQL (Embedded / PGlite)',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'degraded', error: err.message },
      { status: 500 }
    );
  }
}
