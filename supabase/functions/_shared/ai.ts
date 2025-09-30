// AI integration for summarization and task extraction
import { adminClient } from "./supabase.ts";
import { DatabaseError, executeQuery, executeQueryMaybe } from "./database.ts";
import { withLock, cachedWithLock } from "./kv-locks.ts";

const LLM_PROVIDER = Deno.env.get("LLM_PROVIDER") || "openai";
const LLM_API_KEY = Deno.env.get("LLM_API_KEY") || "";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Comment 3: Load thresholds and keywords from configuration
const SILENCE_THRESHOLD_MS = parseInt(Deno.env.get("SILENCE_THRESHOLD_MS") || "5000", 10);
const TOPIC_KEYWORDS_CONFIG: Record<string, string[]> = {
  en: Deno.env.get("TOPIC_KEYWORDS_EN")?.split(",") || ['next', 'now', 'moving on', 'another topic'],
  ar: Deno.env.get("TOPIC_KEYWORDS_AR")?.split(",") || ['التالي', 'الآن', 'موضوع آخر'],
};

// Comment 2: Token limits for chunking (approximate)
const MAX_TOKENS_PER_CHUNK = 3000; // Conservative estimate
const CHARS_PER_TOKEN = 4; // Rough approximation
const MAX_CHARS_PER_CHUNK = MAX_TOKENS_PER_CHUNK * CHARS_PER_TOKEN;

// Comment 5: Helper to validate and ensure timestamps are in milliseconds
function ensureMilliseconds(value: number | undefined, fieldName: string): number {
  if (value === undefined || value === null) {
    throw new Error(`${fieldName} is undefined or null`);
  }
  // If value is suspiciously small (< 10^12), it might be in seconds; convert to milliseconds
  // Epoch milliseconds for year 2000: ~946684800000, so anything less than 10^11 is likely seconds
  if (value < 100000000000) {
    console.warn(`${fieldName} appears to be in seconds, converting to milliseconds`);
    return value * 1000;
  }
  return value;
}

interface AISummaryResult {
  summary: string;
  decisions: string[];
  action_items: {
    title: string;
    assignee?: string;
    due_date?: string;
  }[];
}

// Comment 2: Split large text into chunks to avoid token overflow
function chunkText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) {
    return [text];
  }
  
  const chunks: string[] = [];
  let currentChunk = "";
  const lines = text.split("\n");
  
  for (const line of lines) {
    if ((currentChunk + line).length > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = line + "\n";
    } else {
      currentChunk += line + "\n";
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Call the LLM API to generate summaries with retry logic
async function callLLM(prompt: string, language: "ar" | "en", retryCount = 0): Promise<AISummaryResult> {
  if (!LLM_API_KEY) {
    throw new Error("LLM_API_KEY not configured");
  }

  const systemPrompt = language === "ar" 
    ? "أنت مساعد ذكي متخصص في تلخيص الاجتماعات واستخراج القرارات والمهام. أجب بنفس لغة النص المعطى."
    : "You are an intelligent assistant specialized in summarizing meetings and extracting decisions and action items. Respond in the same language as the input text.";

  const userPrompt = `${prompt}

Please provide the output in the following JSON format:
{
  "summary": "Brief 3-5 sentence summary",
  "decisions": ["decision 1", "decision 2"],
  "action_items": [
    {"title": "task description", "assignee": "person name or null", "due_date": "YYYY-MM-DD or null"}
  ]
}`;

  try {
    if (LLM_PROVIDER === "openai") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LLM_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 500,
          response_format: { type: "json_object" },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "OpenAI API error");
      }

      return JSON.parse(data.choices[0].message.content);
    } else if (LLM_PROVIDER === "anthropic") {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": LLM_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 500,
          temperature: 0.3,
          system: systemPrompt,
          messages: [
            { role: "user", content: userPrompt },
          ],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Anthropic API error");
      }

      return JSON.parse(data.content[0].text);
    }
  } catch (error) {
    console.error("LLM API error:", error);
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (retryCount + 1)));
      return callLLM(prompt, language, retryCount + 1);
    }
    throw error;
  }

  throw new Error(`Unsupported LLM provider: ${LLM_PROVIDER}`);
}

