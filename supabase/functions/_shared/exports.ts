// Export generation: PDF, Markdown, TXT
import { adminClient } from "./supabase.ts";

// Generate Markdown export
export async function generateMarkdownExport(meetingId: string, userId: string): Promise<string> {
  const supa = adminClient();

  // Get meeting data
  const { data: meeting } = await supa
    .from("meetings")
    .select("*, ai_suggestions(*), tasks(*)")
    .eq("id", meetingId)
    .eq("owner_id", userId)
    .single();

  if (!meeting) {
    throw new Error("Meeting not found or access denied");
  }

  // Get segments
  const { data: segments } = await supa
    .from("segments")
    .select("*")
    .eq("meeting_id", meetingId)
    .order("start_ms", { ascending: true });

  // Get speakers
  const { data: speakers } = await supa
    .from("speakers")
    .select("*")
    .eq("meeting_id", meetingId);

  const speakerMap = new Map(speakers?.map((s) => [s.label, s.display_name]) || []);

  // Build markdown
  let markdown = `# ${meeting.title || "Untitled Meeting"}\n\n`;
  markdown += `**Date:** ${new Date(meeting.started_at).toLocaleString()}\n`;
  markdown += `**Language:** ${meeting.language}\n`;
  if (meeting.tags?.length) {
    markdown += `**Tags:** ${meeting.tags.join(", ")}\n`;
  }
  markdown += "\n---\n\n";

  // Summary
  const latestSummary = meeting.ai_suggestions
    ?.filter((s: any) => s.kind === "summary")
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  if (latestSummary) {
    markdown += `## Summary\n\n${latestSummary.content.summary}\n\n`;

    if (latestSummary.content.decisions?.length) {
      markdown += `### Decisions\n\n`;
      latestSummary.content.decisions.forEach((d: string) => {
        markdown += `- ${d}\n`;
      });
      markdown += "\n";
    }
  }

  // Tasks
  if (meeting.tasks?.length) {
    markdown += `## Action Items\n\n`;
    meeting.tasks.forEach((task: any) => {
      markdown += `- [ ] ${task.title}`;
      if (task.assignee) markdown += ` (${task.assignee})`;
      if (task.due_date) markdown += ` - Due: ${task.due_date}`;
      markdown += "\n";
    });
    markdown += "\n";
  }

  // Transcript
  markdown += `## Transcript\n\n`;
  let currentSpeaker: string | null = null;

  segments?.forEach((segment) => {
    const displayName = speakerMap.get(segment.speaker_label) || segment.speaker_label;
    if (segment.speaker_label !== currentSpeaker) {
      if (currentSpeaker !== null) markdown += "\n";
      markdown += `**${displayName}:** `;
      currentSpeaker = segment.speaker_label;
    }
    markdown += `${segment.text} `;
  });

  return markdown;
}

// Generate plain text export
export async function generateTextExport(meetingId: string, userId: string): Promise<string> {
  const markdown = await generateMarkdownExport(meetingId, userId);
  // Strip markdown formatting
  return markdown
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/- \[ \] /g, "• ");
}

// Generate HTML export (base for PDF)
export async function generateHtmlExport(meetingId: string, userId: string): Promise<string> {
  const markdown = await generateMarkdownExport(meetingId, userId);

  // Simple markdown to HTML conversion
  let html = `<!DOCTYPE html>
<html dir="auto" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h2 { color: #34495e; margin-top: 30px; }
    h3 { color: #7f8c8d; }
    hr { border: none; border-top: 1px solid #ecf0f1; margin: 30px 0; }
    ul { list-style-type: disc; padding-left: 20px; }
    strong { color: #2c3e50; }
  </style>
</head>
<body>
`;

  // Basic markdown parsing
  html += markdown
    .split("\n")
    .map((line) => {
      if (line.startsWith("# ")) return `<h1>${line.substring(2)}</h1>`;
      if (line.startsWith("## ")) return `<h2>${line.substring(3)}</h2>`;
      if (line.startsWith("### ")) return `<h3>${line.substring(4)}</h3>`;
      if (line === "---") return "<hr>";
      if (line.startsWith("- ")) return `<li>${line.substring(2)}</li>`;
      if (line.trim() === "") return "<br>";
      return `<p>${line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</p>`;
    })
    .join("\n");

  html += "</body></html>";
  return html;
}

// Store export in assets and return signed URL
export async function storeExport(
  meetingId: string,
  userId: string,
  format: "markdown" | "txt" | "html" | "pdf",
  content: string | Uint8Array
): Promise<any> {
  const supa = adminClient();

  const filename = `export-${meetingId}-${Date.now()}.${format}`;
  const path = `${userId}/${filename}`;

  // Upload to storage
  const { error: uploadError } = await supa.storage
    .from("exports")
    .upload(path, content, {
      contentType:
        format === "pdf"
          ? "application/pdf"
          : format === "html"
          ? "text/html"
          : "text/plain",
    });

  if (uploadError) {
    throw new Error(`Failed to upload export: ${uploadError.message}`);
  }

  // Create asset record
  const { data: asset, error: assetError } = await supa
    .from("assets")
    .insert({
      meeting_id: meetingId,
      owner_id: userId,
      kind: "export",
      format,
      storage_path: path,
    })
    .select()
    .single();

  if (assetError) {
    throw new Error(`Failed to create asset record: ${assetError.message}`);
  }

  // Generate signed URL (valid for 1 hour)
  const { data: signedUrl } = await supa.storage
    .from("exports")
    .createSignedUrl(path, 3600);

  return {
    ...asset,
    signed_url: signedUrl?.signedUrl,
  };
}
