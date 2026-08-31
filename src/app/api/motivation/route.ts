import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

// [A10] Never fabricate quotes from real people. Prompt frames output as
// "in the style of" motivational content and instructs the model to not attribute
// invented quotes to real individuals.

const STYLE_LABELS: Record<string, string> = {
  goggins:  "in the style of David Goggins — raw, blunt, no-excuses intensity",
  drill:    "in the style of a drill instructor — direct, demanding",
  coach:    "in the style of a firm sports coach — high standards, no drama",
  stoic:    "in the style of stoic philosophy — calm, principled, unemotional",
  gentle:   "in the style of a supportive friend — warm, encouraging, no pressure",
};

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const style = typeof body?.style === "string" && STYLE_LABELS[body.style] ? body.style : "coach";
  const context = typeof body?.context === "string" ? body.context.slice(0, 200) : "";

  const client = new OpenAI({ apiKey: key });

  const systemPrompt = [
    "You write short, original motivational messages in a requested style.",
    "Strict rules:",
    "- Never attribute a quote to a real named person.",
    "- Never fabricate quotes from any real individual.",
    "- Write the message as original content in the described style, not as a quotation.",
    "- No hashtags, no emojis.",
    "- Second person ('you').",
    "- 40 to 80 words.",
  ].join("\n");

  const userPrompt = [
    `Write a motivational message ${STYLE_LABELS[style]}.`,
    `Context: the reader is partway through a personal-discipline challenge (workouts, diet, reading, water).`,
    context ? `They added this note: "${context}"` : "",
  ].filter(Boolean).join("\n");

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 300,
      temperature: 0.9,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ text, style });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "OpenAI call failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
