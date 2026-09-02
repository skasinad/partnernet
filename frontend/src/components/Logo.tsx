import Link from "next/link";
import { clsx } from "@/lib/clsx";

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={clsx("group inline-flex items-center gap-2", className)}
    >
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-forest-700 text-white">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="7" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17" cy="16" r="3" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M9.5 9.7 14.5 14.3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="font-serif text-lg font-semibold tracking-tight text-ink">
        Partnernet
      </span>
    </Link>
  );
}
