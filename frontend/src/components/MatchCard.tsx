import Link from "next/link";

import { Avatar } from "@/components/ui/Avatar";
import { ScoreBar, ScoreDial } from "@/components/ui/ScoreMeter";
import { ButtonLink } from "@/components/ui/Button";
import type { Match } from "@/lib/types";

export function MatchCard({ match }: { match: Match }) {
  const { business, match: m } = match;
  return (
    <div className="card flex h-full flex-col p-5">
      <div className="flex items-start gap-3">
        <Avatar name={business.name} src={business.logo} />
        <div className="min-w-0 flex-1">
          <Link
            href={`/business/${business.slug}`}
            className="font-serif text-[17px] font-semibold text-ink hover:text-forest-700"
          >
            {business.name}
          </Link>
          <p className="text-[13px] text-ink-faint">
            {business.category.name} · {business.location_label}
          </p>
        </div>
        <ScoreDial score={m.score} />
      </div>

      <p className="mt-3 text-sm text-ink-soft">{m.reason}.</p>

      {m.shared_tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {m.shared_tags.slice(0, 4).map((t) => (
            <span key={t} className="pill pill-accent">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-2.5">
        <ScoreBar label="Audience overlap" value={m.components.audience} />
        <ScoreBar label="Industry fit" value={m.components.category} />
        <ScoreBar label="Proximity" value={m.components.proximity} />
      </div>

      <div className="mt-5 flex gap-2">
        <ButtonLink
          href={`/business/${business.slug}`}
          variant="secondary"
          size="sm"
          className="flex-1"
        >
          View profile
        </ButtonLink>
        <ButtonLink
          href={`/business/${business.slug}?connect=1`}
          size="sm"
          className="flex-1"
        >
          Request partnership
        </ButtonLink>
      </div>
    </div>
  );
}
