import { PGlite } from '@electric-sql/pglite';
import { MIGRATIONS_SQL } from './migrations';
import * as path from 'path';
import * as fs from 'fs';

// Global singleton for PGlite instance across Next.js dev server reloads
declare global {
  var _gatefoldDb: PGlite | undefined;
  var _gatefoldDbReady: Promise<void> | undefined;
}

const DATA_DIR = path.join(process.cwd(), '.data', 'gatefold.pg');

export async function getDb(): Promise<PGlite> {
  if (!global._gatefoldDb) {
    // On Vercel the filesystem is read-only outside /tmp, so the demo runs
    // against an in-memory PGlite instance that reseeds on every cold start.
    const useMemory = process.env.VERCEL === '1' || process.env.GATEFOLD_MEMORY_DB === '1';
    if (!useMemory && !fs.existsSync(path.dirname(DATA_DIR))) {
      fs.mkdirSync(path.dirname(DATA_DIR), { recursive: true });
    }

    const client = useMemory ? new PGlite() : new PGlite(DATA_DIR);
    global._gatefoldDb = client;

    // Run migrations once
    global._gatefoldDbReady = (async () => {
      await client.exec(MIGRATIONS_SQL);
      // Auto seed if empty
      const userCheck = await client.query('SELECT count(*) as count FROM users');
      const count = parseInt((userCheck.rows[0] as any)?.count || '0', 10);
      if (count === 0) {
        const { seedDatabase } = await import('./seed');
        await seedDatabase(client);
      }
    })();
  }

  if (global._gatefoldDbReady) {
    await global._gatefoldDbReady;
  }

  return global._gatefoldDb;
}

export interface QueryResult<T = any> {
  rows: T[];
  affectedRows: number;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
  const db = await getDb();
  const res = await db.query<T>(sql, params);
  return {
    rows: res.rows,
    affectedRows: res.affectedRows ?? res.rows.length,
  };
}

// Async mutex to serialize transactions on the embedded database connection
let _txQueue = Promise.resolve();

/**
 * Execute operations within a PostgreSQL transaction.
 * Serialized via transaction queue to maintain ACID isolation on the embedded connection.
 */
export async function withTransaction<T>(
  callback: (tx: {
    query: <R = any>(sql: string, params?: any[]) => Promise<QueryResult<R>>;
  }) => Promise<T>
): Promise<T> {
  const runTx = async (): Promise<T> => {
    const db = await getDb();
    await db.query('BEGIN');
    try {
      const tx = {
        query: async <R = any>(sql: string, params: any[] = []): Promise<QueryResult<R>> => {
          const res = await db.query<R>(sql, params);
          return {
            rows: res.rows,
            affectedRows: res.affectedRows ?? res.rows.length,
          };
        },
      };
      const result = await callback(tx);
      await db.query('COMMIT');
      return result;
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  };

  const nextTx = _txQueue.then(runTx, runTx);
  _txQueue = nextTx.then(
    () => {},
    () => {}
  );
  return nextTx;
}

export async function closeDb(): Promise<void> {
  if (global._gatefoldDb) {
    try {
      await global._gatefoldDb.close();
    } catch {
      // Ignore on exit
    }
    global._gatefoldDb = undefined;
    global._gatefoldDbReady = undefined;
  }
}
