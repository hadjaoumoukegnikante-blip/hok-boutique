"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { cn, toneClass, type Tone } from "@/lib/format";
import type { UniversKey } from "@/lib/types";

/* ---------- Hydratation (stores persistés) ---------- */
export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

/* ---------- Boutons ---------- */
import { buttonClass, type Size, type Variant } from "@/lib/styles";
export { buttonClass };

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: { href: string; variant?: Variant; size?: Size; className?: string; children: React.ReactNode } & Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
>) {
  const external = href.startsWith("http");
  if (external)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClass(variant, size, className)} {...rest}>
        {children}
      </a>
    );
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

export function IconButton({
  label,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      className={cn("press relative grid size-11 place-items-center rounded-full text-encre hover:bg-brun/[0.06]", className)}
      {...props}
    >
      {children}
    </button>
  );
}

/* ---------- Badges ---------- */
export function Badge({ tone = "neutre", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", toneClass[tone], className)}>
      {children}
    </span>
  );
}

/* ---------- Visuel produit (remplacé par les photos réelles) ---------- */
const tones: Record<UniversKey, string> = {
  studio: "bg-beige",
  bijoux: "bg-beige-clair",
  maison: "bg-sable",
};

export function ProductVisual({
  univers,
  src,
  alt,
  label = "Photo produit",
  className,
  children,
}: {
  univers: UniversKey;
  src?: string;
  alt: string;
  label?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative overflow-hidden", tones[univers], className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="absolute inset-0 size-full object-cover" />
      ) : (
        <>
          <div aria-hidden className="absolute -right-10 -top-10 size-56 rounded-full bg-brun/30 blur-3xl" />
          <div aria-hidden className="absolute -bottom-16 left-6 size-48 rounded-full bg-white/60 blur-3xl" />
          <span className="absolute inset-0 grid place-items-center text-[11px] font-medium uppercase tracking-[0.14em] text-soft/80">
            {label}
          </span>
        </>
      )}
      {children}
    </div>
  );
}

/* ---------- Quantité ---------- */
export function QtyStepper({
  value,
  onChange,
  min = 1,
  max,
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
}) {
  const s = size === "sm" ? "size-9" : "size-11";
  return (
    <div className="inline-flex items-center rounded-full bg-sable" role="group" aria-label="Quantité">
      <button
        type="button"
        aria-label="Retirer un"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className={cn("press grid place-items-center rounded-full text-lg text-brun disabled:opacity-30", s)}
      >
        −
      </button>
      <span className="min-w-6 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="Ajouter un"
        disabled={max !== undefined && value >= max}
        onClick={() => onChange(value + 1)}
        className={cn("press grid place-items-center rounded-full text-lg text-brun disabled:opacity-30", s)}
      >
        +
      </button>
    </div>
  );
}

/* ---------- Contrôle segmenté (pastille glissante) ---------- */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: T; label: string; disabled?: boolean }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex gap-1 rounded-2xl bg-sable p-1", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative h-11 flex-1 rounded-xl px-3 text-sm font-medium transition-colors disabled:opacity-40",
              on ? "text-encre" : "text-soft hover:text-encre",
            )}
          >
            {on && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-xl bg-white shadow-[0_2px_8px_rgb(72_40_10/0.12)]"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Pastilles de choix ---------- */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; disabled?: boolean }[];
  value: T | undefined;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "press h-11 min-w-12 rounded-[14px] border px-4 text-[15px] font-medium disabled:opacity-35 disabled:line-through",
              on
                ? "border-brun bg-brun text-white shadow-[0_8px_16px_-8px_rgb(104_60_17/0.6)]"
                : "border-brun/20 bg-white text-encre hover:border-brun/50",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Apparition au défilement ---------- */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  const reduce = useReducedMotion();
  const M = motion[as];
  return (
    <M
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1], delay }}
    >
      {children}
    </M>
  );
}

/* ---------- Champ de formulaire ---------- */
export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-soft">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Container({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1240px] px-5 md:px-6", className)}>{children}</div>;
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgb(72_40_10/0.06)] md:p-6", className)}>{children}</div>;
}
