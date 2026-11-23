"use client";

import { create } from "zustand";
import { auditLog, type AuditEntry } from "@/lib/data/admin";
import { demoOrders } from "@/lib/data/orders";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/types";

/**
 * État de l'administration côté front (démonstration).
 * Chaque action sera remplacée par un appel API qui trace l'opération côté serveur.
 */
interface AdminState {
  orders: Order[];
  log: AuditEntry[];
  merge: (local: Order[]) => void;
  setStatus: (ref: string, s: OrderStatus) => void;
  verifyPayment: (ref: string, paymentId: string) => void;
  rejectPayment: (ref: string, paymentId: string) => void;
}

function paymentStatusOf(o: Order): PaymentStatus {
  if (o.paid <= 0) return o.payments.some((p) => p.status === "a_verifier" || p.status === "preuve_recue") ? "a_verifier" : "en_attente";
  return o.paid >= o.total ? "paye" : "partiellement_paye";
}

const entry = (action: string, target: string, detail: string): AuditEntry => ({
  id: `LOG-${Date.now()}`,
  date: new Date().toISOString(),
  user: "Admin",
  action,
  target,
  detail,
});

export const useAdmin = create<AdminState>()((set) => ({
  orders: demoOrders,
  log: auditLog,
  merge: (local) =>
    set((s) => ({ orders: [...local.filter((l) => !s.orders.some((o) => o.ref === l.ref)), ...s.orders] })),
  setStatus: (ref, status) =>
    set((s) => ({
      orders: s.orders.map((o) => (o.ref === ref ? { ...o, status } : o)),
      log: [entry("Changement de statut", ref, status), ...s.log],
    })),
  verifyPayment: (ref, pid) =>
    set((s) => {
      let amount = 0;
      const orders = s.orders.map((o) => {
        if (o.ref !== ref) return o;
        const payments = o.payments.map((p) => {
          if (p.id !== pid) return p;
          amount = p.amount;
          return { ...p, status: "paye" as PaymentStatus, verifiedBy: "Admin" };
        });
        const paid = o.paid + amount;
        const next = { ...o, payments, paid };
        return {
          ...next,
          paymentStatus: paymentStatusOf(next),
          status: o.status === "en_attente_paiement" || o.status === "paiement_a_verifier" ? ("confirmee" as OrderStatus) : o.status,
        };
      });
      return { orders, log: [entry("Validation de paiement", ref, `${amount.toLocaleString("fr-FR")} GNF vérifié`), ...s.log] };
    }),
  rejectPayment: (ref, pid) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.ref === ref
          ? { ...o, paymentStatus: "echec", status: "en_attente_paiement", payments: o.payments.map((p) => (p.id === pid ? { ...p, status: "echec" } : p)) }
          : o,
      ),
      log: [entry("Paiement refusé", ref, "Transaction non retrouvée"), ...s.log],
    })),
}));
