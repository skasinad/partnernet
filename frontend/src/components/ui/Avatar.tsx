import { avatarColor, initials } from "@/lib/format";
import { clsx } from "@/lib/clsx";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
};

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const base = clsx(
    "flex shrink-0 items-center justify-center rounded-xl font-semibold uppercase",
    SIZES[size],
    className,
  );

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        className={clsx(base, "object-cover")}
      />
    );
  }

  return (
    <span className={clsx(base, avatarColor(name))} aria-hidden>
      {initials(name)}
    </span>
  );
}
