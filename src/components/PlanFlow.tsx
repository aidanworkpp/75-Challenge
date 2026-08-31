"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import clsx from "clsx";

type Msg = { role: "user" | "assistant"; content: string };

export default function PlanFlow({
  kind,
  planTitle,
  renderForm,
}: {
  kind: "meal" | "workout";
  planTitle: string;
  renderForm: (submit: (initialPrompt: string) => void, busy: boolean) => React.ReactNode;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [followUp, setFollowUp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  const started = messages.length > 0;

  async function send(newMessages: Msg[]) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, messages: newMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setMessages([...newMessages, { role: "assistant", content: data.text }]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function submitForm(initialPrompt: string) {
    void send([{ role: "user", content: initialPrompt }]);
  }

  function submitFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!followUp.trim() || busy) return;
    const next = [...messages, { role: "user" as const, content: followUp.trim() }];
    setFollowUp("");
    void send(next);
  }

  function reset() {
    if (!confirm("Start over? This clears the current plan.")) return;
    setMessages([]);
    setError(null);
  }

  function print() {
    window.print();
  }

  // Auto-scroll to newest message
  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  if (!started) {
    return (
      <div>
        {renderForm(submitForm, busy)}
        {error && <p className="text-danger text-sm mt-3">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div ref={printAreaRef} className="plan-print space-y-4">
        <div className="hidden print:block mb-4">
          <h1 className="text-2xl font-bold">{planTitle}</h1>
          <p className="text-sm text-gray-600">Generated {new Date().toLocaleDateString()}</p>
        </div>

        {messages.map((m, i) => (
          <Message key={i} msg={m} />
        ))}

        <div ref={bottomRef} />
      </div>

      {busy && (
        <div className="text-muted text-sm">Thinking…</div>
      )}
      {error && <p className="text-danger text-sm">{error}</p>}

      <div className="print:hidden">
        <form onSubmit={submitFollowUp} className="flex gap-2">
          <input
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
            disabled={busy}
            className="flex-1 rounded-md bg-surface border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder='e.g. "swap chicken for tofu" or "more variety"'
          />
          <button
            type="submit"
            disabled={busy || !followUp.trim()}
            className="rounded-md bg-accent text-black font-semibold px-4 disabled:opacity-60"
          >
            Send
          </button>
        </form>

        <div className="flex gap-2 mt-3">
          <button
            onClick={print}
            className="flex-1 rounded-md border border-border bg-surface py-2 text-sm"
          >
            Print / Save as PDF
          </button>
          <button
            onClick={reset}
            className="flex-1 rounded-md border border-border bg-surface py-2 text-sm"
          >
            Start over
          </button>
        </div>
      </div>
    </div>
  );
}

function Message({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div
      className={clsx(
        "rounded-lg border p-3",
        isUser ? "bg-surface2 border-border print:bg-white print:text-black" : "bg-surface border-border print:bg-white print:text-black",
      )}
    >
      <div className={clsx("text-xs uppercase tracking-wider mb-2", isUser ? "text-muted print:text-gray-600" : "text-accent print:text-orange-600")}>
        {isUser ? "You" : "Coach"}
      </div>
      <div className="prose-plan text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
      </div>
    </div>
  );
}