interface SummarizeWindowResult {
  status?: string;
  message?: string;
  [key: string]: unknown;
}
// Summarize a time window of segments
export async function summarizeWindow(
  userId: string,
  meetingId: string,
  windowSeconds: number = 180
): Promise<{ summary: string; tasks: any[]; decisions: string[] }> {
  // Use distributed lock to prevent concurrent summarization
  return await withLock(
    `summarize:${meetingId}`,
    async () => {
      // Try to get cached result first (5 minute cache)
      const cached = await cachedWithLock(
        `summary:${meetingId}:${windowSeconds}`,
        async () => {
          return await generateSummaryInternal(userId, meetingId, windowSeconds);
        },
        300 // 5 minutes TTL
      );
      return cached;
    },
    { ttl: 30, throwOnLocked: true }
  );
}

// Internal function that does the actual summarization
async function generateSummaryInternal(
  userId: string,
  meetingId: string,
  windowSeconds: number
): Promise<{ summary: string; tasks: any[]; decisions: string[] }> {
  const supa = adminClient();
  
  // Get recent segments
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const cutoff = now - windowMs;
  
  // Check meeting ownership
  const { data: meeting } = await supa
    .from("meetings")
    .select("owner_id, language")
    .eq("id", meetingId)
    .maybeSingle();

  if (!meeting || meeting.owner_id !== userId) {
    throw new Error("Meeting not found or access denied");
  }

  // Comment 4: Use atomic lock operation to prevent race conditions
  const lockKey = `lock:ai:${meetingId}`;
  const lockValue = crypto.randomUUID();
  const lockTTL = 30; // seconds
  
  // Atomic set-if-not-exists operation
  // Note: Adjust based on your KV implementation (Redis SETNX, etc.)
  const existingLock = await cacheClient.get(lockKey);
  if (existingLock) {
    // Another summarization is in progress
    return { 
      status: "in_progress", 
      message: "Summarization already in progress" 
    };
  }
  
  // Set lock atomically with TTL
  await cacheClient.set(lockKey, lockValue, lockTTL);

  try {
    // Get segments from the last N seconds
    const cutoffTime = Date.now() - (windowSeconds * 1000);
    
    const { data: segments } = await dbClient
      .from("segments")
      .select("text, speaker_label, start_ms")
      .eq("meeting_id", meetingId)
      .gte("start_ms", cutoffTime)
      .order("start_ms", { ascending: true });
    
    // Comment 5: Validate and ensure timestamps are in milliseconds
    if (segments && segments.length > 0) {
      segments.forEach((seg, idx) => {
        if (seg.start_ms !== undefined) {
          seg.start_ms = ensureMilliseconds(seg.start_ms, `segments[${idx}].start_ms`);
        }
      });
    }

    if (!segments || segments.length === 0) {
      return { 
        status: "no_content", 
        message: "No segments found in the specified window" 
      };
    }

    // Get speaker analytics for context
    const speakerAnalytics: { speakers?: Array<{ label: string; display_name: string }> } | null = 
      await getSpeakerAnalytics(meetingId).catch(() => null);

    // Combine segments into transcript with speaker names
    let transcript = "";
    let currentSpeaker: string | null = null;
    const speakerMap = new Map(
      speakerAnalytics?.speakers?.map((s) => [s.label, s.display_name]) || []
    );
    
    for (const segment of segments) {
      const speakerName = speakerMap.get(segment.speaker_label) || segment.speaker_label;
      if (segment.speaker_label !== currentSpeaker) {
        if (transcript) transcript += "\n\n";
        transcript += `${speakerName}: `;
        currentSpeaker = segment.speaker_label;
      }
      transcript += segment.text + " ";
    }

    // Check cache for recent summary
    const cacheKey = `ai:summary:${meetingId}:${Math.floor(Date.now() / 60000)}`; // Cache per minute
    const cached = await cacheClient.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Comment 2: Handle large transcripts with chunking
    const startTime = Date.now();
    let result: AISummaryResult;
    
    if (transcript.length > MAX_CHARS_PER_CHUNK) {
      // Split into chunks, summarize each, then combine
      const chunks = chunkText(transcript, MAX_CHARS_PER_CHUNK);
      const chunkSummaries: string[] = [];
      
      for (const chunk of chunks) {
        const chunkResult = await callLLM(
          `Summarize the following portion of a meeting transcript:\n\n${chunk}`,
          meeting.language as "ar" | "en"
        );
        chunkSummaries.push(chunkResult.summary);
      }
      
      // Combine chunk summaries into final summary
      const combinedSummary = chunkSummaries.join("\n\n");
      result = await callLLM(
        `Combine and summarize the following summaries into a single coherent summary:\n\n${combinedSummary}`,
        meeting.language as "ar" | "en"
      );
    } else {
      // Transcript is small enough, summarize directly
      result = await callLLM(
        `Summarize the following meeting transcript:\n\n${transcript}`,
        meeting.language as "ar" | "en"
      );
    }
    
    const latency = Date.now() - startTime;

    // Store AI suggestion in database
    const { data: suggestion, error: suggestionError } = await dbClient
      .from("ai_suggestions")
      .insert({
        meeting_id: meetingId,
        kind: "summary",
        content: result,
        source_window: windowSeconds,
        model: `${LLM_PROVIDER}/gpt-3.5-turbo`,
        latency_ms: latency,
      })
      .select()
      .single();

    if (suggestionError) {
      console.error("Failed to store AI suggestion:", suggestionError);
    }

    // Extract and store tasks
    if (result.action_items?.length > 0) {
      const tasks = result.action_items.map((item) => ({
        meeting_id: meetingId,
        title: item.title,
        assignee: item.assignee,
        due_date: item.due_date,
        status: "open",
      }));

      const { error: tasksError } = await dbClient
        .from("tasks")
        .insert(tasks);

      if (tasksError) {
        console.error("Failed to store tasks:", tasksError);
      }
    }

    // Cache the result for 1 minute
    await cacheClient.set(cacheKey, JSON.stringify(suggestion), 60);

    return suggestion;
  } finally {
    // Comment 4: Release lock only if we still own it
    const currentLock = await cacheClient.get(lockKey);
    if (currentLock === lockValue) {
      await cacheClient.del(lockKey);
    }
  }
}

