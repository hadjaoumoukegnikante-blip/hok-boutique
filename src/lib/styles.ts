import { cn } from "./format";

export type Variant = "primary" | "soft" | "outline" | "bordeaux" | "ghost" | "glass";
export type Size = "sm" | "md" | "lg";

const variantClass: Record<Variant, string> = {
  primary: "bg-brun text-white hover:bg-brun-hover shadow-[0_12px_24px_-12px_rgb(104_60_17/0.7)]",
  soft: "bg-brun/[0.07] text-brun hover:bg-brun/[0.12]",
  outline: "border border-brun/25 bg-white text-encre hover:border-brun/50",
  bordeaux: "bg-bordeaux text-white hover:opacity-90",
  ghost: "text-encre hover:bg-brun/[0.06]",
  glass: "glass-strong text-encre hover:bg-white/70",
};
const sizeClass: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-[15px]",
  lg: "h-[54px] px-7 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(
    "press inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap disabled:opacity-50 disabled:shadow-none",
    variantClass[variant],
    sizeClass[size],
    extra,
  );
}

