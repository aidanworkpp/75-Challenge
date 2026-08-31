import nodemailer, { type Transporter } from "nodemailer";
import type { CommitmentItem, DailyLogEntry } from "./types";
import { isEntryHit } from "./completion";

// Gmail SMTP via nodemailer. Requires:
//   GMAIL_USER              — the sending Gmail address
//   GMAIL_APP_PASSWORD      — a Google app password (NOT your normal password)
//   (optional) GMAIL_FROM_NAME — display name shown next to the address
//
// Get an app password: https://myaccount.google.com/apppasswords
// (Requires 2-step verification enabled on the account.)

export function getMailer(): Transporter | null {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export function fromAddress(): string {
  const user = process.env.GMAIL_USER ?? "reminders@example.com";
  const name = process.env.GMAIL_FROM_NAME ?? "75-something";
  return `"${name}" <${user}>`;
}

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

// Single afternoon reminder — shows what's ticked and what's still outstanding.
export function afternoonTemplate(opts: {
  displayName: string;
  dayNumber: number;
  totalDays: number;
  items: CommitmentItem[];
  entries: DailyLogEntry[];
}) {
  const missed = opts.items.filter(
    (i) => !i.optional && !isEntryHit(i, opts.entries.find((e) => e.commitment_item_id === i.id)),
  );
  const remaining = missed.length;

  const subject =
    remaining === 0
      ? `Day ${opts.dayNumber} · already done`
      : `Day ${opts.dayNumber} · ${remaining} left to finish today`;

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
      ? `<p style="margin:0 0 16px 0">Everything required is ticked. Nice.</p>`
      : `<p style="margin:0 0 16px 0;color:#8b93a3">You still have <strong style="color:#eef1f6">${remaining}</strong> required item${remaining === 1 ? "" : "s"} left before end of day.</p>`;

  const html = shell(`
    <h1 style="margin:0 0 8px 0;font-size:22px">Afternoon check-in${opts.displayName ? `, ${escapeHtml(opts.displayName)}` : ""}</h1>
    <p style="margin:0 0 16px 0;color:#8b93a3">Day <strong style="color:#eef1f6">${opts.dayNumber}</strong> of ${opts.totalDays}.</p>
    ${body}
    <ul style="padding-left:20px;margin:0 0 20px 0;list-style:none">${listHtml}</ul>
    ${cta(remaining === 0 ? "See your streak" : "Finish today")}
  `);

  const text =
    `Day ${opts.dayNumber} check-in\n\n` +
    (remaining === 0
      ? `Everything required is ticked. Nice.\n\n`
      : `${remaining} required item${remaining === 1 ? "" : "s"} outstanding.\n\n`) +
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
