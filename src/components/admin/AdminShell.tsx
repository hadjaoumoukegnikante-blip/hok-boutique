"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Boxes,
  ChartBar,
  CreditCard,
  FileText,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Percent,
  Receipt,
  Scissors,
  ScrollText,
  Settings,
  Store,
  Truck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/format";
import { Toast } from "@/components/shop/Floating";
import { signOut } from "@/app/admin/actions/auth";

const groups = [
  {
    title: "Ventes",
    items: [
      { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/admin/commandes", label: "Commandes", icon: Receipt },
      { href: "/admin/paiements", label: "Paiements", icon: CreditCard },
      { href: "/admin/factures", label: "Factures", icon: FileText },
      { href: "/admin/livraisons", label: "Livraisons", icon: Truck },
      { href: "/admin/clients", label: "Clients", icon: Users },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/admin/produits", label: "Produits", icon: Package },
      { href: "/admin/categories", label: "Catégories", icon: Layers },
      { href: "/admin/promotions", label: "Promotions", icon: Percent },
    ],
  },
  {
    title: "Production",
    items: [
      { href: "/admin/stocks", label: "Stocks", icon: Boxes },
      { href: "/admin/matieres", label: "Matières premières", icon: Store },
      { href: "/admin/confection", label: "Confection", icon: Scissors },
    ],
  },
  {
    title: "Pilotage",
    items: [
      { href: "/admin/statistiques", label: "Statistiques", icon: ChartBar },
      { href: "/admin/historique", label: "Historique", icon: ScrollText },
      { href: "/admin/equipe", label: "Équipe", icon: UserCog },
      { href: "/admin/parametres", label: "Paramètres", icon: Settings },
    ],
  },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <nav aria-label="Administration" className="space-y-6">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{g.title}</p>
          <ul className="space-y-0.5">
            {g.items.map(({ href, label, icon: Icon }) => {
              const on = active(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={on ? "page" : undefined}
                    className={cn("relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors", on ? "text-brun" : "text-soft hover:bg-brun/[0.05]")}
                  >
                    {on && <motion.span layoutId="admin-nav" className="absolute inset-0 rounded-xl bg-white shadow-[0_1px_3px_rgb(72_40_10/0.12)]" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                    <Icon className="relative size-[18px]" strokeWidth={1.6} />
                    <span className="relative">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

const roleLabel: Record<string, string> = { admin: "Gérante", superviseur: "Superviseure", atelier: "Atelier", livreur: "Livreur" };

export function AdminShell({ children, me }: { children: React.ReactNode; me?: { name: string; role: string } }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-screen bg-creme lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-brun/[0.08] bg-ecru/70 px-3 py-5 lg:flex">
        <Link href="/admin" className="px-3">
          <Image src="/logo-hok.png" alt="H.O.K Boutique" width={1067} height={409} className="h-10 w-auto" />
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Administration</p>
        </Link>
        <div className="no-scrollbar mt-6 flex-1 overflow-y-auto">
          <Nav />
        </div>
        <div className="mt-4 space-y-0.5 border-t border-brun/10 pt-3">
          <Link href="/" className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-soft hover:bg-brun/[0.05]">
            <Store className="size-[18px]" strokeWidth={1.6} /> Voir la boutique
          </Link>
          {me && (
            <div className="px-3 py-2">
              <p className="truncate text-sm font-semibold">{me.name}</p>
              <p className="text-xs text-muted">{roleLabel[me.role] ?? me.role}</p>
            </div>
          )}
          <form action={signOut}>
            <button type="submit" className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-soft hover:bg-brun/[0.05]">
              <LogOut className="size-[18px]" strokeWidth={1.6} /> Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* Barre mobile */}
      <div className="glass sticky top-0 z-40 flex h-14 items-center justify-between border-b border-brun/10 px-3 lg:hidden">
        <button aria-label="Ouvrir le menu" onClick={() => setOpen(true)} className="press grid size-11 place-items-center rounded-full">
          <Menu className="size-5" strokeWidth={1.6} />
        </button>
        <Image src="/logo-hok.png" alt="H.O.K Boutique" width={1067} height={409} className="h-8 w-auto" />
        <span className="w-11" />
      </div>
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-encre/25 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-ecru px-3 py-4 lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 40 }}
            >
              <div className="mb-5 flex items-center justify-between px-2">
                <Image src="/logo-hok.png" alt="H.O.K Boutique" width={1067} height={409} className="h-9 w-auto" />
                <button aria-label="Fermer le menu" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-full">
                  <X className="size-5" />
                </button>
              </div>
              <Nav onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      <Toast />
    </div>
  );
}
