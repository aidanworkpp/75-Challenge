import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { MEAL_SYSTEM_PROMPT, WORKOUT_SYSTEM_PROMPT } from "@/lib/plan-prompts";

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const kind = body?.kind === "workout" ? "workout" : body?.kind === "meal" ? "meal" : null;
  if (!kind) return NextResponse.json({ error: "Invalid kind" }, { status: 400 });

  const messages: Msg[] = Array.isArray(body?.messages) ? body.messages : [];
  if (messages.length === 0) return NextResponse.json({ error: "No messages" }, { status: 400 });

  // Basic sanitation — trim any absurdly long inputs
  const safeMessages = messages.slice(-20).map((m) => ({
    role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: String(m.content ?? "").slice(0, 4000),
  }));

  const systemPrompt = kind === "meal" ? MEAL_SYSTEM_PROMPT : WORKOUT_SYSTEM_PROMPT;

  const client = new OpenAI({ apiKey: key });

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 1500,
      messages: [
        { role: "system", content: systemPrompt },
        ...safeMessages,
      ],
    });
    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ text });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "OpenAI call failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
