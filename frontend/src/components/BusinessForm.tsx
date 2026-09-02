"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field, Select, TagPicker } from "@/components/ui/Field";
import { getAudienceTags, getCategories } from "@/lib/queries";
import {
  PRICE_LABELS,
  SIZE_LABELS,
  type AudienceTag,
  type Business,
  type Category,
} from "@/lib/types";

export interface BusinessFormValues {
  name: string;
  tagline: string;
  description: string;
  category_id: number | "";
  audience_tag_ids: number[];
  price_tier: string;
  size: string;
  city: string;
  region: string;
  country: string;
  latitude: string;
  longitude: string;
  website: string;
  instagram: string;
  contact_email: string;
  open_to_partnerships: boolean;
  partnership_pitch: string;
}

const FACET_ORDER: AudienceTag["facet"][] = [
  "age",
  "interest",
  "price",
  "lifestyle",
];

function toValues(b?: Business): BusinessFormValues {
  return {
    name: b?.name ?? "",
    tagline: b?.tagline ?? "",
    description: b?.description ?? "",
    category_id: b?.category.id ?? "",
    audience_tag_ids: b?.audience_tags.map((t) => t.id) ?? [],
    price_tier: b?.price_tier ?? "mid",
    size: b?.size ?? "micro",
    city: b?.city ?? "",
    region: b?.region ?? "",
    country: b?.country ?? "United States",
    latitude: b?.latitude != null ? String(b.latitude) : "",
    longitude: b?.longitude != null ? String(b.longitude) : "",
    website: b?.website ?? "",
    instagram: b?.instagram ?? "",
    contact_email: b?.contact_email ?? "",
    open_to_partnerships: b?.open_to_partnerships ?? true,
    partnership_pitch: b?.partnership_pitch ?? "",
  };
}

export function BusinessForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Business;
  submitLabel: string;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [values, setValues] = useState<BusinessFormValues>(toValues(initial));
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<AudienceTag[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
    getAudienceTags().then(setTags).catch(() => {});
  }, []);

  const tagOptions = useMemo(
    () =>
      [...tags]
        .sort(
          (a, b) =>
            FACET_ORDER.indexOf(a.facet) - FACET_ORDER.indexOf(b.facet) ||
            a.name.localeCompare(b.name),
        )
        .map((t) => ({ id: t.id, name: t.name, group: t.facet_label })),
    [tags],
  );

  function set<K extends keyof BusinessFormValues>(
    key: K,
    val: BusinessFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!values.category_id) {
      setError("Pick a category.");
      return;
    }
    if (values.audience_tag_ids.length < 2) {
      setError("Choose at least two audience tags so we can match you well.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        tagline: values.tagline.trim(),
        description: values.description.trim(),
        category_id: values.category_id,
        audience_tag_ids: values.audience_tag_ids,
        price_tier: values.price_tier,
        size: values.size,
        city: values.city.trim(),
        region: values.region.trim(),
        country: values.country.trim(),
        latitude: values.latitude ? Number(values.latitude) : null,
        longitude: values.longitude ? Number(values.longitude) : null,
        website: values.website.trim(),
        instagram: values.instagram.trim().replace(/^@/, ""),
        contact_email: values.contact_email.trim(),
        open_to_partnerships: values.open_to_partnerships,
        partnership_pitch: values.partnership_pitch.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t save. Try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="card p-6">
        <h2 className="text-lg">The basics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Business name" className="sm:col-span-2">
            <input
              required
              className="field-input"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <Field
            label="Tagline"
            hint="One line customers would recognise you by."
            className="sm:col-span-2"
          >
            <input
              maxLength={160}
              className="field-input"
              value={values.tagline}
              onChange={(e) => set("tagline", e.target.value)}
            />
          </Field>
          <Field label="Category">
            <Select
              value={values.category_id}
              onChange={(e) =>
                set(
                  "category_id",
                  e.target.value ? Number(e.target.value) : "",
                )
              }
            >
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Team size">
            <Select
              value={values.size}
              onChange={(e) => set("size", e.target.value)}
            >
              {Object.entries(SIZE_LABELS).map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="About"
            hint="A short paragraph for your public profile."
            className="sm:col-span-2"
          >
            <textarea
              rows={4}
              className="field-input"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg">Your customer</h2>
        <p className="mt-1 text-sm text-ink-soft">
          This is what drives your matches. Pick the traits that describe your
          typical customer — 4 to 8 is a good range.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Price tier">
            <Select
              value={values.price_tier}
              onChange={(e) => set("price_tier", e.target.value)}
            >
              {Object.entries(PRICE_LABELS).map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-4">
          <span className="field-label">
            Audience tags ({values.audience_tag_ids.length}/12)
          </span>
          <TagPicker
            options={tagOptions}
            selected={values.audience_tag_ids}
            max={12}
            onToggle={(id) =>
              set(
                "audience_tag_ids",
                values.audience_tag_ids.includes(id)
                  ? values.audience_tag_ids.filter((x) => x !== id)
                  : [...values.audience_tag_ids, id],
              )
            }
          />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg">Location</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="City">
            <input
              required
              className="field-input"
              value={values.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </Field>
          <Field label="State / region">
            <input
              className="field-input"
              value={values.region}
              onChange={(e) => set("region", e.target.value)}
            />
          </Field>
          <Field label="Country">
            <input
              className="field-input"
              value={values.country}
              onChange={(e) => set("country", e.target.value)}
            />
          </Field>
          <Field
            label="Latitude"
            hint="Optional — sharpens proximity scoring."
          >
            <input
              inputMode="decimal"
              className="field-input"
              value={values.latitude}
              onChange={(e) => set("latitude", e.target.value)}
            />
          </Field>
          <Field label="Longitude" hint="Optional.">
            <input
              inputMode="decimal"
              className="field-input"
              value={values.longitude}
              onChange={(e) => set("longitude", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg">Partnerships & contact</h2>
        <div className="mt-4 space-y-4">
          <label className="flex items-start gap-3 rounded-lg border border-line p-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-forest-600"
              checked={values.open_to_partnerships}
              onChange={(e) => set("open_to_partnerships", e.target.checked)}
            />
            <span className="text-sm">
              <span className="font-medium">Open to partnerships</span>
              <span className="block text-ink-faint">
                Show up in matches and let others send you requests.
              </span>
            </span>
          </label>
          <Field
            label="What are you looking for?"
            hint="The pitch other owners see on your profile."
          >
            <textarea
              rows={3}
              className="field-input"
              value={values.partnership_pitch}
              onChange={(e) => set("partnership_pitch", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Website">
              <input
                className="field-input"
                placeholder="https://"
                value={values.website}
                onChange={(e) => set("website", e.target.value)}
              />
            </Field>
            <Field label="Instagram">
              <input
                className="field-input"
                placeholder="handle"
                value={values.instagram}
                onChange={(e) => set("instagram", e.target.value)}
              />
            </Field>
            <Field label="Contact email">
              <input
                type="email"
                className="field-input"
                value={values.contact_email}
                onChange={(e) => set("contact_email", e.target.value)}
              />
            </Field>
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-lg bg-clay-100 px-3 py-2 text-sm text-clay-600">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
