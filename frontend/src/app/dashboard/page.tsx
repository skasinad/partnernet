"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import { MatchCard } from "@/components/MatchCard";
import { RequireAuth } from "@/components/RequireAuth";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { timeAgo } from "@/lib/format";
import {
  getMatches,
  getMyBusiness,
  getRequestSummary,
  getThreads,
} from "@/lib/queries";
import type { Business, Match, ThreadSummary } from "@/lib/types";

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="card flex flex-col gap-1 p-5 transition-shadow hover:shadow-lift"
    >
      <span className="font-serif text-3xl text-ink">{value}</span>
      <span className="text-sm text-ink-soft">{label}</span>
    </Link>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [summary, setSummary] = useState({
    incoming_pending: 0,
    outgoing_pending: 0,
    connections: 0,
  });
  const [matches, setMatches] = useState<Match[]>([]);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMyBusiness().catch(() => null),
      getRequestSummary().catch(() => summary),
      getMatches({ limit: 3 }).catch(() => ({ count: 0, results: [] })),
      getThreads().catch(() => []),
    ]).then(([b, s, m, t]) => {
      setBusiness(b);
      setSummary(s);
      setMatches(m.results);
      setThreads(t.slice(0, 4));
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1 className="mt-2 text-3xl">
            Hi {user?.full_name?.split(" ")[0] || "there"}
          </h1>
          {business && (
            <p className="mt-1 text-ink-soft">
              Managing{" "}
              <Link
                href={`/business/${business.slug}`}
                className="font-medium text-forest-700 hover:underline"
              >
                {business.name}
              </Link>
            </p>
          )}
        </div>
        <ButtonLink href="/settings" variant="secondary" size="sm">
          Edit profile
        </ButtonLink>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Requests to review"
          value={summary.incoming_pending}
          href="/requests"
        />
        <StatCard
          label="Requests you've sent"
          value={summary.outgoing_pending}
          href="/requests?box=outgoing"
        />
        <StatCard
          label="Active partnerships"
          value={summary.connections}
          href="/requests?box=connections"
        />
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Top matches for you</h2>
            <Link
              href="/matches"
              className="text-sm font-medium text-forest-700 hover:underline"
            >
              See all
            </Link>
          </div>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {loading ? (
              [0, 1].map((i) => (
                <div
                  key={i}
                  className="h-72 animate-pulse rounded-card bg-line/60"
                />
              ))
            ) : matches.length ? (
              matches.map((m) => <MatchCard key={m.business.id} match={m} />)
            ) : (
              <EmptyState
                className="sm:col-span-2"
                title="No matches yet"
                description="Add a few more audience tags to your profile to widen the net."
                action={
                  <ButtonLink href="/settings" size="sm">
                    Update profile
                  </ButtonLink>
                }
              />
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Recent messages</h2>
            <Link
              href="/messages"
              className="text-sm font-medium text-forest-700 hover:underline"
            >
              Open inbox
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {loading ? (
              <div className="h-40 animate-pulse rounded-card bg-line/60" />
            ) : threads.length ? (
              threads.map((t) => (
                <Link
                  key={t.id}
                  href={`/messages?thread=${t.id}`}
                  className="card flex items-center gap-3 p-3 transition-shadow hover:shadow-lift"
                >
                  <Avatar
                    name={t.partner.name}
                    src={t.partner.logo}
                    size="sm"
                  />
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
                    <span className="h-2 w-2 rounded-full bg-clay-400" />
                  )}
                </Link>
              ))
            ) : (
              <EmptyState
                title="No conversations"
                description="Once a partnership request is accepted you can message each other here."
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}
