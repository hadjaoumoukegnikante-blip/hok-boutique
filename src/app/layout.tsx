import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "H.O.K Boutique · Fashion, Home, Jewelry",
    template: "%s · H.O.K Boutique",
  },
  description:
    "Vêtements confectionnés sur commande, bijoux et bougies. Boutique en ligne à Conakry, Guinée.",
  icons: { icon: "/logo-hok.png" },
};

export const viewport: Viewport = {
  themeColor: "#683C11",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
