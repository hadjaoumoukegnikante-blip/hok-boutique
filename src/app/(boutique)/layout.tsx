import { CartDrawer } from "@/components/shop/CartDrawer";
import { Toast, WhatsAppFab } from "@/components/shop/Floating";
import { Footer } from "@/components/shop/Footer";
import { Header } from "@/components/shop/Header";
import { SearchOverlay } from "@/components/shop/SearchOverlay";

export default function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-brun focus:px-4 focus:py-2 focus:text-white">
        Aller au contenu
      </a>
      <Header />
      <main id="contenu">{children}</main>
      <Footer />
      <WhatsAppFab />
      <CartDrawer />
      <SearchOverlay />
      <Toast />
    </>
  );
}
