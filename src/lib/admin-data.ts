import "server-only";
/** Lectures de l'administration, au nom du membre connecté (la RLS filtre selon le rôle). */
import { rowsToRules, rowsToUnivers, rowsToZones, rowToOrder, rowToProduct, rowToSettings } from "./db";
import { supabaseServer } from "./supabase/server";
import type { Order, Product } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

export interface AdminOrder extends Order {
  proofLinks: Record<string, string>; // id paiement → lien temporaire vers la preuve
  jobs: { id: string; lineName: string; stage: string; dueDate: string | null }[];
}

export async function listOrders(limit = 300): Promise<Order[]> {
  const db = await supabaseServer();
  const { data, error } = await db.from("orders").select("*, order_lines(*), payments(*)").order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToOrder);
}

export async function getAdminOrder(ref: string): Promise<AdminOrder | null> {
  const db = await supabaseServer();
  const { data } = await db.from("orders").select("*, order_lines(*, production_jobs(*)), payments(*)").eq("ref", ref).maybeSingle();
  if (!data) return null;
  const order = rowToOrder(data);
  const proofLinks: Record<string, string> = {};
  for (const p of data.payments ?? []) {
    if (!p.proof_path) continue;
    const { data: s } = await db.storage.from("payment-proofs").createSignedUrl(p.proof_path, 600);
    if (s?.signedUrl) proofLinks[p.id] = s.signedUrl;
  }
  const jobs = (data.order_lines ?? []).flatMap((l: Row) =>
    (Array.isArray(l.production_jobs) ? l.production_jobs : l.production_jobs ? [l.production_jobs] : []).map((j: Row) => ({
      id: j.id, lineName: l.name, stage: j.stage, dueDate: j.due_date,
    })),
  );
  return { ...order, proofLinks, jobs };
}

export async function orderHistory(ref: string) {
  const db = await supabaseServer();
  const { data } = await db.from("audit_log").select("*").eq("target", ref).order("at", { ascending: false });
  return data ?? [];
}

export async function listProducts(): Promise<(Product & { cost: number | null })[]> {
  const db = await supabaseServer();
  const [p, c] = await Promise.all([
    db.from("products").select("*, subcategories(slug), product_images(path, position)").order("created_at"),
    db.from("product_costs").select("*"),
  ]);
  if (p.error) throw new Error(p.error.message);
  const { data: avail } = await db.from("catalogue").select("id, available");
  return (p.data ?? []).map((r: Row) => ({
    ...rowToProduct({ ...r, available: avail?.find((a: Row) => a.id === r.id)?.available ?? (r.active ? undefined : 0) }),
    cost: c.data?.find((x: Row) => x.product_id === r.id)?.cost ?? null,
  }));
}

export async function getCatalogMeta() {
  const db = await supabaseServer();
  const [u, s, m] = await Promise.all([
    db.from("univers").select("*"),
    db.from("subcategories").select("*"),
    db.from("materials").select("id, name, univers, unit, quantity, reserved").order("id"),
  ]);
  return { univers: rowsToUnivers(u.data ?? [], s.data ?? []), materials: m.data ?? [] };
}

export async function listMaterials() {
  const db = await supabaseServer();
  const { data } = await db.from("materials").select("*").order("univers").order("id");
  return data ?? [];
}

export async function listJobs() {
  const db = await supabaseServer();
  const { data } = await db
    .from("production_jobs")
    .select("*, order_lines(name, variant_label, order_ref, measurements, measurements_by_whatsapp, orders(first_name, last_name, status))")
    .order("due_date", { ascending: true, nullsFirst: false });
  return (data ?? []).filter((j: Row) => j.order_lines?.orders?.status !== "annulee");
}

export async function listAudit(limit = 300) {
  const db = await supabaseServer();
  const { data } = await db.from("audit_log").select("*").order("at", { ascending: false }).limit(limit);
  return data ?? [];
}

export async function listMovements(limit = 50) {
  const db = await supabaseServer();
  const { data } = await db.from("stock_movements").select("*, products(name), materials(name)").order("at", { ascending: false }).limit(limit);
  return data ?? [];
}

export async function listPromos() {
  const db = await supabaseServer();
  const { data } = await db.from("promos").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function listCustomers() {
  const db = await supabaseServer();
  const { data } = await db.from("customers").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function getSettingsBundle() {
  const db = await supabaseServer();
  const [s, z, r] = await Promise.all([
    db.from("settings").select("*").eq("id", 1).maybeSingle(),
    db.from("delivery_zones").select("*"),
    db.from("payment_rules").select("*"),
  ]);
  return { settings: rowToSettings(s.data), zones: rowsToZones(z.data ?? []), zoneRows: z.data ?? [], rules: rowsToRules(r.data ?? []) };
}
