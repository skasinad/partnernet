export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const secs = Math.round((Date.now() - then) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function scoreLabel(score: number): string {
  if (score >= 75) return "Strong match";
  if (score >= 55) return "Good match";
  if (score >= 35) return "Some overlap";
  return "Light overlap";
}

const PALETTE = [
  "bg-forest-100 text-forest-700",
  "bg-clay-100 text-clay-600",
  "bg-[#E7EDF4] text-[#345178]",
  "bg-[#F1E9F3] text-[#6E4B7A]",
  "bg-[#EDEAE1] text-ink-soft",
];

export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
