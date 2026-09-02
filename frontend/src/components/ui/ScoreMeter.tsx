import { clsx } from "@/lib/clsx";
import { scoreLabel } from "@/lib/format";

export function ScoreDial({ score, size = 56 }: { score: number; size?: number }) {
  const r = size / 2 - 4;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const tone =
    score >= 75 ? "#1F5C43" : score >= 55 ? "#4F8C6C" : score >= 35 ? "#D08C63" : "#B7B2A6";

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Match score ${score} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E7E3DA" strokeWidth={4} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-ink">
        {score}
      </span>
    </div>
  );
}

export function ScoreBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12px] text-ink-soft">
        <span>{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-forest-400"
          style={{ width: `${Math.max(2, value)}%` }}
        />
      </div>
    </div>
  );
}

export function ScoreTag({ score }: { score: number }) {
  const tone =
    score >= 55
      ? "pill-accent"
      : score >= 35
        ? "border-clay-400/40 bg-clay-100 text-clay-600"
        : "";
  return <span className={clsx("pill", tone)}>{scoreLabel(score)}</span>;
}
