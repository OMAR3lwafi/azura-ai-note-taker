// Input validation schemas using Zod
import { z } from "zod";

// Meeting schemas
export const CreateMeetingSchema = z.object({
  title: z.string().optional().nullable(),
  language: z.string().default("ar"),
  tags: z.array(z.string()).default([]),
  project: z.string().optional().nullable(),
  is_offline: z.boolean().default(false),
});

export const UpdateProfileSchema = z.object({
  display_name: z.string().optional().nullable(),
  locale: z.string().optional(),
  auto_delete_days: z.number().int().positive().optional(),
});

export const BatchSegmentsSchema = z.object({
  meetingId: z.string().uuid("Invalid meeting ID format"),
  segments: z.array(z.object({
    speaker_label: z.string().optional().nullable(),
    start_ms: z.number().int().nonnegative(),
    end_ms: z.number().int().nonnegative(),
    text: z.string(),
    lang: z.string().optional(),
  })),
});

export const SummarizeSchema = z.object({
  meetingId: z.string().uuid("Invalid meeting ID format"),
  windowSec: z.number().int().positive().default(180),
});

export const ExportSchema = z.object({
  meetingId: z.string().uuid("Invalid meeting ID format"),
  format: z.enum(["markdown", "txt", "html"]).default("markdown"),
});

export const IntegrationPushSchema = z.object({
  meetingId: z.string().uuid("Invalid meeting ID format"),
  summary: z.string().optional(),
  tasks: z.array(z.any()).optional(),
});

export const IngestAudioSchema = z.object({
  audioUrl: z.string().url("Invalid audio URL"),
  format: z.string().default("mp3"),
});

export const ApiKeyGenerationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  scopes: z.array(z.string()).default(["read"]),
});

export const UpdateSpeakerSchema = z.object({
  display_name: z.string().min(1, "Display name is required"),
});

// Query parameter schemas
export const MeetingsQuerySchema = z.object({
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
  tags: z.array(z.string()).optional(),
  project: z.string().optional(),
  language: z.string().optional(),
  orderBy: z.string().default("started_at"),
  orderDir: z.enum(["asc", "desc"]).default("desc"),
});

export const SearchQuerySchema = z.object({
  q: z.string().min(1, "Query parameter 'q' is required"),
  meetingId: z.string().uuid().optional(),
  language: z.string().default("ar"),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

export const SemanticSearchQuerySchema = z.object({
  q: z.string().min(1, "Query parameter 'q' is required"),
  meetingId: z.string().uuid().optional(),
  limit: z.number().int().positive().max(50).default(10),
});
