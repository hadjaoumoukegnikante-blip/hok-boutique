"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/format";
import { useWhatsapp } from "./ShopData";
import { useUi } from "@/store/cart";

export function WhatsAppFab() {
  const whatsappLink = useWhatsapp();
  const pathname = usePathname();
  // Sur mobile, la fiche produit et la commande ont déjà leur propre accès WhatsApp
  const hideOnMobile = pathname.startsWith("/produit/") || pathname.startsWith("/commande");
  return (
    <a
      href={whatsappLink({ intro: "Bonjour H.O.K Boutique, j'ai une question." })}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "press glass-brun fixed bottom-5 right-5 z-30 h-[52px] items-center gap-2.5 rounded-full pl-4 pr-5 text-[15px] font-medium text-white shadow-[0_16px_32px_-12px_rgb(72_40_10/0.5)] hover:scale-[1.03]",
        hideOnMobile ? "hidden md:inline-flex" : "inline-flex",
      )}
    >
      <MessageCircle className="size-5" strokeWidth={1.7} aria-hidden />
      <span className="hidden sm:inline">Une question ?</span>
      <span className="sr-only sm:hidden">Écrire sur WhatsApp</span>
    </a>
  );
}

export function Toast() {
  const { toast, dismiss } = useUi();
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismiss, 2800);
    return () => clearTimeout(t);
  }, [toast, dismiss]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[70] flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            role="status"
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className="glass-strong pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-[22px] bg-white/80 px-4 py-3.5 shadow-[0_20px_40px_-16px_rgb(72_40_10/0.35)]"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brun text-white">
              <Check className="size-4" strokeWidth={2.4} />
            </span>
            <span className="min-w-0 text-sm">
              <b className="block font-semibold">{toast.title}</b>
              {toast.body && <span className="block truncate text-muted">{toast.body}</span>}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
