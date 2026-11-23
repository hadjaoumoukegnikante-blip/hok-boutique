"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IconButton, useMounted } from "@/components/ui";
import { cn } from "@/lib/format";
import { useCart, useUi } from "@/store/cart";

export const navItems = [
  { href: "/", label: "Accueil" },
  { href: "/vetements", label: "Vêtements" },
  { href: "/bijoux", label: "Bijoux" },
  { href: "/maison", label: "Home" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const mounted = useMounted();
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));
  const { openCart, openSearch } = useUi();
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={cn(
        "glass sticky top-0 z-40 border-b transition-colors duration-300",
        scrolled ? "border-brun/10" : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-3 md:h-[68px] md:px-6">
        <div className="flex items-center gap-1">
          <IconButton label="Ouvrir le menu" className="md:hidden" onClick={() => setMenu(true)}>
            <Menu className="size-5" strokeWidth={1.6} />
          </IconButton>
          <Link href="/" aria-label="H.O.K Boutique, accueil" className="flex items-center">
            <Image src="/logo-hok.png" alt="H.O.K Boutique" width={1067} height={409} priority className="h-10 w-auto md:h-11" />
          </Link>
        </div>

        <nav aria-label="Menu principal" className="hidden items-center gap-7 text-sm font-medium md:flex">
          {navItems.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isActive(n.href) ? "page" : undefined}
              className={cn("relative py-2 transition-colors", isActive(n.href) ? "text-brun" : "text-soft hover:text-brun")}
            >
              {n.label}
              {isActive(n.href) && (
                <motion.span layoutId="nav-dot" className="absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brun" />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center">
          <IconButton label="Rechercher" onClick={openSearch}>
            <Search className="size-5" strokeWidth={1.6} />
          </IconButton>
          <Link href="/compte" aria-label="Mon compte" className="press hidden size-11 place-items-center rounded-full hover:bg-brun/[0.06] sm:grid">
            <User className="size-5" strokeWidth={1.6} />
          </Link>
          <IconButton label={`Panier, ${mounted ? count : 0} article(s)`} onClick={openCart}>
            <ShoppingBag className="size-5" strokeWidth={1.6} />
            <AnimatePresence>
              {mounted && count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 600, damping: 22 }}
                  className="absolute right-0.5 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brun px-1 text-[11px] font-semibold text-white"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </IconButton>
        </div>
      </div>

      {/* Menu mobile */}
      <AnimatePresence>
        {menu && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-encre/25 backdrop-blur-[2px] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenu(false)}
            />
            <motion.nav
              aria-label="Menu mobile"
              className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col bg-white px-5 pb-8 pt-4 md:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 40 }}
            >
              <div className="flex items-center justify-between">
                <Image src="/logo-hok.png" alt="H.O.K Boutique" width={1067} height={409} className="h-10 w-auto" />
                <IconButton label="Fermer le menu" onClick={() => setMenu(false)}>
                  <X className="size-5" strokeWidth={1.6} />
                </IconButton>
              </div>
              <ul className="mt-8 space-y-1">
                {navItems.map((n, i) => (
                  <motion.li
                    key={n.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.04 }}
                  >
                    <Link
                      href={n.href}
                      className={cn(
                        "block rounded-2xl px-4 py-3 font-serif text-[28px] leading-tight",
                        isActive(n.href) ? "bg-ecru text-brun" : "text-encre",
                      )}
                    >
                      {n.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-auto space-y-2 text-[15px]">
                <Link href="/suivi" className="block rounded-2xl bg-sable px-4 py-3 font-medium">Suivre ma commande</Link>
                <Link href="/compte" className="block rounded-2xl bg-sable px-4 py-3 font-medium">Mon compte</Link>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
