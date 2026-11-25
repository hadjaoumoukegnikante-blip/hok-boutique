"use client";

import { Button } from "@/components/ui";

/** Erreur d'une action de l'admin (refus de la base, réseau…) : message lisible et retour. */
export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-3xl bg-white p-8 text-center shadow-[0_1px_2px_rgb(72_40_10/0.06)]">
      <p className="title-serif text-3xl">Action impossible</p>
      <p className="mt-3 text-sm text-soft">{error.message || "Une erreur est survenue."}</p>
      <Button className="mt-6" onClick={reset}>Revenir</Button>
    </div>
  );
}
