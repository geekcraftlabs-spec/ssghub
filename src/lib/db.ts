// src/lib/db.ts
import { Pool, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn('⚠️ DATABASE_URL not set');
      return null;
    }
    pool = new Pool({ 
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

type QueryParams = (string | number | boolean | null)[];

// Create an empty result for when DB is not available
const emptyResult: QueryResult = {
  rows: [],
  rowCount: 0,
  command: '',
  oid: 0,
  fields: []
};

export const db = {
  query: async (text: string, params?: QueryParams): Promise<QueryResult> => {
    const pool = getPool();
    if (!pool) {
      console.warn('⚠️ Database not available, returning empty result');
      return emptyResult;
    }
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      return emptyResult;
    }
  },

  findOne: async <T extends QueryResultRow = QueryResultRow>(
    table: string, 
    where: Record<string, string | number | boolean | null>
  ): Promise<T | null> => {
    const keys = Object.keys(where);
    if (keys.length === 0) return null;
    const conditions = keys.map((key, i) => `"${key}" = $${i + 1}`).join(' AND ');
    const values = Object.values(where);
    const result = await db.query(`SELECT * FROM "${table}" WHERE ${conditions} LIMIT 1`, values);
    return (result.rows[0] as T) || null;
  },

  findMany: async <T extends QueryResultRow = QueryResultRow>(
    table: string, 
    where: Record<string, string | number | boolean | null> = {}
  ): Promise<T[]> => {
    const keys = Object.keys(where);
    if (keys.length === 0) {
      const result = await db.query(`SELECT * FROM "${table}"`);
      return result.rows as T[];
    }
    const conditions = keys.map((key, i) => `"${key}" = $${i + 1}`).join(' AND ');
    const values = Object.values(where);
    const result = await db.query(`SELECT * FROM "${table}" WHERE ${conditions}`, values);
    return result.rows as T[];
  },

  create: async <T extends QueryResultRow = QueryResultRow>(
    table: string, 
    data: Record<string, string | number | boolean | null>
  ): Promise<T | null> => {
    const keys = Object.keys(data);
    if (keys.length === 0) return null;
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.map(key => `"${key}"`).join(', ');
    const result = await db.query(
      `INSERT INTO "${table}" (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    return (result.rows[0] as T) || null;
  },

  update: async <T extends QueryResultRow = QueryResultRow>(
    table: string, 
    id: string, 
    data: Record<string, string | number | boolean | null>
  ): Promise<T | null> => {
    const keys = Object.keys(data);
    if (keys.length === 0) return null;
    const setClause = keys.map((key, i) => `"${key}" = $${i + 1}`).join(', ');
    const values = [...Object.values(data), id];
    const result = await db.query(
      `UPDATE "${table}" SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
      values
    );
    return (result.rows[0] as T) || null;
  }
};

export default db;