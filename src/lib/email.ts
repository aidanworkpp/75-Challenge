import { Resend } from "resend";
import type { CommitmentItem, DailyLogEntry } from "./types";
import { isEntryHit } from "./completion";

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export function fromAddress(): string {
  return process.env.REMINDER_FROM_EMAIL ?? "reminders@example.com";
}

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

// ---------- templates ----------

export function morningTemplate(opts: {
  displayName: string;
  dayNumber: number;
  totalDays: number;
  items: CommitmentItem[];
}) {
  const listHtml = opts.items
    .map((i) => {
      const target =
        i.type === "numeric" && i.target_value
          ? ` <span style="color:#8b93a3">— ${i.target_value}${i.unit ? " " + i.unit : ""}</span>`
          : "";
      const opt = i.optional ? ' <span style="color:#8b93a3;font-style:italic">(optional)</span>' : "";
      return `<li style="margin:6px 0">${escapeHtml(i.label)}${target}${opt}</li>`;
    })
    .join("");

  const subject = `Day ${opts.dayNumber} · here's today's list`;
  const html = shell(`
    <h1 style="margin:0 0 8px 0;font-size:22px">Good morning${opts.displayName ? `, ${escapeHtml(opts.displayName)}` : ""}.</h1>
    <p style="margin:0 0 16px 0;color:#8b93a3">Day <strong style="color:#eef1f6">${opts.dayNumber}</strong> of ${opts.totalDays}. Here's what's on your list:</p>
    <ul style="padding-left:20px;margin:0 0 20px 0">${listHtml}</ul>
    ${cta("Open today's checklist")}
  `);
  const text =
    `Good morning${opts.displayName ? `, ${opts.displayName}` : ""}.\n\n` +
    `Day ${opts.dayNumber} of ${opts.totalDays}.\n\n` +
    opts.items.map((i) => `- ${i.label}${i.type === "numeric" && i.target_value ? ` (${i.target_value}${i.unit ? " " + i.unit : ""})` : ""}${i.optional ? " (optional)" : ""}`).join("\n") +
    `\n\n${appUrl()}/`;
  return { subject, html, text };
}

export function eveningTemplate(opts: {
  displayName: string;
  dayNumber: number;
  totalDays: number;
  streak: number;
  items: CommitmentItem[];
  entries: DailyLogEntry[];
}) {
  const missed = opts.items.filter((i) => !i.optional && !isEntryHit(i, opts.entries.find((e) => e.commitment_item_id === i.id)));
  const remaining = missed.length;

  const subject =
    remaining === 0
      ? `Day ${opts.dayNumber} done — streak ${opts.streak + 1}`
      : `Day ${opts.dayNumber} · ${remaining} left before midnight`;

  const listHtml = opts.items
    .map((i) => {
      const entry = opts.entries.find((e) => e.commitment_item_id === i.id);
      const hit = isEntryHit(i, entry);
      const mark = hit ? "✓" : "○";
      const colour = hit ? "#22c55e" : "#8b93a3";
      let detail = "";
      if (i.type === "numeric" && i.target_value) {
        const v = entry?.numeric_value ?? 0;
        detail = ` <span style="color:#8b93a3">${v}/${i.target_value}${i.unit ? " " + i.unit : ""}</span>`;
      }
      return `<li style="margin:6px 0;color:${colour}">${mark} ${escapeHtml(i.label)}${detail}</li>`;
    })
    .join("");

  const body =
    remaining === 0
      ? `<p style="margin:0 0 16px 0">Nice — everything required is ticked. That's a complete day.</p>`
      : `<p style="margin:0 0 16px 0;color:#8b93a3">You still have <strong style="color:#eef1f6">${remaining}</strong> required item${remaining === 1 ? "" : "s"} outstanding. Log them before your local midnight to keep the day complete.</p>`;

  const html = shell(`
    <h1 style="margin:0 0 8px 0;font-size:22px">Day ${opts.dayNumber} check-in</h1>
    ${body}
    <ul style="padding-left:20px;margin:0 0 20px 0;list-style:none">${listHtml}</ul>
    ${cta(remaining === 0 ? "See your streak" : "Finish today")}
  `);
  const text =
    `Day ${opts.dayNumber} check-in\n\n` +
    opts.items
      .map((i) => {
        const entry = opts.entries.find((e) => e.commitment_item_id === i.id);
        const hit = isEntryHit(i, entry);
        const mark = hit ? "[x]" : "[ ]";
        return `${mark} ${i.label}${i.type === "numeric" && i.target_value ? ` (${entry?.numeric_value ?? 0}/${i.target_value}${i.unit ? " " + i.unit : ""})` : ""}`;
      })
      .join("\n") +
    `\n\n${appUrl()}/`;
  return { subject, html, text };
}

// ---------- helpers ----------

function shell(inner: string): string {
  return `<!doctype html><html><body style="margin:0;background:#0b0c0f;color:#eef1f6;font-family:-apple-system,Segoe UI,Roboto,sans-serif">
    <div style="max-width:520px;margin:0 auto;padding:24px">
      <div style="background:#15171c;border:1px solid #2a2e38;border-radius:12px;padding:24px">
        ${inner}
      </div>
      <p style="color:#8b93a3;font-size:12px;text-align:center;margin-top:16px">
        75-something · <a href="${appUrl()}/settings" style="color:#8b93a3">manage reminders</a>
      </p>
    </div>
  </body></html>`;
}

function cta(label: string): string {
  return `<a href="${appUrl()}/" style="display:inline-block;background:#f97316;color:#000;font-weight:600;padding:10px 16px;border-radius:8px;text-decoration:none">${label}</a>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!
  ));
}
