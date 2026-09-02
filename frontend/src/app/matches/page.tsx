"use client";

import { useEffect, useState } from "react";

import { MatchCard } from "@/components/MatchCard";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getMatches } from "@/lib/queries";
import type { Match } from "@/lib/types";

const FILTERS = [
  { label: "All matches", min: 0 },
  { label: "Good & up (55+)", min: 55 },
  { label: "Strong only (75+)", min: 75 },
];

function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState(0);

  useEffect(() => {
    setLoading(true);
    getMatches({ min_score: minScore, limit: 48 })
      .then((res) => setMatches(res.results))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, [minScore]);

  return (
    <div className="container-page py-10">
      <span className="eyebrow">Matches</span>
      <h1 className="mt-2 text-3xl">Businesses you should be working with</h1>
      <p className="mt-2 max-w-xl text-ink-soft">
        Ranked by shared audience, complementary industry, and proximity. Each
        score shows exactly how it breaks down.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.min}
            variant={minScore === f.min ? "primary" : "secondary"}
            size="sm"
            onClick={() => setMinScore(f.min)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-card bg-line/60"
              />
            ))}
          </div>
        ) : matches.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {matches.map((m) => (
              <MatchCard key={m.business.id} match={m} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No matches at this threshold"
            description="Lower the filter, or add more audience tags to your profile so we have more to work with."
          />
        )}
      </div>
    </div>
  );
}

export default function MatchesPage() {
  return (
    <RequireAuth>
      <Matches />
    </RequireAuth>
  );
}
