"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { RequireAuth } from "@/components/RequireAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { clsx } from "@/lib/clsx";
import { timeAgo } from "@/lib/format";
import {
  getConnections,
  getRequests,
  openThread,
  respondToRequest,
} from "@/lib/queries";
import type { Connection, PartnershipRequest } from "@/lib/types";

const TABS = [
  { key: "incoming", label: "Incoming" },
  { key: "outgoing", label: "Sent" },
  { key: "connections", label: "Partnerships" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function StatusBadge({ status }: { status: PartnershipRequest["status"] }) {
  const map: Record<string, string> = {
    pending: "border-clay-400/40 bg-clay-100 text-clay-600",
    accepted: "pill-accent",
    declined: "border-line bg-canvas text-ink-faint",
    withdrawn: "border-line bg-canvas text-ink-faint",
  };
  return (
    <span className={clsx("pill capitalize", map[status])}>{status}</span>
  );
}

function RequestRow({
  request,
  onAction,
  busy,
}: {
  request: PartnershipRequest;
  onAction: (a: "accept" | "decline" | "withdraw") => void;
  busy: boolean;
}) {
  const other =
    request.direction === "incoming"
      ? request.from_business
      : request.to_business;
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3">
        <Avatar name={other.name} src={other.logo} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/business/${other.slug}`}
              className="font-serif text-[16px] font-semibold hover:text-forest-700"
            >
              {other.name}
            </Link>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-[13px] text-ink-faint">
            {other.category.name} · {other.location_label} ·{" "}
            {timeAgo(request.created_at)}
          </p>
        </div>
      </div>

      <p className="mt-3 rounded-lg bg-canvas px-3 py-2 text-sm text-ink-soft">
        “{request.message}”
      </p>

      {request.status === "pending" && (
        <div className="mt-4 flex gap-2">
          {request.direction === "incoming" ? (
            <>
              <Button
                size="sm"
                loading={busy}
                onClick={() => onAction("accept")}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => onAction("decline")}
              >
                Decline
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              loading={busy}
              onClick={() => onAction("withdraw")}
            >
              Withdraw request
            </Button>
          )}
        </div>
      )}

      {request.status === "accepted" && (
        <div className="mt-4">
          <ButtonLink
            href={`/messages?with=${other.slug}`}
            size="sm"
            variant="secondary"
          >
            Message {other.name}
          </ButtonLink>
        </div>
      )}
    </div>
  );
}

function RequestsInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { notify } = useToast();

  const tab = (params.get("box") as TabKey) || "incoming";
  const [requests, setRequests] = useState<PartnershipRequest[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    if (tab === "connections") {
      getConnections()
        .then(setConnections)
        .catch(() => setConnections([]))
        .finally(() => setLoading(false));
    } else {
      getRequests({ box: tab })
        .then((res) => setRequests(res.results))
        .catch(() => setRequests([]))
        .finally(() => setLoading(false));
    }
  }, [tab]);

  useEffect(load, [load]);

  async function act(
    req: PartnershipRequest,
    action: "accept" | "decline" | "withdraw",
  ) {
    setBusyId(req.id);
    try {
      await respondToRequest(req.id, action);
      notify(
        action === "accept"
          ? "Partnership confirmed — you can message them now."
          : `Request ${action}d.`,
        action === "accept" ? "success" : "info",
      );
      load();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Couldn’t update.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function message(slug: string) {
    try {
      const thread = await openThread(slug);
      router.push(`/messages?thread=${thread.id}`);
    } catch {
      notify("Couldn’t open the conversation.", "error");
    }
  }

  return (
    <div className="container-page py-10">
      <span className="eyebrow">Requests</span>
      <h1 className="mt-2 text-3xl">Partnership inbox</h1>

      <div className="mt-6 flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/requests?box=${t.key}`}
            className={clsx(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium",
              tab === t.key
                ? "border-forest-600 text-forest-700"
                : "border-transparent text-ink-soft hover:text-ink",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {loading ? (
          [0, 1].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-card bg-line/60" />
          ))
        ) : tab === "connections" ? (
          connections.length ? (
            connections.map((c) => (
              <div key={c.id} className="card flex items-center gap-3 p-5">
                <Avatar name={c.partner.name} src={c.partner.logo} />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/business/${c.partner.slug}`}
                    className="font-serif font-semibold hover:text-forest-700"
                  >
                    {c.partner.name}
                  </Link>
                  <p className="text-[13px] text-ink-faint">
                    Partners since {timeAgo(c.created_at)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => message(c.partner.slug)}
                >
                  Message
                </Button>
              </div>
            ))
          ) : (
            <EmptyState
              className="md:col-span-2"
              title="No partnerships yet"
              description="Accepted requests become partnerships and unlock messaging."
              action={
                <ButtonLink href="/matches" size="sm">
                  Find matches
                </ButtonLink>
              }
            />
          )
        ) : requests.length ? (
          requests.map((r) => (
            <RequestRow
              key={r.id}
              request={r}
              busy={busyId === r.id}
              onAction={(a) => act(r, a)}
            />
          ))
        ) : (
          <EmptyState
            className="md:col-span-2"
            title={
              tab === "incoming"
                ? "No incoming requests"
                : "You haven't sent any requests"
            }
            description={
              tab === "incoming"
                ? "When another business wants to partner with you, it shows up here."
                : "Browse your matches and send a note to the ones that fit."
            }
            action={
              tab === "outgoing" ? (
                <ButtonLink href="/matches" size="sm">
                  Find matches
                </ButtonLink>
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  );
}

export default function RequestsPage() {
  return (
    <RequireAuth>
      <Suspense>
        <RequestsInner />
      </Suspense>
    </RequireAuth>
  );
}