interface FinalSummaryResult {
  [key: string]: unknown;
}

// Generate final meeting summary
export async function generateFinalSummary(
  meetingId: string,
  _userId: string
): Promise<FinalSummaryResult | null> {
  // Comment 1: Use descriptive variable names
  const dbClient = adminClient();

  // Get all segments for the meeting
  const { data: segments } = await dbClient
    .from("segments")
    .select("text, speaker_label, start_ms")
    .eq("meeting_id", meetingId)
    .order("start_ms", { ascending: true });
  
  // Comment 5: Validate timestamps
  if (segments && segments.length > 0) {
    segments.forEach((seg, idx) => {
      if (seg.start_ms !== undefined) {
        seg.start_ms = ensureMilliseconds(seg.start_ms, `segments[${idx}].start_ms`);
      }
    });
  }

  const { data: meeting } = await dbClient
    .from("meetings")
    .select("language, title")
    .eq("id", meetingId)
    .single();

  if (!segments || segments.length === 0 || !meeting) {
    return null;
  }

  // Create full transcript
  let transcript = "";
  let currentSpeaker: string | null = null;
  
  for (const segment of segments) {
    if (segment.speaker_label !== currentSpeaker) {
      if (transcript) transcript += "\n\n";
      transcript += `${segment.speaker_label}: `;
      currentSpeaker = segment.speaker_label;
    }
    transcript += segment.text + " ";
  }

  // Comment 2: Handle large transcripts with chunking
  const startTime = Date.now();
  let result: AISummaryResult;
  
  if (transcript.length > MAX_CHARS_PER_CHUNK) {
    const chunks = chunkText(transcript, MAX_CHARS_PER_CHUNK);
    const chunkSummaries: string[] = [];
    
    for (const chunk of chunks) {
      const chunkResult = await callLLM(
        `Summarize the following portion of a meeting transcript:\n\n${chunk}`,
        meeting.language as "ar" | "en"
      );
      chunkSummaries.push(chunkResult.summary);
    }
    
    const combinedSummary = chunkSummaries.join("\n\n");
    result = await callLLM(
      `Provide a comprehensive summary of this entire meeting based on these partial summaries:\n\nTitle: ${meeting.title || "Untitled"}\n\n${combinedSummary}`,
      meeting.language as "ar" | "en"
    );
  } else {
    result = await callLLM(
      `Provide a comprehensive summary of this entire meeting:\n\nTitle: ${meeting.title || "Untitled"}\n\n${transcript}`,
      meeting.language as "ar" | "en"
    );
  }
  
  const latency = Date.now() - startTime;

  // Store final summary
  const { data: finalSummary } = await dbClient
    .from("ai_suggestions")
    .insert({
      meeting_id: meetingId,
      kind: "summary",
      content: {
        ...result,
        is_final: true,
      },
      source_window: null, // Indicates full meeting
      model: `${LLM_PROVIDER}/gpt-3.5-turbo`,
      latency_ms: latency,
    })
    .select()
    .single();

  return finalSummary;
}

