// Hono Edge Function: foundation endpoints and middleware
import { Hono } from "hono";
import { cors } from "../_shared/cors.ts";
import { withRequestId } from "../_shared/logging.ts";
import { requireAuth } from "../_shared/auth.ts";
import { adminClient } from "../_shared/supabase.ts";
import { issueSttToken } from "../_shared/stt.ts";
import { getUserId, getUser, getRequestId } from "../_shared/context.ts";
import { executeQuery, executeQueryMaybe, DatabaseError } from "../_shared/database.ts";
import { 
  aiRateLimit, 
  meetingRateLimit, 
  exportRateLimit, 
  searchRateLimit 
} from "../_shared/rate-limit.ts";
import { captureException, setUser, addBreadcrumb } from "../_shared/sentry.ts";
import {
  CreateMeetingSchema,
  UpdateProfileSchema,
  BatchSegmentsSchema,
  SummarizeSchema,
  ExportSchema,
  IntegrationPushSchema,
  IngestAudioSchema,
  ApiKeyGenerationSchema,
  UpdateSpeakerSchema,
  MeetingsQuerySchema,
  SearchQuerySchema,
  SemanticSearchQuerySchema,
} from "../_shared/validation.ts";

const app = new Hono();

// Global middlewares
app.use("*", cors);
app.use("*", withRequestId);

// Health
app.get("/health", (c) => c.json({ ok: true, request_id: getRequestId(c) }));

// Protected routes
app.use("/auth/*", requireAuth);
app.use("/v1/*", requireAuth);

// Auth: profile
app.get("/auth/profile", async (c) => {
  const userId = getUserId(c);
  const supa = adminClient();
  
  try {
    const data = await executeQueryMaybe(
      supa.from("profiles").select("*").eq("id", userId).maybeSingle()
    );
    
    if (!data) {
      const inserted = await executeQuery(
        supa.from("profiles").insert({ id: userId }).select("*").single()
      );
      return c.json(inserted);
    }
    return c.json(data);
  } catch (error) {
    if (error instanceof DatabaseError) {
      return c.json({ code: "db_error", message: error.message }, 500);
    }
    throw error;
  }
});

app.put("/auth/profile", async (c) => {
  const userId = getUserId(c);
  const body = await c.req.json().catch(() => ({}));
  
  // Validate input
  const validation = UpdateProfileSchema.safeParse(body);
  if (!validation.success) {
    return c.json({
      code: "validation_error",
      message: "Invalid input",
      errors: validation.error.errors,
    }, 400);
  }
  
  const patch = {
    id: userId,
    ...validation.data,
  };
  
  const supa = adminClient();
  try {
    const data = await executeQuery(
      supa.from("profiles").upsert(patch, { onConflict: "id" }).select("*").single()
    );
    return c.json(data);
  } catch (error) {
    if (error instanceof DatabaseError) {
      return c.json({ code: "db_error", message: error.message }, 500);
    }
    throw error;
  }
});

// Auth: logout (invalidate session)
app.post("/auth/logout", async (c) => {
  const userId = getUserId(c);
  const user = getUser(c);
  
  // Log the logout event
  console.log(JSON.stringify({
    level: "info",
    event: "logout",
    userId,
    email: user?.email,
    timestamp: new Date().toISOString(),
  }));
  
  // Clear any server-side session cache if using KV
  const { kv } = await import("../_shared/kv.ts");
  await kv.set(`session:${userId}:active`, "false", 60); // Mark as logged out
  
  return c.json({ success: true, message: "Logged out successfully" });
});

// Auth: delete account
app.delete("/auth/account", async (c) => {
  const userId = getUserId(c);
  const supa = adminClient();
  
  try {
    // Delete user profile (cascade will handle related data)
    await executeQuery(
      supa.from("profiles").delete().eq("id", userId).select("id").single()
    );
    
    console.log(JSON.stringify({
      level: "warning",
      event: "account_deleted",
      userId,
      timestamp: new Date().toISOString(),
    }));
    
    return c.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    if (error instanceof DatabaseError) {
      return c.json({ code: "db_error", message: error.message }, 500);
    }
    throw error;
  }
});

