"use client";

import { motion } from "framer-motion";
import { Check, Copy, Info, MessageCircle, Upload } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { Button, ButtonLink, Card, Container, Field, useMounted } from "@/components/ui";
import { reservationHours, shop } from "@/lib/config";
import { gnf } from "@/lib/format";
import { useOrder } from "@/lib/useOrder";
import { whatsappLink } from "@/lib/whatsapp";
import { useLocalOrders } from "@/store/cart";

export default function ConfirmationPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = use(params);
  const mounted = useMounted();
  const order = useOrder(ref);
  const attachProof = useLocalOrders((s) => s.attachProof);
  const [payer, setPayer] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState("");

  if (!mounted) return <Container className="min-h-[60vh]" />;
  if (!order)
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="title-serif text-[40px]">Commande introuvable</h1>
        <ButtonLink href="/suivi" className="mt-6">Suivre une commande</ButtonLink>
      </Container>
    );

  const needsPayment = order.depositDue > 0 && order.paymentStatus === "en_attente";
  const waMeasures = order.lines.filter((l) => l.measurementsByWhatsapp);
  const proofSent = sent || order.paymentStatus === "preuve_recue" || order.paymentStatus === "a_verifier";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(order.ref);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const submitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (payer.replace(/\D/g, "").length < 9) return setErr("Indiquez le numéro Orange Money utilisé.");
    setErr("");
    // Backend : envoi de la preuve (fichier) et création du paiement "preuve reçue"
    attachProof(order.ref, payer);
    setSent(true);
  };

  return (
    <Container className="max-w-2xl pt-12 md:pt-16">
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18 }} className="mx-auto grid size-16 place-items-center rounded-full bg-brun text-white">
        <Check className="size-8" strokeWidth={2.2} />
      </motion.div>
      <h1 className="title-serif mt-6 text-center text-[40px] leading-tight md:text-[48px]">Merci, votre commande est enregistrée.</h1>
      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="rounded-full bg-sable px-4 py-2 font-semibold tracking-wide">{order.ref}</span>
        <button onClick={copy} aria-label="Copier la référence" className="press grid size-10 place-items-center rounded-full hover:bg-brun/[0.06]">
          {copied ? <Check className="size-4 text-ok" /> : <Copy className="size-4 text-brun" strokeWidth={1.8} />}
        </button>
      </div>
      <p className="mt-3 text-center text-sm text-muted">Conservez cette référence pour suivre votre commande.</p>

      {waMeasures.length > 0 && (
        <Card className="mt-8 border border-brun/15">
          <p className="font-semibold">Envoyez vos mesures</p>
          <p className="mt-1 text-sm text-muted">
            La confection de {waMeasures.map((l) => l.name).join(", ")} démarre à réception de vos mesures : tour de poitrine, tour de taille, tour de hanches et longueur souhaitée (en cm).
          </p>
          <ButtonLink
            href={whatsappLink({
              intro: "Bonjour H.O.K Boutique, voici mes mesures.",
              orderRef: order.ref,
              extra: [...waMeasures.map((l) => `${l.name} (${l.variantLabel})`), "Tour de poitrine : ", "Tour de taille : ", "Tour de hanches : ", "Longueur souhaitée : "],
            })}
            size="lg"
            className="mt-4 w-full"
          >
            <MessageCircle className="size-[18px]" strokeWidth={1.7} /> Envoyer mes mesures
          </ButtonLink>
        </Card>
      )}

      {needsPayment && !proofSent && (
        <Card className="mt-10">
          <p className="eyebrow">Paiement Orange Money</p>
          <p className="mt-2 text-[28px] font-semibold tabular-nums">{gnf(order.depositDue)}</p>
          <p className="text-sm text-muted">
            {order.lines.some((l) => l.madeToOrder)
              ? order.lines.some((l) => !l.madeToOrder)
                ? "Acompte de 50 % des vêtements, articles en stock et livraison."
                : "Acompte de 50 % des vêtements et frais de livraison."
              : "Montant à régler maintenant."}
          </p>
          <ol className="mt-5 space-y-3 text-[15px]">
            {[
              <>Composez le paiement marchand Orange Money.</>,
              <>Code marchand : <b className="font-semibold">{shop.orangeMoney.merchantCode}</b> · Bénéficiaire : <b className="font-semibold">{shop.orangeMoney.beneficiary}</b></>,
              <>Montant : <b className="font-semibold">{gnf(order.depositDue)}</b> · Motif : <b className="font-semibold">{order.ref}</b></>,
              <>Envoyez la preuve ci-dessous ou sur WhatsApp.</>,
            ].map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brun text-xs font-semibold text-white">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>

          <form onSubmit={submitProof} className="mt-6 space-y-4 rounded-3xl bg-ecru p-4 md:p-5">
            <Field label="Numéro Orange Money utilisé" htmlFor="payer" error={err}>
              <input id="payer" className="field" inputMode="tel" placeholder="6XX XX XX XX" value={payer} onChange={(e) => setPayer(e.target.value)} />
            </Field>
            <div>
              <p className="mb-1.5 text-[13px] font-medium text-soft">Capture du paiement (facultatif)</p>
              <label className="press flex cursor-pointer items-center gap-3 rounded-[14px] border border-dashed border-brun/30 bg-white px-4 py-3.5 text-sm hover:border-brun/60">
                <Upload className="size-5 text-brun" strokeWidth={1.6} />
                <span className="truncate">{file ? file.name : "Choisir une image"}</span>
                <input type="file" accept="image/*,.pdf" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
            <Button type="submit" size="lg" className="w-full">Envoyer la preuve</Button>
          </form>
          <ButtonLink
            href={whatsappLink({ intro: "Bonjour H.O.K Boutique, voici ma preuve de paiement Orange Money.", orderRef: order.ref })}
            variant="soft"
            size="lg"
            className="mt-3 w-full"
          >
            <MessageCircle className="size-[18px]" strokeWidth={1.7} /> Envoyer sur WhatsApp
          </ButtonLink>
          <p className="mt-4 flex gap-2 text-xs leading-relaxed text-muted">
            <Info className="mt-0.5 size-4 shrink-0" strokeWidth={1.7} />
            La boutique vérifie chaque transaction. Une capture d'écran seule ne confirme pas la réception des fonds : votre commande est confirmée après vérification.
            {reservationHours ? ` Sans paiement sous ${reservationHours} h, la commande est annulée automatiquement.` : ""}
          </p>
        </Card>
      )}

      {proofSent && (
        <Card className="mt-10 text-center">
          <p className="font-semibold">Preuve reçue, vérification en cours</p>
          <p className="mt-1 text-sm text-muted">Vous serez notifié dès la validation du paiement.</p>
        </Card>
      )}

      {!needsPayment && !proofSent && (
        <Card className="mt-10 text-center">
          <p className="font-semibold">Paiement à la livraison</p>
          <p className="mt-1 text-sm text-muted">Montant à prévoir : {gnf(order.total - order.paid)}</p>
        </Card>
      )}

      <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
        <ButtonLink href={`/suivi?ref=${order.ref}`} variant="outline" size="lg">Suivre ma commande</ButtonLink>
        <ButtonLink href={`/facture/${order.ref}`} variant="outline" size="lg" target="_blank">Document récapitulatif</ButtonLink>
      </div>
      <p className="mt-6 text-center text-sm">
        <Link href="/" className="text-brun hover:underline">Continuer mes achats</Link>
      </p>
    </Container>
  );
}
