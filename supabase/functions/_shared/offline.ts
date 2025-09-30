// Offline audio ingest and processing
import { adminClient } from "./supabase.ts";

export async function ingestOfflineAudio(
  userId: string,
  meetingId: string,
  audioUrl: string,
  format: string = "mp3"
): Promise<any> {
  const supa = adminClient();

  // Verify ownership
  const { data: meeting } = await supa
    .from("meetings")
    .select("owner_id")
    .eq("id", meetingId)
    .maybeSingle();

  if (!meeting || meeting.owner_id !== userId) {
    throw new Error("Meeting not found or access denied");
  }

  // Store audio reference
  const { data: asset, error } = await supa
    .from("assets")
    .insert({
      meeting_id: meetingId,
      owner_id: userId,
      kind: "audio",
      format,
      storage_path: audioUrl,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to store asset: ${error.message}`);
  }

  // Queue for STT processing (would trigger background job)
  console.log(`Queued audio ${asset.id} for STT processing`);

  return asset;
}

export async function processOfflineTranscript(assetId: string, segments: any[]): Promise<void> {
  const supa = adminClient();

  const { data: asset } = await supa.from("assets").select("meeting_id").eq("id", assetId).single();
  if (!asset) throw new Error("Asset not found");

  // Insert segments
  const rows = segments.map((s) => ({
    meeting_id: asset.meeting_id,
    speaker_label: s.speaker_label || "SPEAKER_1",
    start_ms: s.start_ms,
    end_ms: s.end_ms,
    text: s.text,
    lang: s.lang || "ar",
  }));

  await supa.from("segments").insert(rows);
  await supa.from("assets").update({ status: "completed" }).eq("id", assetId);
}