// V1: meetings
app.post("/v1/meetings", async (c) => {
  const userId = getUserId(c);
  
  // Rate limiting: 20 meeting operations per minute
  const { success } = await meetingRateLimit.limit(userId);
  if (!success) {
    return c.json({
      code: "rate_limit_exceeded",
      message: "Too many meeting operations. Please slow down."
    }, 429);
  }
  
  const body = await c.req.json().catch(() => ({}));
  
  // Validate input
  const validation = CreateMeetingSchema.safeParse(body);
  if (!validation.success) {
    return c.json({
      code: "validation_error",
      message: "Invalid input",
      errors: validation.error.errors,
    }, 400);
  }
  
  const payload = {
    owner_id: userId,
    ...validation.data,
  };
  
  const supa = adminClient();
  try {
    const data = await executeQuery(
      supa.from("meetings")
        .insert(payload)
        .select("id, started_at, language, title, tags, project, is_offline")
        .single()
    );
    return c.json(data, 201);
  } catch (error) {
    if (error instanceof DatabaseError) {
      return c.json({ code: "db_error", message: error.message }, 500);
    }
    throw error;
  }
});

app.patch("/v1/meetings/:id/end", async (c) => {
  const userId = getUserId(c);
  const id = c.req.param("id");
  const supa = adminClient();
  
  try {
    // Ensure ownership
    const meeting = await executeQueryMaybe(
      supa.from("meetings").select("owner_id").eq("id", id).maybeSingle()
    );
    
    if (!meeting || meeting.owner_id !== userId) {
      return c.json({ code: "forbidden", message: "Forbidden" }, 403);
    }
    
    // Update ended_at
    const data = await executeQuery(
      supa.from("meetings")
        .update({ ended_at: new Date().toISOString() })
        .eq("id", id)
        .select("id, started_at, ended_at")
        .single()
    );
    
    // Generate final summary asynchronously
    (async () => {
      try {
        const { generateFinalSummary } = await import("../_shared/ai.ts");
        await generateFinalSummary(id, userId);
        console.log(`Final summary generated for meeting ${id}`);
      } catch (error) {
        console.error(`Failed to generate final summary for meeting ${id}:`, error);
      }
    })();
    
    return c.json(data);
  } catch (error) {
    if (error instanceof DatabaseError) {
      return c.json({ code: "db_error", message: error.message }, 500);
    }
    throw error;
  }
});

// V1: STT token
app.post("/v1/token/stt", async (c) => {
  const userId = getUserId(c);
  const token = await issueSttToken(userId);
  return c.json(token);
});

