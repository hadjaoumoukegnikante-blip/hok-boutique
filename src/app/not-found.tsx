import Image from "next/image";
import Link from "next/link";
import { buttonClass } from "@/lib/styles";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Image src="/logo-hok.png" alt="H.O.K Boutique" width={1067} height={409} className="h-14 w-auto" />
      <h1 className="title-serif mt-10 text-[48px]">Page introuvable</h1>
      <p className="mt-2 text-muted">Cette page n'existe pas ou a été déplacée.</p>
      <Link href="/" className={buttonClass("primary", "lg", "mt-8")}>Retour à l'accueil</Link>
    </main>
  );
}
