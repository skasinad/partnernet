"use client";

import { useEffect, useState } from "react";

import { BusinessCard } from "@/components/BusinessCard";
import { discoverBusinesses } from "@/lib/queries";
import type { Business } from "@/lib/types";

export function FeaturedBusinesses() {
  const [items, setItems] = useState<Business[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    discoverBusinesses({ ordering: "name" })
      .then((res) => setItems(res.results.slice(0, 6)))
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <p className="text-sm text-ink-faint">
        Couldn’t reach the API. Make sure the backend is running on{" "}
        <code>NEXT_PUBLIC_API_URL</code>.
      </p>
    );
  }

  if (!items) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 animate-pulse rounded-card bg-line/60" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((b) => (
        <BusinessCard key={b.id} business={b} />
      ))}
    </div>
  );
}