// V1: get meetings list with filters
app.get("/v1/meetings", async (c) => {
  const userId = getUserId(c);
  const supa = adminClient();
  
  // Parse and validate query params
  const { searchParams } = new URL(c.req.url);
  const queryParams = {
    limit: parseInt(searchParams.get("limit") || "20"),
    offset: parseInt(searchParams.get("offset") || "0"),
    tags: searchParams.get("tags")?.split(",").filter(Boolean),
    project: searchParams.get("project") || undefined,
    language: searchParams.get("language") || undefined,
    orderBy: searchParams.get("orderBy") || "started_at",
    orderDir: (searchParams.get("orderDir") || "desc") as "asc" | "desc",
  };
  
  const validation = MeetingsQuerySchema.safeParse(queryParams);
  if (!validation.success) {
    return c.json({
      code: "validation_error",
      message: "Invalid query parameters",
      errors: validation.error.errors,
    }, 400);
  }
  
  const { limit, offset, tags, project, language, orderBy, orderDir } = validation.data;
  
  let query = supa
    .from("meetings")
    .select("*")
    .eq("owner_id", userId);
  
  // Apply filters
  if (tags?.length) {
    query = query.contains("tags", tags);
  }
  if (project) {
    query = query.eq("project", project);
  }
  if (language) {
    query = query.eq("language", language);
  }
  
  // Apply ordering and pagination
  query = query.order(orderBy, { ascending: orderDir === "asc" })
    .range(offset, offset + limit - 1);
  
  try {
    const { data, error, count } = await query;
    if (error) throw new DatabaseError(error.message, error.code);
    
    return c.json({
      meetings: data || [],
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    if (error instanceof DatabaseError) {
      return c.json({ code: "db_error", message: error.message }, 500);
    }
    throw error;
  }
});

// V1: AI summarization
app.post("/v1/ai/summarize", async (c) => {
  const userId = getUserId(c);
  
  // Rate limiting: 10 AI calls per minute per user
  const { success, limit, remaining, reset } = await aiRateLimit.limit(userId);
  if (!success) {
    return c.json({
      code: "rate_limit_exceeded",
      message: "Too many AI requests. Please try again later.",
      limit,
      remaining,
      reset,
    }, 429);
  }
  
  const body = await c.req.json().catch(() => ({}));
  
  // Validate input
  const validation = SummarizeSchema.safeParse(body);
  if (!validation.success) {
    return c.json({
      code: "validation_error",
      message: "Invalid input",
      errors: validation.error.errors,
    }, 400);
  }
  
  const { meetingId, windowSec } = validation.data;
  
  try {
    const { summarizeWindow } = await import("../_shared/ai.ts");
    const result = await summarizeWindow(userId, meetingId, windowSec);
    return c.json(result);
  } catch (error) {
    console.error("Summarization error:", error);
    captureException(error instanceof Error ? error : new Error(String(error)), {
      context: "ai_summarization",
      meeting_id: meetingId,
      user_id: userId,
    });
    return c.json({ 
      code: "ai_error", 
      message: error instanceof Error ? error.message : "Failed to generate summary" 
    }, 500);
  }
});

// V1: segments batch
app.post("/v1/segments/batch", async (c) => {
  const userId = getUserId(c);
  const body = await c.req.json().catch(() => ({}));
  
  // Validate input
  const validation = BatchSegmentsSchema.safeParse(body);
  if (!validation.success) {
    return c.json({
      code: "validation_error",
      message: "Invalid input",
      errors: validation.error.errors,
    }, 400);
  }
  
  const { meetingId, segments } = validation.data;
  const supa = adminClient();
  
  try {
    // Ensure ownership
    const meeting = await executeQueryMaybe(
      supa.from("meetings").select("owner_id").eq("id", meetingId).maybeSingle()
    );
    
    if (!meeting || meeting.owner_id !== userId) {
      return c.json({ code: "forbidden", message: "Forbidden" }, 403);
    }
    
    // Deduplicate segments by unique key (meeting_id, speaker_label, start_ms, end_ms)
    const seen = new Set<string>();
    const rows = segments
      .map((s) => ({
        meeting_id: meetingId,
        speaker_label: s.speaker_label ?? null,
        start_ms: s.start_ms,
        end_ms: s.end_ms,
        text: s.text,
        lang: s.lang ?? "ar",
      }))
      .filter((row) => {
        const key = `${row.meeting_id}:${row.speaker_label}:${row.start_ms}:${row.end_ms}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    
    if (!rows.length) return c.json({ ok: true, inserted: 0 });
    
    // Use upsert with onConflict to handle duplicates gracefully
    await executeQuery(
      supa.from("segments")
        .upsert(rows, { 
          onConflict: "meeting_id,speaker_label,start_ms,end_ms",
          ignoreDuplicates: true 
        })
        .select("id")
    );
    
    return c.json({ ok: true, inserted: rows.length });
  } catch (error) {
    if (error instanceof DatabaseError) {
      return c.json({ code: "db_error", message: error.message }, 500);
    }
    throw error;
  }
});

// Webhooks: STT provider callback
app.post("/webhooks/stt", async (c) => {
  // Verify webhook signature if provided
  const signature = c.req.header("X-Webhook-Signature");
  const provider = c.req.header("X-STT-Provider") || "unknown";
  
  // TODO: Implement HMAC verification based on provider
  // For now, log the webhook receipt
  console.log(JSON.stringify({
    level: "info",
    event: "stt_webhook_received",
    provider,
    timestamp: new Date().toISOString(),
  }));
  
  const payload = await c.req.json();
  const supa = adminClient();
  
  // Transform provider-specific payload to unified format
  let segments: any[] = [];
  let meetingId: string | null = null;
  
  // Handle different provider formats
  switch (provider.toLowerCase()) {
    case "deepgram":
      meetingId = payload.metadata?.meeting_id;
      segments = payload.results?.channels?.[0]?.alternatives?.[0]?.words?.map((word: any) => ({
        speaker_label: word.speaker || "SPEAKER_1",
        start_ms: Math.round(word.start * 1000),
        end_ms: Math.round(word.end * 1000),
        text: word.punctuated_word || word.word,
        lang: payload.metadata?.language || "ar",
      })) || [];
      break;
      
    case "assemblyai":
      meetingId = payload.metadata?.meeting_id;
      segments = payload.words?.map((word: any) => ({
        speaker_label: word.speaker || "SPEAKER_1",
        start_ms: word.start,
        end_ms: word.end,
        text: word.text,
        lang: payload.language_code || "ar",
      })) || [];
      break;
      
    case "google":
      meetingId = payload.metadata?.meeting_id;
      // Google Speech-to-Text format - use parseFloat for fractional seconds
      segments = [];
      payload.results?.forEach((result: any) => {
        result.alternatives?.[0]?.words?.forEach((word: any) => {
          const startSec = parseFloat(word.startTime?.replace("s", "") || "0");
          const endSec = parseFloat(word.endTime?.replace("s", "") || "0");
          segments.push({
            speaker_label: word.speakerTag ? `SPEAKER_${word.speakerTag}` : "SPEAKER_1",
            start_ms: isNaN(startSec) ? 0 : Math.round(startSec * 1000),
            end_ms: isNaN(endSec) ? 0 : Math.round(endSec * 1000),
            text: word.word,
            lang: result.languageCode || "ar",
          });
        });
      });
      break;
      
    default:
      // Generic format
      meetingId = payload.meeting_id;
      segments = payload.segments || [];
  }
  
  if (!meetingId || !segments.length) {
    return c.json({ 
      code: "bad_request", 
      message: "Invalid webhook payload: missing meeting_id or segments" 
    }, 400);
  }
  
  // Verify meeting exists and belongs to a valid user
  let insertedCount = 0;
  try {
    const { data: meeting, error: meetingErr } = await supa
      .from("meetings")
      .select("id, owner_id")
      .eq("id", meetingId)
      .maybeSingle();
    
    if (meetingErr) throw new DatabaseError(meetingErr.message, meetingErr.code);
    
    if (!meeting) {
      return c.json({ code: "not_found", message: "Meeting not found" }, 404);
    }
    
    // Deduplicate segments by unique key
    const seen = new Set<string>();
    const rows = segments
      .map((s) => ({
        meeting_id: meetingId,
        speaker_label: s.speaker_label,
        start_ms: s.start_ms,
        end_ms: s.end_ms,
        text: s.text,
        lang: s.lang,
      }))
      .filter((row) => {
        const key = `${row.meeting_id}:${row.speaker_label}:${row.start_ms}:${row.end_ms}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    
    insertedCount = rows.length;
    
    // Use upsert with onConflict to handle duplicates gracefully
    const { error: insertErr } = await supa.from("segments")
      .upsert(rows, { 
        onConflict: "meeting_id,speaker_label,start_ms,end_ms",
        ignoreDuplicates: true 
      });
    
    if (insertErr) throw new DatabaseError(insertErr.message, insertErr.code);
  } catch (error) {
    console.error("Failed to insert segments:", error);
    if (error instanceof DatabaseError) {
      return c.json({ code: "db_error", message: error.message }, 500);
    }
    return c.json({ code: "error", message: "Failed to process webhook" }, 500);
  }
  
  // Optionally trigger realtime update
  // This could be done via Postgres triggers or manually here
  
  return c.json({ 
    success: true, 
    inserted: insertedCount,
    meeting_id: meetingId 
  });
});

// V1: Search endpoints
app.get("/v1/search", async (c) => {
  const userId = getUserId(c);
  
  // Rate limiting: 30 searches per minute
  const { success } = await searchRateLimit.limit(userId);
  if (!success) {
    return c.json({
      code: "rate_limit_exceeded",
      message: "Too many search requests. Please slow down."
    }, 429);
  }
  
  const { searchParams } = new URL(c.req.url);
  const queryParams = {
    q: searchParams.get("q") || "",
    meetingId: searchParams.get("meetingId") || undefined,
    language: searchParams.get("lang") || "ar",
    limit: parseInt(searchParams.get("limit") || "20"),
    offset: parseInt(searchParams.get("offset") || "0"),
  };

  const validation = SearchQuerySchema.safeParse(queryParams);
  if (!validation.success) {
    return c.json({
      code: "validation_error",
      message: "Invalid query parameters",
      errors: validation.error.errors,
    }, 400);
  }

  const { q, meetingId, language, limit, offset } = validation.data;

  try {
    const { combinedSearch } = await import("../_shared/search.ts");
    const results = await combinedSearch(userId, q, { meetingId, language, limit, offset });
    return c.json(results);
  } catch (error) {
    console.error("Search error:", error);
    const message = error instanceof Error ? error.message : "Search failed";
    return c.json({ code: "search_error", message }, 500);
  }
});

app.get("/v1/search/semantic", async (c) => {
  const userId = getUserId(c);
  
  // Rate limiting: 30 searches per minute
  const { success } = await searchRateLimit.limit(userId);
  if (!success) {
    return c.json({
      code: "rate_limit_exceeded",
      message: "Too many search requests. Please slow down."
    }, 429);
  }
  
  const { searchParams } = new URL(c.req.url);
  const queryParams = {
    q: searchParams.get("q") || "",
    meetingId: searchParams.get("meetingId") || undefined,
    limit: parseInt(searchParams.get("limit") || "10"),
  };

  const validation = SemanticSearchQuerySchema.safeParse(queryParams);
  if (!validation.success) {
    return c.json({
      code: "validation_error",
      message: "Invalid query parameters",
      errors: validation.error.errors,
    }, 400);
  }

  const { q, meetingId, limit } = validation.data;

  try {
    const { semanticSearch } = await import("../_shared/embeddings.ts");
    const results = await semanticSearch(userId, q, limit, meetingId);
    return c.json({ results });
  } catch (error) {
    console.error("Semantic search error:", error);
    const message = error instanceof Error ? error.message : "Semantic search failed";
    return c.json({ code: "search_error", message }, 500);
  }
});

// V1: Speaker analytics
app.get("/v1/meetings/:id/speakers", async (c) => {
  const userId = getUserId(c);
  const meetingId = c.req.param("id");
  const supa = adminClient();

  try {
    // Verify ownership
    const { data: meeting, error: meetingErr } = await supa
      .from("meetings")
      .select("owner_id")
      .eq("id", meetingId)
      .maybeSingle();
    
    if (meetingErr) throw new DatabaseError(meetingErr.message, meetingErr.code);

    if (!meeting || meeting.owner_id !== userId) {
      return c.json({ code: "forbidden", message: "Forbidden" }, 403);
    }

    const { getSpeakerAnalytics } = await import("../_shared/speakers.ts");
    const analytics = await getSpeakerAnalytics(meetingId);
    return c.json(analytics);
  } catch (error) {
    console.error("Speaker analytics error:", error);
    const message = error instanceof Error ? error.message : "Failed to get speaker analytics";
    if (error instanceof DatabaseError) {
      return c.json({ code: "db_error", message: error.message }, 500);
    }
    return c.json({ code: "error", message }, 500);
  }
});

app.put("/v1/meetings/:id/speakers/:label", async (c) => {
  const userId = getUserId(c);
  const meetingId = c.req.param("id");
  const label = c.req.param("label");
  const body = await c.req.json().catch(() => ({}));
  
  // Validate input
  const validation = UpdateSpeakerSchema.safeParse(body);
  if (!validation.success) {
    return c.json({
      code: "validation_error",
      message: "Invalid input",
      errors: validation.error.errors,
    }, 400);
  }
  
  const { display_name } = validation.data;
  const supa = adminClient();

  try {
    // Verify ownership
    const { data: meeting, error: meetingErr } = await supa
      .from("meetings")
      .select("owner_id")
      .eq("id", meetingId)
      .maybeSingle();
    
    if (meetingErr) throw new DatabaseError(meetingErr.message, meetingErr.code);

    if (!meeting || meeting.owner_id !== userId) {
      return c.json({ code: "forbidden", message: "Forbidden" }, 403);
    }

    const { updateSpeakerName } = await import("../_shared/speakers.ts");
    const speaker = await updateSpeakerName(meetingId, label, display_name);
    return c.json(speaker);
  } catch (error) {
    console.error("Update speaker error:", error);
    const message = error instanceof Error ? error.message : "Failed to update speaker";
    if (error instanceof DatabaseError) {
      return c.json({ code: "db_error", message: error.message }, 500);
    }
    return c.json({ code: "error", message }, 500);
  }
});

// V1: Export endpoints
app.post("/v1/export", async (c) => {
  const userId = getUserId(c);
  
  // Rate limiting: 5 exports per minute (resource intensive)
  const { success } = await exportRateLimit.limit(userId);
  if (!success) {
    return c.json({
      code: "rate_limit_exceeded",
      message: "Export limit reached. Please wait before exporting again."
    }, 429);
  }
  
  const body = await c.req.json().catch(() => ({}));
  
  // Validate input
  const validation = ExportSchema.safeParse(body);
  if (!validation.success) {
    return c.json({
      code: "validation_error",
      message: "Invalid input",
      errors: validation.error.errors,
    }, 400);
  }
  
  const { meetingId, format } = validation.data;

  try {
    const { generateMarkdownExport, generateTextExport, generateHtmlExport, storeExport } = await import("../_shared/exports.ts");
    
    let content: string;
    switch (format) {
      case "markdown": {
        content = await generateMarkdownExport(meetingId, userId);
        break;
      }
      case "txt": {
        content = await generateTextExport(meetingId, userId);
        break;
      }
      case "html": {
        content = await generateHtmlExport(meetingId, userId);
        break;
      }
    }

    const asset = await storeExport(meetingId, userId, format, content);
    return c.json(asset);
  } catch (error) {
    console.error("Export error:", error);
    const message = error instanceof Error ? error.message : "Export failed";
    return c.json({ code: "export_error", message }, 500);
  }
});

app.get("/v1/assets/:id/signed-url", async (c) => {
  const userId = getUserId(c);
  const assetId = c.req.param("id");
  const supa = adminClient();

  try {
    // Get asset and verify ownership
    const { data: asset, error } = await supa
      .from("assets")
      .select("*")
      .eq("id", assetId)
      .eq("owner_id", userId)
      .maybeSingle();

    if (error) throw new DatabaseError(error.message, error.code);
    
    if (!asset) {
      return c.json({ code: "not_found", message: "Asset not found" }, 404);
    }

    // Generate signed URL
    const bucket = asset.kind === "audio" ? "audio" : "exports";
    const { data: signedUrlData, error: signedErr } = await supa.storage
      .from(bucket)
      .createSignedUrl(asset.storage_path, 3600);

    if (signedErr) {
      console.error("Failed to generate signed URL:", signedErr);
      return c.json({ code: "storage_error", message: "Failed to generate signed URL" }, 500);
    }

    return c.json({ signed_url: signedUrlData?.signedUrl || null });
  } catch (error) {
    console.error("Asset signed URL error:", error);
    if (error instanceof DatabaseError) {
      return c.json({ code: "db_error", message: error.message }, 500);
    }
    return c.json({ code: "error", message: "Failed to get asset" }, 500);
  }
});

// V1: Integration endpoints
app.post("/v1/integrations/:provider/push", async (c) => {
  const userId = getUserId(c);
  const provider = c.req.param("provider") as "notion" | "trello" | "todo";
  const body = await c.req.json().catch(() => ({}));

  if (!["notion", "trello", "todo"].includes(provider)) {
    return c.json({ code: "bad_request", message: "Invalid provider" }, 400);
  }
  
  // Validate input
  const validation = IntegrationPushSchema.safeParse(body);
  if (!validation.success) {
    return c.json({
      code: "validation_error",
      message: "Invalid input",
      errors: validation.error.errors,
    }, 400);
  }
  
  const { meetingId, summary, tasks } = validation.data;

  try {
    const { pushToIntegration } = await import("../_shared/integrations.ts");
    const result = await pushToIntegration(userId, provider, meetingId, summary, tasks);
    return c.json(result);
  } catch (error) {
    console.error(`${provider} integration error:`, error);
    const message = error instanceof Error ? error.message : "Integration push failed";
    return c.json({ code: "integration_error", message }, 500);
  }
});

app.put("/v1/integrations/:provider/config", async (c) => {
  const userId = getUserId(c);
  const provider = c.req.param("provider");
  const config = await c.req.json();

  try {
    const { saveIntegrationConfig } = await import("../_shared/integrations.ts");
    await saveIntegrationConfig(userId, { provider: provider as any, ...config });
    return c.json({ success: true });
  } catch (error) {
    console.error("Save integration config error:", error);
    const message = error instanceof Error ? error.message : "Failed to save config";
    return c.json({ code: "error", message }, 500);
  }
});

// V1: Advanced auth endpoints
app.post("/v1/auth/api-keys", async (c) => {
  const userId = getUserId(c);
  const body = await c.req.json().catch(() => ({}));
  
  // Validate input
  const validation = ApiKeyGenerationSchema.safeParse(body);
  if (!validation.success) {
    return c.json({
      code: "validation_error",
      message: "Invalid input",
      errors: validation.error.errors,
    }, 400);
  }
  
  const { name, scopes } = validation.data;

  try {
    const { generateApiKey } = await import("../_shared/auth_advanced.ts");
    const apiKey = await generateApiKey(userId, name, scopes);
    return c.json(apiKey);
  } catch (error) {
    console.error("Generate API key error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate API key";
    return c.json({ code: "error", message }, 500);
  }
});

// V1: Offline audio ingest
app.post("/v1/meetings/:id/ingest", async (c) => {
  const userId = getUserId(c);
  const meetingId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  
  // Validate input
  const validation = IngestAudioSchema.safeParse(body);
  if (!validation.success) {
    return c.json({
      code: "validation_error",
      message: "Invalid input",
      errors: validation.error.errors,
    }, 400);
  }
  
  const { audioUrl, format } = validation.data;

  try {
    const { ingestOfflineAudio } = await import("../_shared/offline.ts");
    const asset = await ingestOfflineAudio(userId, meetingId, audioUrl, format);
    return c.json(asset);
  } catch (error) {
    console.error("Offline ingest error:", error);
    const message = error instanceof Error ? error.message : "Failed to ingest audio";
    return c.json({ code: "error", message }, 500);
  }
});

// V1: Topic detection
app.get("/v1/meetings/:id/topics", async (c) => {
  const userId = getUserId(c);
  const meetingId = c.req.param("id");
  const supa = adminClient();

  try {
    // Verify ownership
    const { data: meeting, error: meetingErr } = await supa
      .from("meetings")
      .select("owner_id")
      .eq("id", meetingId)
      .maybeSingle();
    
    if (meetingErr) throw new DatabaseError(meetingErr.message, meetingErr.code);

    if (!meeting || meeting.owner_id !== userId) {
      return c.json({ code: "forbidden", message: "Forbidden" }, 403);
    }

    const { detectTopicBreaks } = await import("../_shared/ai.ts");
    const breaks = await detectTopicBreaks(meetingId);
    return c.json({ breaks });
  } catch (error) {
    console.error("Topic detection error:", error);
    const message = error instanceof Error ? error.message : "Failed to detect topics";
    if (error instanceof DatabaseError) {
      return c.json({ code: "db_error", message: error.message }, 500);
    }
    return c.json({ code: "error", message }, 500);
  }
});

// V1: Embeddings backfill (admin/maintenance endpoint)
app.post("/v1/admin/embeddings/backfill", async (c) => {
  const batchSize = parseInt(new URL(c.req.url).searchParams.get("batch") || "50");

  try {
    const { backfillEmbeddings } = await import("../_shared/embeddings.ts");
    const processed = await backfillEmbeddings(batchSize);
    return c.json({ processed });
  } catch (error) {
    console.error("Backfill embeddings error:", error);
    const message = error instanceof Error ? error.message : "Backfill failed";
    return c.json({ code: "error", message }, 500);
  }
});

// Not found and error handlers
app.notFound((c) => c.json({ code: "not_found", message: "Route not found" }, 404));

app.onError((err, c) => {
  // Log to console
  console.error({ err: String(err) });
  
  // Capture exception in Sentry with context
  const requestId = getRequestId(c);
  const userId = getUserId(c);
  
  captureException(err instanceof Error ? err : new Error(String(err)), {
    request_id: requestId,
    user_id: userId,
    method: c.req.method,
    path: c.req.path,
    url: c.req.url,
  });
  
  return c.json({ 
    code: "internal_error", 
    message: "Internal Server Error", 
    request_id: requestId 
  }, 500);
});

export default app;
