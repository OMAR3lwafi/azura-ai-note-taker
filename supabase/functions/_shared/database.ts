// Database query wrapper with consistent error handling
import type { PostgrestError } from "@supabase/supabase-js";

export interface QueryResult<T> {
  data: T | null;
  error: PostgrestError | null;
}

/**
 * Wraps a database query and ensures error is checked
 * Throws an error if the query fails to make error handling explicit
 */
export async function executeQuery<T>(
  queryPromise: Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<T> {
  const { data, error } = await queryPromise;
  
  if (error) {
    throw new DatabaseError(error.message, error.code, error.details);
  }
  
  if (data === null) {
    throw new DatabaseError("Query returned no data", "NO_DATA");
  }
  
  return data;
}

/**
 * Wraps a database query that may return null (e.g., maybeSingle)
 */
export async function executeQueryMaybe<T>(
  queryPromise: Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<T | null> {
  const { data, error } = await queryPromise;
  
  if (error) {
    throw new DatabaseError(error.message, error.code, error.details);
  }
  
  return data;
}

/**
 * Custom database error class
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: string
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}
