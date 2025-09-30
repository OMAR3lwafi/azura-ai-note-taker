// Third-party integrations: Notion, Trello, MS To-Do
import { adminClient } from "./supabase.ts";
import { kv } from "./kv.ts";

interface IntegrationConfig {
  provider: "notion" | "trello" | "todo";
  accessToken: string;
  workspaceId?: string;
  boardId?: string;
  listId?: string;
}

// Get user integration settings
export async function getIntegrationConfig(
  userId: string,
  provider: string
): Promise<IntegrationConfig | null> {
  const supa = adminClient();

  const { data } = await supa
    .from("integration_settings")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle();

  return data as IntegrationConfig | null;
}

// Store integration settings
export async function saveIntegrationConfig(
  userId: string,
  config: IntegrationConfig
): Promise<void> {
  const supa = adminClient();

  const { error } = await supa
    .from("integration_settings")
    .upsert(
      {
        user_id: userId,
        provider: config.provider,
        access_token: config.accessToken,
        config: {
          workspace_id: config.workspaceId,
          board_id: config.boardId,
          list_id: config.listId,
        },
      },
      { onConflict: "user_id,provider" }
    );

  if (error) {
    throw new Error(`Failed to save integration config: ${error.message}`);
  }
}

// Push tasks to Notion
export async function pushToNotion(
  userId: string,
  meetingId: string,
  summary: string,
  tasks: any[]
): Promise<any> {
  const config = await getIntegrationConfig(userId, "notion");
  if (!config) {
    throw new Error("Notion integration not configured");
  }

  // Check rate limit
  const rateLimitKey = `ratelimit:notion:${userId}`;
  const count = await kv.get(rateLimitKey);
  if (count && parseInt(count) > 10) {
    throw new Error("Rate limit exceeded for Notion integration");
  }

  try {
    // Create Notion page
    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.accessToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: config.workspaceId },
        properties: {
          Name: {
            title: [{ text: { content: `Meeting ${meetingId.substring(0, 8)}` } }],
          },
        },
        children: [
          {
            object: "block",
            type: "heading_2",
            heading_2: { rich_text: [{ text: { content: "Summary" } }] },
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: { rich_text: [{ text: { content: summary } }] },
          },
          {
            object: "block",
            type: "heading_2",
            heading_2: { rich_text: [{ text: { content: "Tasks" } }] },
          },
          ...tasks.map((task) => ({
            object: "block",
            type: "to_do",
            to_do: {
              rich_text: [{ text: { content: task.title } }],
              checked: false,
            },
          })),
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Notion API error");
    }

    // Update rate limit
    await kv.incr(rateLimitKey);
    await kv.expire(rateLimitKey, 3600);

    return await response.json();
  } catch (error) {
    console.error("Notion integration error:", error);
    throw error;
  }
}

// Push tasks to Trello
export async function pushToTrello(
  userId: string,
  meetingId: string,
  tasks: any[]
): Promise<any[]> {
  const config = await getIntegrationConfig(userId, "trello");
  if (!config) {
    throw new Error("Trello integration not configured");
  }

  const cards = [];

  for (const task of tasks) {
    try {
      const response = await fetch(
        `https://api.trello.com/1/cards?key=${config.accessToken}&token=${config.accessToken}&idList=${config.listId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: task.title,
            desc: `From meeting: ${meetingId}`,
            due: task.due_date || null,
          }),
        }
      );

      if (response.ok) {
        cards.push(await response.json());
      }
    } catch (error) {
      console.error(`Failed to create Trello card for task: ${task.title}`, error);
    }
  }

  return cards;
}

// Push tasks to Microsoft To-Do
export async function pushToMsTodo(
  userId: string,
  meetingId: string,
  tasks: any[]
): Promise<any[]> {
  const config = await getIntegrationConfig(userId, "todo");
  if (!config) {
    throw new Error("Microsoft To-Do integration not configured");
  }

  const createdTasks = [];

  for (const task of tasks) {
    try {
      const response = await fetch("https://graph.microsoft.com/v1.0/me/todo/lists/tasks/tasks", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: task.title,
          body: { content: `From meeting: ${meetingId}`, contentType: "text" },
          dueDateTime: task.due_date
            ? { dateTime: task.due_date, timeZone: "UTC" }
            : undefined,
        }),
      });

      if (response.ok) {
        createdTasks.push(await response.json());
      }
    } catch (error) {
      console.error(`Failed to create To-Do task: ${task.title}`, error);
    }
  }

  return createdTasks;
}

// Generic integration dispatcher
export async function pushToIntegration(
  userId: string,
  provider: "notion" | "trello" | "todo",
  meetingId: string,
  summary: string,
  tasks: any[]
): Promise<any> {
  // Idempotency check
  const idempotencyKey = `integration:${provider}:${meetingId}`;
  const existing = await kv.get(idempotencyKey);
  if (existing) {
    return { status: "already_pushed", data: JSON.parse(existing) };
  }

  let result;
  switch (provider) {
    case "notion":
      result = await pushToNotion(userId, meetingId, summary, tasks);
      break;
    case "trello":
      result = await pushToTrello(userId, meetingId, tasks);
      break;
    case "todo":
      result = await pushToMsTodo(userId, meetingId, tasks);
      break;
    default:
      throw new Error(`Unsupported integration provider: ${provider}`);
  }

  // Store idempotency record for 24 hours
  await kv.set(idempotencyKey, JSON.stringify(result), 86400);

  return { status: "success", data: result };
}
