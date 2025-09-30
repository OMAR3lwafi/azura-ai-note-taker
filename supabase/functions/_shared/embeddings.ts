// Embeddings: semantic search via pgvector
import { adminClient } from "./supabase.ts";

const EMBEDDING_PROVIDER = Deno.env.get("EMBEDDING_PROVIDER") || "openai";
const EMBEDDING_API_KEY = Deno.env.get("EMBEDDING_API_KEY") || Deno.env.get("LLM_API_KEY") || "";
const EMBEDDING_MODEL = Deno.env.get("EMBEDDING_MODEL") || "text-embedding-3-small";

// Generate embedding vector for text
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!EMBEDDING_API_KEY) {
    throw new Error("EMBEDDING_API_KEY not configured");
  }

  try {
    if (EMBEDDING_PROVIDER === "openai") {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${EMBEDDING_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: text.substring(0, 8000), // Limit text length
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Embedding API error");
      }

      return data.data[0].embedding;
    }

    throw new Error(`Unsupported embedding provider: ${EMBEDDING_PROVIDER}`);
  } catch (error) {
    console.error("Embedding generation error:", error);
    throw error;
  }
}

// Store embedding for a segment
export async function storeSegmentEmbedding(segmentId: string, text: string): Promise<void> {
  const embedding = await generateEmbedding(text);
  const supa = adminClient();

  const { error } = await supa
    .from("segments")
    .update({ embedding })
    .eq("id", segmentId);

  if (error) {
    throw new Error(`Failed to store embedding: ${error.message}`);
  }
}

// Backfill embeddings for segments without them
export async function backfillEmbeddings(batchSize: number = 50): Promise<number> {
  const supa = adminClient();

  // Get segments without embeddings
  const { data: segments } = await supa
    .from("segments")
    .select("id, text")
    .is("embedding", null)
    .limit(batchSize);

  if (!segments || segments.length === 0) {
    return 0;
  }

  let processed = 0;
  for (const segment of segments) {
    try {
      await storeSegmentEmbedding(segment.id, segment.text);
      processed++;
    } catch (error) {
      console.error(`Failed to backfill embedding for segment ${segment.id}:`, error);
    }
  }

  console.log(`Backfilled ${processed} embeddings`);
  return processed;
}

// Semantic search using kNN
export async function semanticSearch(
  userId: string,
  query: string,
  limit: number = 10,
  meetingId?: string
): Promise<any[]> {
  const queryEmbedding = await generateEmbedding(query);
  const supa = adminClient();

  // Use pgvector's <-> operator for cosine distance
  let rpcQuery = supa.rpc("search_segments_semantic", {
    query_embedding: queryEmbedding,
    match_count: limit,
    filter_user_id: userId,
  });

  if (meetingId) {
    rpcQuery = rpcQuery.eq("meeting_id", meetingId);
  }

  const { data, error } = await rpcQuery;

  if (error) {
    console.error("Semantic search error:", error);
    throw new Error(`Semantic search failed: ${error.message}`);
  }

  return data || [];
}
