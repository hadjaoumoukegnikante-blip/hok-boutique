"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/format";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="title-serif text-[36px] leading-none md:text-[44px]">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = "default" }: { label: string; value: string; hint?: string; tone?: "default" | "brun" | "alert" }) {
  return (
    <div
      className={cn(
        "rounded-3xl p-5",
        tone === "brun" ? "bg-brun text-white" : tone === "alert" ? "bg-bordeaux/[0.06]" : "bg-white shadow-[0_1px_2px_rgb(72_40_10/0.06)]",
      )}
    >
      <p className={cn("text-[13px]", tone === "brun" ? "text-white/80" : "text-muted")}>{label}</p>
      <p className={cn("mt-1.5 text-[26px] font-semibold tabular-nums tracking-tight", tone === "alert" && "text-bordeaux")}>{value}</p>
      {hint && <p className={cn("mt-1 text-xs", tone === "brun" ? "text-white/70" : "text-muted")}>{hint}</p>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgb(72_40_10/0.06)]", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-[15px] font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Table({ head, children, className }: { head: React.ReactNode[]; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-3xl bg-white shadow-[0_1px_2px_rgb(72_40_10/0.06)]", className)}>
      <table className="w-full min-w-[680px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-brun/10 text-left text-[11px] uppercase tracking-[0.12em] text-muted">
            {head.map((h, i) => (
              <th key={i} className="whitespace-nowrap px-4 py-3 font-semibold first:pl-5 last:pr-5">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brun/[0.07]">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className, colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return <td colSpan={colSpan} className={cn("whitespace-nowrap px-4 py-3.5 first:pl-5 last:pr-5", className)}>{children}</td>;
}

export function SearchInput({ value, onChange, placeholder = "Rechercher" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex h-11 items-center gap-2 rounded-full bg-white px-4 shadow-[0_1px_2px_rgb(72_40_10/0.06)]">
      <Search className="size-4 text-muted" strokeWidth={1.8} aria-hidden />
      <label className="sr-only">{placeholder}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-48 bg-transparent text-sm focus:outline-none md:w-64" />
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-7 w-12 shrink-0 overflow-hidden rounded-full transition-colors duration-300", checked ? "bg-brun" : "bg-beige-clair")}
    >
      <span className={cn("absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)]", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
    </button>
  );
}

export function Bars({ data }: { data: { label: string; value: number; display: string }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label}>
          <div className="mb-1 flex justify-between text-[13px]">
            <span className="text-soft">{d.label}</span>
            <span className="font-medium tabular-nums">{d.display}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-sable">
            <div className="h-full rounded-full bg-brun transition-[width] duration-700" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
