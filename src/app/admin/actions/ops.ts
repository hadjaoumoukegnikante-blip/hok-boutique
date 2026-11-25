"use server";

/**
 * Actions de l'administration. Les opérations sensibles passent par les fonctions
 * de la base (vérification du rôle, stock cohérent, historique) ; le reste par la RLS.
 */
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/supabase/staff";

const num = (v: FormDataEntryValue | null) => {
  const n = Number(String(v ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};
const str = (v: FormDataEntryValue | null) => String(v ?? "").trim();

function done(paths: string[]) {
  paths.forEach((p) => revalidatePath(p));
  revalidatePath("/", "layout"); // catalogue de la boutique (stock, disponibilité)
}

async function rpc(fn: string, args: Record<string, unknown>) {
  const db = await supabaseServer();
  const { error } = await db.rpc(fn, args);
  if (error) throw new Error(error.message);
}

/* ---------- Commandes et paiements ---------- */
export async function verifyPaymentAction(form: FormData) {
  await requireStaff(["admin", "superviseur"]);
  const amount = num(form.get("amount"));
  await rpc("verify_payment", { p_payment_id: str(form.get("payment_id")), p_amount: Number.isFinite(amount) && amount > 0 ? amount : null });
  done([`/admin/commandes/${str(form.get("ref"))}`, "/admin/paiements", "/admin"]);
}

export async function rejectPaymentAction(form: FormData) {
  await requireStaff(["admin", "superviseur"]);
  await rpc("reject_payment", { p_payment_id: str(form.get("payment_id")), p_reason: str(form.get("reason")) || "Transaction non retrouvée" });
  done([`/admin/commandes/${str(form.get("ref"))}`, "/admin/paiements"]);
}

export async function cashPaymentAction(form: FormData) {
  await requireStaff(["admin", "superviseur", "livreur"]);
  await rpc("record_cash_payment", { p_ref: str(form.get("ref")), p_amount: num(form.get("amount")) });
  done([`/admin/commandes/${str(form.get("ref"))}`, "/admin/paiements"]);
}

export async function setOrderStatusAction(form: FormData) {
  await requireStaff();
  await rpc("set_order_status", { p_ref: str(form.get("ref")), p_status: str(form.get("status")) });
  done([`/admin/commandes/${str(form.get("ref"))}`, "/admin/commandes", "/admin/livraisons", "/admin"]);
}

export async function setStageAction(form: FormData) {
  await requireStaff(["admin", "superviseur", "atelier"]);
  await rpc("set_production_stage", { p_job_id: str(form.get("job_id")), p_stage: str(form.get("stage")) });
  done(["/admin/confection", "/admin/matieres"]);
}

/* ---------- Stocks et matières ---------- */
export async function adjustMaterialAction(form: FormData) {
  await requireStaff(["admin", "superviseur"]);
  const delta = num(form.get("delta"));
  if (!Number.isFinite(delta) || delta === 0) return;
  await rpc("adjust_material", { p_id: str(form.get("id")), p_delta: delta, p_kind: delta > 0 ? "entree" : "ajustement", p_note: str(form.get("note")) || null });
  done(["/admin/matieres"]);
}

export async function saveMaterialAction(form: FormData) {
  await requireStaff(["admin", "superviseur"]);
  const db = await supabaseServer();
  const id = str(form.get("id")).toUpperCase().replace(/[^A-Z0-9-]/g, "-");
  const row = {
    id,
    name: str(form.get("name")),
    univers: str(form.get("univers")),
    unit: str(form.get("unit")) || "pièce",
    threshold: num(form.get("threshold")) || 0,
    unit_cost: Number.isFinite(num(form.get("unit_cost"))) ? num(form.get("unit_cost")) : null,
  };
  const exists = form.get("existing") === "1";
  const { error } = exists
    ? await db.from("materials").update(row).eq("id", id)
    : await db.from("materials").insert({ ...row, quantity: num(form.get("quantity")) || 0 });
  if (error) throw new Error(error.message);
  done(["/admin/matieres"]);
}

export async function adjustStockAction(form: FormData) {
  await requireStaff(["admin", "superviseur"]);
  const delta = num(form.get("delta"));
  if (!Number.isFinite(delta) || delta === 0) return;
  await rpc("adjust_stock", { p_product: str(form.get("product_id")), p_delta: Math.trunc(delta), p_kind: delta > 0 ? "entree" : "ajustement", p_note: str(form.get("note")) || null });
  done(["/admin/stocks", "/admin/produits"]);
}

/* ---------- Catalogue ---------- */
export type ProductInput = {
  id?: string;
  ref: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  price_pending: boolean;
  univers: string;
  subcategory_id: string | null;
  status: string;
  stock: number;
  making_days: number | null;
  delivery_days: number | null;
  is_new: boolean;
  active: boolean;
  variants: unknown;
  fabric_material_id: string | null;
  fabric_meters: number | null;
  fabric_color: string | null;
  fabric_hex: string | null;
  fabric_pattern: string | null;
  images: string[];
  cost: number | null;
};

export async function saveProductAction(input: ProductInput): Promise<{ ok: boolean; error?: string; id?: string }> {
  await requireStaff(["admin", "superviseur"]);
  const db = await supabaseServer();
  const { images, cost, id, ...row } = input;
  if (!row.name || !row.ref || !row.slug) return { ok: false, error: "Nom, référence et adresse de la page sont requis." };
  if (row.status === "sur_commande" && row.fabric_material_id && !(Number(row.fabric_meters) > 0))
    return { ok: false, error: "Indiquez le métrage de tissu par pièce." };
  let productId = id;
  if (id) {
    const { stock: _ignore, ...upd } = row; // le stock se modifie par des mouvements tracés (page Stocks)
    void _ignore;
    const { error } = await db.from("products").update(upd).eq("id", id);
    if (error) return { ok: false, error: error.message.includes("duplicate") ? "Référence ou adresse déjà utilisée." : error.message };
  } else {
    const { data, error } = await db.from("products").insert(row).select("id").single();
    if (error) return { ok: false, error: error.message.includes("duplicate") ? "Référence ou adresse déjà utilisée." : error.message };
    productId = data.id;
  }
  await db.from("product_images").delete().eq("product_id", productId!);
  if (images.length) await db.from("product_images").insert(images.map((path, position) => ({ product_id: productId, path, position })));
  if (cost !== null && Number.isFinite(cost)) await db.from("product_costs").upsert({ product_id: productId, cost });
  done(["/admin/produits", "/admin/stocks"]);
  return { ok: true, id: productId };
}

export async function toggleProductAction(form: FormData) {
  await requireStaff(["admin", "superviseur"]);
  const db = await supabaseServer();
  await db.from("products").update({ active: form.get("active") === "true" }).eq("id", str(form.get("id")));
  done(["/admin/produits"]);
}

export async function saveSubcategoryAction(form: FormData) {
  await requireStaff(["admin", "superviseur"]);
  const db = await supabaseServer();
  const id = str(form.get("id"));
  if (form.get("op") === "toggle") await db.from("subcategories").update({ active: form.get("active") === "true" }).eq("id", id);
  else if (form.get("op") === "rename") await db.from("subcategories").update({ label: str(form.get("label")) }).eq("id", id);
  else if (form.get("op") === "move") {
    // Réordonne toute la liste de l'univers pour garder des positions 0..n sans doublon
    const { data: cur } = await db.from("subcategories").select("univers").eq("id", id).single();
    const { data: list } = await db.from("subcategories").select("id").eq("univers", cur?.univers).order("position").order("label");
    const ids = (list ?? []).map((r: { id: string }) => r.id);
    const from = ids.indexOf(id);
    const to = Math.min(Math.max(num(form.get("position")), 0), ids.length - 1);
    if (from >= 0 && from !== to) {
      ids.splice(to, 0, ids.splice(from, 1)[0]);
      await Promise.all(ids.map((sid, position) => db.from("subcategories").update({ position }).eq("id", sid)));
    }
  }
  else if (form.get("op") === "add") {
    const label = str(form.get("label"));
    if (!label) return;
    const slug = label.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await db.from("subcategories").insert({ univers: str(form.get("univers")), label, slug, position: num(form.get("position")) || 99 });
  }
  done(["/admin/categories"]);
}

export async function savePromoAction(form: FormData) {
  await requireStaff(["admin", "superviseur"]);
  const db = await supabaseServer();
  if (form.get("op") === "toggle") {
    await db.from("promos").update({ active: form.get("active") === "true" }).eq("code", str(form.get("code")));
  } else {
    const univers = str(form.get("univers"));
    const { error } = await db.from("promos").insert({
      code: str(form.get("code")).toUpperCase(),
      kind: str(form.get("kind")),
      value: num(form.get("value")),
      min_purchase: num(form.get("min")) || null,
      starts_at: str(form.get("start")) || null,
      ends_at: str(form.get("end")) || null,
      max_uses: num(form.get("max")) || null,
      univers: univers && univers !== "tous" ? [univers] : null,
      cumulable: form.get("cumul") === "on",
    });
    if (error) throw new Error(error.message.includes("duplicate") ? "Ce code existe déjà." : error.message);
  }
  done(["/admin/promotions"]);
}

/* ---------- Paramètres ---------- */
export async function saveSettingsAction(form: FormData) {
  await requireStaff(["admin"]);
  const db = await supabaseServer();
  const hours = num(form.get("reservation_hours"));
  const { error } = await db
    .from("settings")
    .update({
      phone: str(form.get("phone")) || null,
      email: str(form.get("email")) || null,
      whatsapp: str(form.get("whatsapp")).replace(/\D/g, "") || null,
      domain: str(form.get("domain")) || null,
      workshop: str(form.get("workshop")) || null,
      om_merchant_code: str(form.get("om_merchant_code")) || null,
      om_beneficiary: str(form.get("om_beneficiary")) || null,
      rccm: str(form.get("rccm")) || null,
      nif: str(form.get("nif")) || null,
      reservation_hours: Number.isFinite(hours) && hours > 0 ? hours : null,
    })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  for (const u of ["studio", "bijoux", "maison"]) {
    await db
      .from("payment_rules")
      .update({
        deposit_rate: Math.min(Math.max(num(form.get(`dep_${u}`)) / 100, 0), 1),
        allow_cash_on_delivery: form.get(`cod_${u}`) === "on",
        requires_making_acceptance: form.get(`acc_${u}`) === "on",
      })
      .eq("univers", u);
  }
  done(["/admin/parametres"]);
}

export async function saveDeliveryAction(form: FormData) {
  await requireStaff(["admin"]);
  const db = await supabaseServer();
  const communes = form.getAll("commune").map(String);
  for (const c of communes) {
    await db.from("delivery_zones").update({ fee: num(form.get(`fee_${c}`)), active: form.get(`active_${c}`) === "on" }).eq("commune", c);
  }
  const added = str(form.get("new_commune"));
  if (added) await db.from("delivery_zones").insert({ commune: added, fee: num(form.get("new_fee")) || 0, position: communes.length + 1 });
  await db
    .from("settings")
    .update({ extra_shipment_fee: num(form.get("extra_fee")) || 0, delivery_provisional: form.get("provisional") === "on" })
    .eq("id", 1);
  done(["/admin/livraisons"]);
}
