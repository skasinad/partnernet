"use client";

import Link from "next/link";
import { Suspense, use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useAuth } from "@/components/AuthProvider";
import { ConnectPanel } from "@/components/ConnectPanel";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { ScoreBar, ScoreDial } from "@/components/ui/ScoreMeter";
import { ApiError } from "@/lib/api";
import { PRICE_LABELS, SIZE_LABELS, type Business, type MatchBreakdown } from "@/lib/types";
import { getBusiness, getCompatibility } from "@/lib/queries";

function ProfileInner({ slug }: { slug: string }) {
  const { user } = useAuth();
  const params = useSearchParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [compat, setCompat] = useState<MatchBreakdown | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">(
    "loading",
  );

  useEffect(() => {
    getBusiness(slug)
      .then((b) => {
        setBusiness(b);
        setStatus("ready");
      })
      .catch((err) => {
        setStatus(err instanceof ApiError && err.status === 404 ? "notfound" : "ready");
      });
  }, [slug]);

  useEffect(() => {
    if (!business || !user?.has_business || business.is_owner) return;
    getCompatibility(slug)
      .then(setCompat)
      .catch(() => {});
  }, [business, user?.has_business, slug]);

  if (status === "loading") {
    return (
      <div className="container-page py-16">
        <div className="h-40 animate-pulse rounded-card bg-line/60" />
      </div>
    );
  }

  if (status === "notfound" || !business) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl">Business not found</h1>
        <p className="mt-2 text-ink-soft">
          It may have been removed or the link is wrong.
        </p>
        <ButtonLink href="/discover" className="mt-6" variant="secondary">
          Back to discover
        </ButtonLink>
      </div>
    );
  }

  const canConnect =
    user?.has_business && !business.is_owner && business.open_to_partnerships;

  return (
    <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_340px]">
      <div>
        <div className="flex items-start gap-4">
          <Avatar name={business.name} src={business.logo} size="lg" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl">{business.name}</h1>
              {business.is_owner && (
                <span className="pill">Your business</span>
              )}
            </div>
            <p className="mt-1 text-ink-soft">
              {business.category.name} · {business.location_label},{" "}
              {business.country}
            </p>
          </div>
        </div>

        {business.tagline && (
          <p className="mt-5 font-serif text-xl text-ink">{business.tagline}</p>
        )}

        {business.description && (
          <p className="mt-4 whitespace-pre-wrap text-ink-soft">
            {business.description}
          </p>
        )}

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="card p-5">
            <p className="eyebrow">At a glance</p>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Price tier" value={PRICE_LABELS[business.price_tier]} />
              <Row label="Team size" value={SIZE_LABELS[business.size]} />
              <Row
                label="Partnerships"
                value={
                  business.open_to_partnerships ? "Open" : "Not right now"
                }
              />
            </dl>
          </div>
          <div className="card p-5">
            <p className="eyebrow">Find them</p>
            <div className="mt-3 space-y-2 text-sm">
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-forest-700 hover:underline"
                >
                  {business.website.replace(/^https?:\/\//, "")}
                </a>
              )}
              {business.instagram && (
                <a
                  href={`https://instagram.com/${business.instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-forest-700 hover:underline"
                >
                  @{business.instagram}
                </a>
              )}
              {business.contact_email && (
                <a
                  href={`mailto:${business.contact_email}`}
                  className="block text-forest-700 hover:underline"
                >
                  {business.contact_email}
                </a>
              )}
              {!business.website &&
                !business.instagram &&
                !business.contact_email && (
                  <p className="text-ink-faint">No links added yet.</p>
                )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <p className="eyebrow">Who their customers are</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {business.audience_tags.map((t) => (
              <span key={t.id} className="pill">
                {t.name}
              </span>
            ))}
          </div>
        </div>

        {business.partnership_pitch && (
          <div className="mt-8 rounded-card border border-forest-200 bg-forest-50 p-5">
            <p className="eyebrow text-forest-600">Looking for</p>
            <p className="mt-2 text-forest-900">{business.partnership_pitch}</p>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="space-y-6">
        {business.is_owner ? (
          <div className="card p-5">
            <p className="text-sm text-ink-soft">
              This is how other owners see your business.
            </p>
            <ButtonLink
              href="/settings"
              variant="secondary"
              size="sm"
              className="mt-3 w-full"
            >
              Edit profile
            </ButtonLink>
          </div>
        ) : canConnect ? (
          <ConnectPanel
            business={business}
            autoOpen={params.get("connect") === "1"}
          />
        ) : !user ? (
          <div className="card p-5 text-sm text-ink-soft">
            <p>
              <Link href="/register" className="font-medium text-forest-700 hover:underline">
                Create a profile
              </Link>{" "}
              to request a partnership with {business.name}.
            </p>
          </div>
        ) : !user.has_business ? (
          <div className="card p-5 text-sm text-ink-soft">
            <Link
              href="/onboarding"
              className="font-medium text-forest-700 hover:underline"
            >
              Finish your business profile
            </Link>{" "}
            to send partnership requests.
          </div>
        ) : null}

        {compat && (
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <ScoreDial score={compat.score} />
              <div>
                <p className="font-serif text-lg">Compatibility</p>
                <p className="text-xs text-ink-faint">
                  Between you and {business.name}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-ink-soft">{compat.reason}.</p>
            <div className="mt-4 space-y-2.5">
              <ScoreBar label="Audience overlap" value={compat.components.audience} />
              <ScoreBar label="Industry fit" value={compat.components.category} />
              <ScoreBar label="Proximity" value={compat.components.proximity} />
            </div>
            {compat.shared_tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {compat.shared_tags.map((t) => (
                  <span key={t} className="pill pill-accent">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

export default function BusinessProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return (
    <Suspense>
      <ProfileInner slug={slug} />
    </Suspense>
  );
}
