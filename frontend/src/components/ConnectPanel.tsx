"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { getRequests, sendRequest } from "@/lib/queries";
import type { Business, PartnershipRequest } from "@/lib/types";

export function ConnectPanel({
  business,
  autoOpen = false,
}: {
  business: Business;
  autoOpen?: boolean;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [open, setOpen] = useState(autoOpen);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [existing, setExisting] = useState<PartnershipRequest | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    getRequests()
      .then((res) => {
        const rel = res.results.find(
          (r) =>
            r.from_business.slug === business.slug ||
            r.to_business.slug === business.slug,
        );
        setExisting(rel ?? null);
      })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [business.slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 10) {
      notify("Add a sentence or two so they know why.", "error");
      return;
    }
    setSending(true);
    try {
      await sendRequest(business.slug, message.trim());
      notify(`Request sent to ${business.name}.`, "success");
      router.push("/requests?box=outgoing");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Couldn’t send.", "error");
      setSending(false);
    }
  }

  if (checked && existing) {
    const label =
      existing.status === "pending"
        ? existing.direction === "outgoing"
          ? "You’ve already sent a request — it’s pending."
          : "They’ve sent you a request. Check your inbox."
        : existing.status === "accepted"
          ? "You’re already partners."
          : `Previous request was ${existing.status}.`;
    return (
      <div className="card p-5">
        <p className="text-sm text-ink-soft">{label}</p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3 w-full"
          onClick={() => router.push("/requests")}
        >
          Go to requests
        </Button>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <p className="font-serif text-lg">Request a partnership</p>
      <p className="mt-1 text-sm text-ink-soft">
        Send {business.name} a short note about what you have in mind.
      </p>
      {open ? (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <textarea
            autoFocus
            rows={5}
            className="field-input"
            placeholder={`Hi — we're a ${"nearby business"} and I think our customers overlap. Would you be open to…`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={sending} className="flex-1">
              Send request
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          size="sm"
          className="mt-4 w-full"
          onClick={() => setOpen(true)}
        >
          Write a request
        </Button>
      )}
    </div>
  );
}
