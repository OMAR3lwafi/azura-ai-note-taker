// Speaker analytics and diarization management
import { adminClient } from "./supabase.ts";

// Calculate talk-time for each speaker in a meeting
export async function calculateTalkTime(meetingId: string): Promise<any[]> {
  const supa = adminClient();

  const { data, error } = await supa.rpc("calculate_talk_time", {
    p_meeting_id: meetingId,
  });

  if (error) {
    console.error("Talk-time calculation error:", error);
    throw new Error(`Talk-time calculation failed: ${error.message}`);
  }

  return data || [];
}

// Get or create speaker record
export async function getOrCreateSpeaker(
  meetingId: string,
  label: string,
  displayName?: string
): Promise<any> {
  const supa = adminClient();

  // Check if speaker exists
  const { data: existing } = await supa
    .from("speakers")
    .select("*")
    .eq("meeting_id", meetingId)
    .eq("label", label)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  // Create new speaker
  const { data, error } = await supa
    .from("speakers")
    .insert({
      meeting_id: meetingId,
      label,
      display_name: displayName || label,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create speaker: ${error.message}`);
  }

  return data;
}

// Update speaker display name
export async function updateSpeakerName(
  meetingId: string,
  label: string,
  displayName: string
): Promise<any> {
  const supa = adminClient();

  const { data, error } = await supa
    .from("speakers")
    .update({ display_name: displayName })
    .eq("meeting_id", meetingId)
    .eq("label", label)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update speaker: ${error.message}`);
  }

  return data;
}

// Get speaker analytics for a meeting
export async function getSpeakerAnalytics(meetingId: string): Promise<any> {
  const supa = adminClient();

  // Get speakers with their stats
  const { data: speakers } = await supa
    .from("speakers")
    .select("*")
    .eq("meeting_id", meetingId);

  // Calculate talk-time
  const talkTime = await calculateTalkTime(meetingId);

  // Get segment counts
  const { data: segmentCounts } = await supa
    .from("segments")
    .select("speaker_label")
    .eq("meeting_id", meetingId);

  const countMap = new Map<string, number>();
  segmentCounts?.forEach((s) => {
    const count = countMap.get(s.speaker_label) || 0;
    countMap.set(s.speaker_label, count + 1);
  });

  // Merge data
  const analytics = (speakers || []).map((speaker) => ({
    ...speaker,
    talk_time_ms: talkTime.find((t) => t.speaker_label === speaker.label)?.total_talk_time_ms || 0,
    segment_count: countMap.get(speaker.label) || 0,
  }));

  return {
    speakers: analytics,
    total_speakers: analytics.length,
    total_segments: segmentCounts?.length || 0,
  };
}

// Merge speakers (combine two speaker labels into one)
export async function mergeSpeakers(
  meetingId: string,
  fromLabel: string,
  toLabel: string
): Promise<void> {
  const supa = adminClient();

  // Update all segments
  const { error: segmentError } = await supa
    .from("segments")
    .update({ speaker_label: toLabel })
    .eq("meeting_id", meetingId)
    .eq("speaker_label", fromLabel);

  if (segmentError) {
    throw new Error(`Failed to merge segments: ${segmentError.message}`);
  }

  // Delete the old speaker record
  const { error: deleteError } = await supa
    .from("speakers")
    .delete()
    .eq("meeting_id", meetingId)
    .eq("label", fromLabel);

  if (deleteError) {
    console.error("Failed to delete old speaker:", deleteError);
  }
}