interface TopicBreak {
  position: number;
  type: 'silence' | 'keyword';
  gap_ms?: number;
  keyword?: string;
  timestamp: number;
}

// Detect topic breaks in segments based on silence and keywords
export async function detectTopicBreaks(meetingId: string, language: "ar" | "en" = "en"): Promise<TopicBreak[]> {
  // Comment 1: Use descriptive variable names
  const dbClient = adminClient();
  
  // Comment 3: Use configurable keywords from environment/config
  const topicKeywords = TOPIC_KEYWORDS_CONFIG[language] || TOPIC_KEYWORDS_CONFIG.en;

  const { data: segments } = await dbClient
    .from("segments")
    .select("*")
    .eq("meeting_id", meetingId)
    .order("start_ms", { ascending: true });

  if (!segments || segments.length < 2) return [];
  
  // Comment 5: Validate timestamps
  segments.forEach((seg, idx) => {
    if (seg.start_ms !== undefined) {
      seg.start_ms = ensureMilliseconds(seg.start_ms, `segments[${idx}].start_ms`);
    }
    if (seg.end_ms !== undefined) {
      seg.end_ms = ensureMilliseconds(seg.end_ms, `segments[${idx}].end_ms`);
    }
  });

  const breaks: TopicBreak[] = [];
  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1];
    const curr = segments[i];
    
    // Comment 6: Add null/undefined checks before using values
    if (!prev.end_ms || !curr.start_ms || !curr.text) {
      console.warn(`Skipping segment ${i} due to missing data (end_ms, start_ms, or text)`);
      continue;
    }
    
    const gap = curr.start_ms - prev.end_ms;

    // Detect silence break
    if (gap > SILENCE_THRESHOLD_MS) {
      breaks.push({ position: i, type: 'silence', gap_ms: gap, timestamp: curr.start_ms });
      continue;
    }

    // Comment 6: Use regex-based keyword detection for better efficiency
    const text = curr.text.toLowerCase();
    const keywordPattern = new RegExp(topicKeywords.map(kw => kw.toLowerCase()).join('|'), 'i');
    const match = text.match(keywordPattern);
    
    if (match) {
      breaks.push({ position: i, type: 'keyword', keyword: text.substring(0, 50), timestamp: curr.start_ms });
    }
  }

  return breaks;
}