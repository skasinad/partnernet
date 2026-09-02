import { clsx } from "@/lib/clsx";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="field-label">{label}</span>
      {children}
      {hint && !error && (
        <p className="mt-1 text-xs text-ink-faint">{hint}</p>
      )}
      {error && <p className="mt-1 text-xs text-clay-600">{error}</p>}
    </div>
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx("field-input appearance-none bg-surface pr-8", className)}
      {...props}
    />
  );
}

export function TagPicker({
  options,
  selected,
  onToggle,
  max,
}: {
  options: { id: number; name: string; group?: string }[];
  selected: number[];
  onToggle: (id: number) => void;
  max?: number;
}) {
  const groups = options.reduce<Record<string, typeof options>>((acc, opt) => {
    const key = opt.group || "";
    (acc[key] ||= []).push(opt);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {Object.entries(groups).map(([group, opts]) => (
        <div key={group}>
          {group && (
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              {group}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {opts.map((opt) => {
              const active = selected.includes(opt.id);
              const disabled =
                !active && max !== undefined && selected.length >= max;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onToggle(opt.id)}
                  className={clsx(
                    "rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                    active
                      ? "border-forest-600 bg-forest-600 text-white"
                      : "border-line bg-surface text-ink-soft hover:border-forest-400",
                    disabled && "cursor-not-allowed opacity-40",
                  )}
                >
                  {opt.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
