"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Botões                                                              */
/* ------------------------------------------------------------------ */

type Variant = "primary" | "outline" | "ghost" | "dark" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent border border-transparent hover:opacity-90",
  outline:
    "bg-transparent text-ink border border-[rgba(42,39,36,0.25)] hover:bg-[rgba(42,39,36,0.04)]",
  ghost: "bg-transparent text-ink-soft border border-transparent hover:bg-[rgba(42,39,36,0.06)]",
  dark: "bg-ink text-paper border border-transparent hover:opacity-90",
  danger:
    "bg-transparent text-danger border border-[rgba(168,68,58,0.4)] hover:bg-[rgba(168,68,58,0.07)]",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-[13px] rounded-lg",
  md: "px-5 py-3 text-[14.5px] rounded-[10px]",
  lg: "px-8 py-4 text-[16px] rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  full,
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; full?: boolean }) {
  return (
    <button
      {...props}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${
        variants[variant]
      } ${sizes[size]} ${full ? "w-full" : ""} ${className}`}
    />
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  full,
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; full?: boolean }) {
  return (
    <Link
      {...props}
      className={`inline-flex items-center justify-center gap-2 font-semibold no-underline transition ${
        variants[variant]
      } ${sizes[size]} ${full ? "w-full" : ""} ${className}`}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Superfícies                                                         */
/* ------------------------------------------------------------------ */

export function Card({
  className = "",
  children,
  padded = true,
}: {
  className?: string;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-paper ${padded ? "p-6" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function Pill({
  active,
  className = "",
  ...props
}: ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      {...props}
      className={`cursor-pointer whitespace-nowrap rounded-full border px-5 py-2.5 text-[14px] font-semibold transition ${
        active
          ? "border-accent bg-accent text-on-accent"
          : "border-line-strong bg-paper text-ink hover:bg-paper-2"
      } ${className}`}
    />
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "ok" | "warn" | "danger" | "accent";
  children: ReactNode;
}) {
  const tones = {
    neutral: "bg-[rgba(42,39,36,0.07)] text-ink-soft",
    ok: "bg-[rgba(74,124,89,0.14)] text-ok",
    warn: "bg-[rgba(181,138,43,0.16)] text-warn",
    danger: "bg-[rgba(168,68,58,0.13)] text-danger",
    accent: "bg-accent text-on-accent",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Tipografia de seção                                                 */
/* ------------------------------------------------------------------ */

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  center,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  className?: string;
}) {
  return (
    <div className={`${center ? "text-center" : ""} ${className}`}>
      {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}
      <h2 className="font-display text-[clamp(26px,4vw,38px)] font-semibold leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">{subtitle}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Formulário                                                          */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] tracking-wide text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[12.5px] text-ink-faint">{hint}</span>}
    </label>
  );
}

const controlBase =
  "w-full rounded-[10px] border border-[rgba(42,39,36,0.2)] bg-white px-4 py-3.5 text-[15px] text-ink outline-none transition placeholder:text-ink-faint focus:border-accent";

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input {...props} className={`${controlBase} ${className}`} />;
}

export function Textarea({ className = "", ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={`${controlBase} resize-y ${className}`} />;
}

export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select {...props} className={`${controlBase} cursor-pointer ${className}`} />;
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 10,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        aria-label="Diminuir"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="h-10 w-10 cursor-pointer rounded-full border border-[rgba(42,39,36,0.2)] bg-white text-lg leading-none"
      >
        −
      </button>
      <span className="min-w-6 text-center text-[18px] font-semibold">{value}</span>
      <button
        type="button"
        aria-label="Aumentar"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="h-10 w-10 cursor-pointer rounded-full border border-[rgba(42,39,36,0.2)] bg-white text-lg leading-none"
      >
        +
      </button>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition ${
        checked ? "bg-accent" : "bg-[rgba(42,39,36,0.2)]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Feedback                                                            */
/* ------------------------------------------------------------------ */

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(42,39,36,0.1)]">
      <div
        className="h-full rounded-full bg-accent transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <div className="text-[12.5px] uppercase tracking-wider text-ink-faint">{label}</div>
      <div className="mt-2 font-display text-[32px] font-semibold leading-none">{value}</div>
      {hint && <div className="mt-2 text-[13px] text-ink-soft">{hint}</div>}
    </div>
  );
}

export function EmptyState({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line-strong px-6 py-14 text-center">
      <div className="font-display text-[19px] font-semibold">{title}</div>
      {desc && <p className="mt-2 text-[14.5px] text-ink-soft">{desc}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal / bottom-sheet                                                */
/* ------------------------------------------------------------------ */

export function Sheet({
  open,
  onClose,
  children,
  maxWidth = 460,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[900] flex items-end justify-center bg-[rgba(20,18,15,0.5)] sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth, animation: "sheet-up 0.35s ease both" }}
        className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-paper px-7 pb-10 pt-8 sm:rounded-3xl"
      >
        {children}
      </div>
    </div>
  );
}
