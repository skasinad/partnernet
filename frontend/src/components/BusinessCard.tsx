import Link from "next/link";

import { Avatar } from "@/components/ui/Avatar";
import { PRICE_LABELS, type Business } from "@/lib/types";

export function BusinessCard({
  business,
  footer,
}: {
  business: Business;
  footer?: React.ReactNode;
}) {
  return (
    <div className="card flex h-full flex-col p-5 transition-shadow hover:shadow-lift">
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
      </div>

      {business.tagline && (
        <p className="mt-3 line-clamp-2 text-sm text-ink-soft">
          {business.tagline}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="pill pill-accent">{PRICE_LABELS[business.price_tier]}</span>
        {business.audience_tags.slice(0, 3).map((tag) => (
          <span key={tag.id} className="pill">
            {tag.name}
          </span>
        ))}
        {business.audience_tags.length > 3 && (
          <span className="pill">+{business.audience_tags.length - 3}</span>
        )}
      </div>

      {footer && <div className="mt-4 border-t border-line pt-4">{footer}</div>}
    </div>
  );
}
