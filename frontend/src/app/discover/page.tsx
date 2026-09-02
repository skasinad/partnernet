"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { BusinessCard } from "@/components/BusinessCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { clsx } from "@/lib/clsx";
import { PRICE_LABELS, type AudienceTag, type Business, type Category } from "@/lib/types";
import {
  discoverBusinesses,
  getAudienceTags,
  getCategories,
} from "@/lib/queries";

const PAGE_SIZE = 12;

function DiscoverInner() {
  const router = useRouter();
  const params = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<AudienceTag[]>([]);
  const [items, setItems] = useState<Business[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const search = params.get("search") ?? "";
  const category = params.get("category") ?? "";
  const price = params.get("price_tier") ?? "";
  const city = params.get("city") ?? "";
  const activeTags = (params.get("audience_tag") ?? "")
    .split(",")
    .filter(Boolean);
  const page = Number(params.get("page") ?? "1");

  const [searchDraft, setSearchDraft] = useState(search);
  const [cityDraft, setCityDraft] = useState(city);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
    getAudienceTags().then(setTags).catch(() => {});
  }, []);

  useEffect(() => {
    setSearchDraft(search);
    setCityDraft(city);
  }, [search, city]);

  const update = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      if (!("page" in patch)) next.delete("page");
      router.push(`/discover?${next.toString()}`);
    },
    [params, router],
  );

  useEffect(() => {
    setLoading(true);
    discoverBusinesses({
      search,
      category,
      price_tier: price,
      city,
      audience_tag: activeTags.join(","),
      page,
    })
      .then((res) => {
        setItems(res.results);
        setCount(res.count);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, price, city, params.get("audience_tag"), page]);

  const toggleTag = (slug: string) => {
    const next = activeTags.includes(slug)
      ? activeTags.filter((t) => t !== slug)
      : [...activeTags, slug];
    update({ audience_tag: next.join(",") || null });
  };

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const hasFilters =
    search || category || price || city || activeTags.length > 0;

  return (
    <div className="container-page py-10">
      <span className="eyebrow">Discover</span>
      <h1 className="mt-2 text-3xl">Browse independent businesses</h1>
      <p className="mt-2 max-w-xl text-ink-soft">
        Every business here is open to partnerships. Filter by industry,
        audience, or city — or{" "}
        <a href="/matches" className="font-medium text-forest-700 hover:underline">
          let Partnernet rank them for you
        </a>
        .
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* Filters */}
        <aside className="space-y-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              update({ search: searchDraft || null });
            }}
          >
            <label className="field-label">Search</label>
            <input
              className="field-input"
              placeholder="Name, keyword…"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
            />
          </form>

          <div>
            <label className="field-label">Category</label>
            <Select
              value={category}
              onChange={(e) => update({ category: e.target.value || null })}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="field-label">Price tier</label>
            <Select
              value={price}
              onChange={(e) => update({ price_tier: e.target.value || null })}
            >
              <option value="">Any</option>
              {Object.entries(PRICE_LABELS).map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              update({ city: cityDraft || null });
            }}
          >
            <label className="field-label">City</label>
            <input
              className="field-input"
              placeholder="e.g. Austin"
              value={cityDraft}
              onChange={(e) => setCityDraft(e.target.value)}
            />
          </form>

          <div>
            <label className="field-label">Audience</label>
            <div className="flex flex-wrap gap-1.5">
              {tags
                .filter((t) => t.facet === "interest" || t.facet === "lifestyle")
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toggleTag(t.slug)}
                    className={clsx(
                      "rounded-full border px-2.5 py-1 text-xs transition-colors",
                      activeTags.includes(t.slug)
                        ? "border-forest-600 bg-forest-600 text-white"
                        : "border-line bg-surface text-ink-soft hover:border-forest-400",
                    )}
                  >
                    {t.name}
                  </button>
                ))}
            </div>
          </div>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/discover")}
            >
              Clear filters
            </Button>
          )}
        </aside>

        {/* Results */}
        <div>
          <p className="mb-4 text-sm text-ink-faint">
            {loading ? "Loading…" : `${count} ${count === 1 ? "business" : "businesses"}`}
          </p>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-card bg-line/60"
                />
              ))}
            </div>
          ) : items.length ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((b) => (
                <BusinessCard key={b.id} business={b} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nothing matches those filters"
              description="Try removing a filter or widening your search."
            />
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => update({ page: String(page - 1) })}
              >
                Previous
              </Button>
              <span className="text-sm text-ink-faint">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => update({ page: String(page + 1) })}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense>
      <DiscoverInner />
    </Suspense>
  );
}
