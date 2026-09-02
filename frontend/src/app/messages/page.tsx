"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { RequireAuth } from "@/components/RequireAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { clsx } from "@/lib/clsx";
import { timeAgo } from "@/lib/format";
import {
  getMessages,
  getThreads,
  openThread,
  postMessage,
} from "@/lib/queries";
import type { Message, ThreadSummary } from "@/lib/types";

function Conversation({
  thread,
  onSent,
  onBack,
}: {
  thread: ThreadSummary;
  onSent: () => void;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const stickToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  const load = useCallback(async () => {
    try {
      setMessages(await getMessages(thread.id));
    } catch {
      /* ignore */
    }
  }, [thread.id]);

  useEffect(() => {
    setMessages(null);
    load();
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    stickToBottom();
  }, [messages?.length, stickToBottom]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const msg = await postMessage(thread.id, body);
      setMessages((m) => [...(m ?? []), msg]);
      setDraft("");
      onSent();
      requestAnimationFrame(() => stickToBottom(true));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-line p-4">
        <button
          onClick={onBack}
          className="-ml-1 rounded-full p-1 text-ink-soft hover:bg-canvas md:hidden"
          aria-label="Back to conversations"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <Avatar name={thread.partner.name} src={thread.partner.logo} size="sm" />
        <div>
          <Link
            href={`/business/${thread.partner.slug}`}
            className="font-serif font-semibold hover:text-forest-700"
          >
            {thread.partner.name}
          </Link>
          <p className="text-xs text-ink-faint">
            {thread.partner.category.name} · {thread.partner.location_label}
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
      >
        {messages === null ? (
          <p className="text-sm text-ink-faint">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="mx-auto max-w-xs pt-10 text-center text-sm text-ink-faint">
            You’re connected with {thread.partner.name}. Say hello and pitch
            your idea.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={clsx("flex", m.mine ? "justify-end" : "justify-start")}
            >
              <div
                className={clsx(
                  "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm",
                  m.mine
                    ? "rounded-br-sm bg-forest-700 text-white"
                    : "rounded-bl-sm border border-line bg-surface text-ink",
                )}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p
                  className={clsx(
                    "mt-1 text-[10px]",
                    m.mine ? "text-forest-100" : "text-ink-faint",
                  )}
                >
                  {timeAgo(m.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
        <input
          className="field-input"
          placeholder={`Message ${thread.partner.name}…`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="submit" loading={sending} disabled={!draft.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}

function MessagesInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const activeId = params.get("thread");
  const withSlug = params.get("with");

  const load = useCallback(async () => {
    try {
      setThreads(await getThreads());
    } catch {
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!withSlug) return;
    openThread(withSlug)
      .then((thread) => router.replace(`/messages?thread=${thread.id}`))
      .catch(() => router.replace("/messages"));
  }, [withSlug, router]);

  const active = threads.find((t) => String(t.id) === activeId) ?? null;

  return (
    <div className="container-page py-10">
      <span className="eyebrow">Messages</span>
      <h1 className="mt-2 text-3xl">Conversations with your partners</h1>

      <div className="mt-6 grid h-[72vh] min-h-[460px] gap-0 overflow-hidden rounded-card border border-line bg-surface md:h-[620px] md:grid-cols-[300px_1fr]">
        <aside
          className={clsx(
            "min-h-0 border-line md:block md:border-r",
            active ? "hidden" : "block",
          )}
        >
          <div className="h-full overflow-y-auto">
            {loading ? (
              <p className="p-4 text-sm text-ink-faint">Loading…</p>
            ) : threads.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="No conversations"
                  description="Accept a partnership request to start messaging."
                />
              </div>
            ) : (
              threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => router.push(`/messages?thread=${t.id}`)}
                  className={clsx(
                    "flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors",
                    String(t.id) === activeId
                      ? "bg-forest-50"
                      : "hover:bg-canvas",
                  )}
                >
                  <Avatar name={t.partner.name} src={t.partner.logo} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {t.partner.name}
                    </p>
                    <p className="truncate text-xs text-ink-faint">
                      {t.last_message
                        ? `${t.last_message.mine ? "You: " : ""}${t.last_message.body}`
                        : "No messages yet"}
                    </p>
                  </div>
                  {t.unread_count > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-clay-400 px-1 text-[10px] font-semibold text-white">
                      {t.unread_count}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        <div className={clsx("min-h-0", active ? "block" : "hidden md:block")}>
          {active ? (
            <Conversation
              thread={active}
              onSent={load}
              onBack={() => router.push("/messages")}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center text-sm text-ink-faint">
              {threads.length
                ? "Pick a conversation to open it."
                : "Your partner conversations will appear here."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <RequireAuth>
      <Suspense>
        <MessagesInner />
      </Suspense>
    </RequireAuth>
  );
}
