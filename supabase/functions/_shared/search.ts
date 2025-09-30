// Full-text search with Arabic support (pg_trgm + tsvector)
import { adminClient } from "./supabase.ts";

// Normalize Arabic text for search
export function normalizeArabicText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u064B-\u065F]/g, "") // Remove diacritics
    .replace(/[\u0640]/g, "") // Remove tatweel
    .toLowerCase();
}

// Full-text search using tsvector
export async function fullTextSearch(
  userId: string,
  query: string,
  options: {
    meetingId?: string;
    language?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ results: any[]; total: number }> {
  const { meetingId, language = "ar", limit = 20, offset = 0 } = options;
  const supa = adminClient();

  // Normalize query for Arabic
  const normalizedQuery = language === "ar" ? normalizeArabicText(query) : query;

  // Build query
  let dbQuery = supa
    .from("segments")
    .select("*, meetings!inner(id, owner_id, title, tags)", { count: "exact" })
    .eq("meetings.owner_id", userId)
    .textSearch("search_vector", normalizedQuery, {
      type: "websearch",
      config: language === "ar" ? "arabic" : "english",
    });

  if (meetingId) {
    dbQuery = dbQuery.eq("meeting_id", meetingId);
  }

  dbQuery = dbQuery
    .order("start_ms", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await dbQuery;

  if (error) {
    console.error("Full-text search error:", error);
    throw new Error(`Search failed: ${error.message}`);
  }

  return {
    results: data || [],
    total: count || 0,
  };
}

// Trigram similarity search (for fuzzy matching)
export async function trigramSearch(
  userId: string,
  query: string,
  options: {
    meetingId?: string;
    similarity?: number;
    limit?: number;
  } = {}
): Promise<any[]> {
  const { meetingId, similarity = 0.3, limit = 20 } = options;
  const supa = adminClient();

  const { data, error } = await supa.rpc("search_segments_trigram", {
    search_query: query,
    similarity_threshold: similarity,
    filter_user_id: userId,
    filter_meeting_id: meetingId || null,
    result_limit: limit,
  });

  if (error) {
    console.error("Trigram search error:", error);
    throw new Error(`Trigram search failed: ${error.message}`);
  }

  return data || [];
}

// Combined search: trigram + full-text
export async function combinedSearch(
  userId: string,
  query: string,
  options: {
    meetingId?: string;
    language?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ results: any[]; total: number }> {
  const { limit = 20 } = options;

  // Try full-text first
  const ftResults = await fullTextSearch(userId, query, { ...options, limit });

  // If full-text returns few results, augment with trigram
  if (ftResults.results.length < limit / 2) {
    const trigramResults = await trigramSearch(userId, query, {
      ...options,
      limit: limit - ftResults.results.length,
    });

    // Merge and deduplicate
    const seenIds = new Set(ftResults.results.map((r) => r.id));
    const uniqueTrigram = trigramResults.filter((r) => !seenIds.has(r.id));

    return {
      results: [...ftResults.results, ...uniqueTrigram],
      total: ftResults.total + uniqueTrigram.length,
    };
  }

  return ftResults;
}
