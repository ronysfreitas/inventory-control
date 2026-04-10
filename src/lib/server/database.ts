import { Pool, type PoolClient, type QueryResultRow } from 'pg';

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      'Banco não configurado. Defina DATABASE_URL para usar dados reais do PostgreSQL.'
    );
    this.name = 'DatabaseNotConfiguredError';
  }
}

const globalForPg = globalThis as typeof globalThis & {
  __minasBrasilPool?: Pool;
};

function createPool() {
  const connectionString = import.meta.env.DATABASE_URL;

  if (!connectionString) {
    throw new DatabaseNotConfiguredError();
  }

  return new Pool({
    connectionString,
    ssl:
      import.meta.env.DATABASE_SSL === 'true'
        ? {
            rejectUnauthorized: false
          }
        : undefined
  });
}

export function isDatabaseConfigured() {
  return Boolean(import.meta.env.DATABASE_URL);
}

export function getPool() {
  if (!isDatabaseConfigured()) {
    throw new DatabaseNotConfiguredError();
  }

  if (!globalForPg.__minasBrasilPool) {
    globalForPg.__minasBrasilPool = createPool();
  }

  return globalForPg.__minasBrasilPool;
}

export async function query<T extends QueryResultRow>(
  text: string,
  values: unknown[] = []
): Promise<T[]> {
  const result = await getPool().query<T>(text, values);
  return result.rows;
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
) {
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
