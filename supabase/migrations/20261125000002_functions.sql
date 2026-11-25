-- =====================================================================
-- H.O.K Boutique · 2/4 · Fonctions métier (exécutées côté serveur)
-- Le navigateur n'envoie que des choix ; prix, acompte, frais, stock et
-- références sont toujours recalculés ici. On ne fait jamais confiance au client.
-- =====================================================================

-- ---------- Rôles ----------------------------------------------------
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where user_id = auth.uid() and active);
$$;

create or replace function public.has_role(roles public.staff_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where user_id = auth.uid() and active and role = any (roles));
$$;

create or replace function public.log_action(p_action text, p_target text, p_detail text)
returns void language sql security definer set search_path = public as $$
  insert into audit_log (user_id, action, target, detail) values (auth.uid(), p_action, p_target, p_detail);
$$;

create or replace function public.digits(p text) returns text
language sql immutable as $$ select regexp_replace(coalesce(p, ''), '\D', '', 'g') $$;

-- Deux numéros identiques si leurs 9 derniers chiffres concordent (avec ou sans 224)
create or replace function public.same_phone(a text, b text) returns boolean
language sql immutable as $$
  select length(public.digits(a)) >= 9 and right(public.digits(a), 9) = right(public.digits(b), 9)
$$;

-- ---------- Références -----------------------------------------------
create or replace function public.next_order_ref() returns text
language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'Africa/Conakry')::date; n int;
begin
  insert into order_counters (day, last) values (d, 1)
  on conflict (day) do update set last = order_counters.last + 1
  returning last into n;
  return 'HOK-' || to_char(d, 'YYYYMMDD') || '-' || lpad(n::text, 4, '0');
end $$;

create or replace function public.next_invoice_number() returns text
language plpgsql security definer set search_path = public as $$
declare y int := extract(year from (now() at time zone 'Africa/Conakry'))::int; n int;
begin
  insert into invoice_counters (year, last) values (y, 1)
  on conflict (year) do update set last = invoice_counters.last + 1
  returning last into n;
  return 'FAC-' || y || '-' || lpad(n::text, 4, '0');
end $$;

-- ---------- Disponibilité --------------------------------------------
-- Pièces vendables : stock libre pour les produits finis, tissu libre pour la confection
create or replace function public.available_qty(p public.products) returns int
language sql stable security definer set search_path = public as $$
  select case
    when not p.active or p.status = 'indisponible' then 0
    when p.status = 'sur_commande' and p.fabric_material_id is not null then
      coalesce((select floor((m.quantity - m.reserved) / p.fabric_meters)::int from materials m where m.id = p.fabric_material_id), 0)
    when p.status in ('sur_commande', 'precommande') then 99
    else greatest(p.stock - p.reserved, 0)
  end
$$;

-- Vue publique du catalogue (avec la disponibilité calculée, sans les coûts)
create or replace view public.catalogue with (security_invoker = true) as
select p.id, p.ref, p.slug, p.name, p.description, p.price, p.price_pending, p.univers,
       s.slug as subcategory, p.status, p.making_days, p.delivery_days, p.is_new, p.variants,
       p.fabric_material_id, p.fabric_meters, p.fabric_color, p.fabric_hex, p.fabric_pattern,
       public.available_qty(p) as available, p.stock, p.created_at,
       coalesce((select jsonb_agg(i.path order by i.position) from product_images i where i.product_id = p.id), '[]'::jsonb) as images
from products p
left join subcategories s on s.id = p.subcategory_id
where p.active;

-- ---------- Codes promo ----------------------------------------------
-- p_amounts : {"studio": 350000, "bijoux": 0, "maison": 120000}
create or replace function public.check_promo(p_code text, p_amounts jsonb)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare pr promos; eligible int := 0; k text;
begin
  select * into pr from promos where code = upper(trim(p_code));
  if not found or not pr.active then return jsonb_build_object('ok', false, 'message', 'Ce code n''est pas valide.'); end if;
  if pr.starts_at is not null and pr.starts_at > now() then return jsonb_build_object('ok', false, 'message', 'Ce code n''est pas encore actif.'); end if;
  if pr.ends_at is not null and pr.ends_at < now() then return jsonb_build_object('ok', false, 'message', 'Ce code a expiré.'); end if;
  if pr.max_uses is not null and pr.used >= pr.max_uses then return jsonb_build_object('ok', false, 'message', 'Ce code a atteint sa limite d''utilisation.'); end if;
  for k in select jsonb_object_keys(p_amounts) loop
    if pr.univers is null or k::univers_key = any (pr.univers) then
      eligible := eligible + coalesce((p_amounts ->> k)::int, 0);
    end if;
  end loop;
  if eligible <= 0 then return jsonb_build_object('ok', false, 'message', 'Aucun article éligible à ce code.'); end if;
  if pr.min_purchase is not null and eligible < pr.min_purchase then
    return jsonb_build_object('ok', false, 'message', 'Minimum d''achat requis : ' || pr.min_purchase || ' GNF.');
  end if;
  return jsonb_build_object('ok', true, 'code', pr.code, 'kind', pr.kind, 'value', pr.value, 'univers', pr.univers,
    'discount', case when pr.kind = 'pourcentage' then round(eligible * pr.value / 100.0)::int else least(pr.value, eligible) end);
end $$;

-- ---------- Passer une commande --------------------------------------
-- p : {
--   customer: {first_name, last_name, phone, email, commune, quartier, address, marketing_consent},
--   lines: [{product_id, qty, selection: {taille: "M"}, measurements: {...} | null, measurements_by_whatsapp: bool}],
--   payment_mode: "orange_money" | "a_la_livraison", promo_code, split_delivery: bool, accepted_making_terms: bool
-- }
create or replace function public.place_order(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c jsonb := p -> 'customer';
  l jsonb;
  prod products;
  mat materials;
  rule payment_rules;
  st settings;
  zone delivery_zones;
  v_ref text; v_invoice text; v_customer uuid;
  v_qty int; v_label text; v_group jsonb; v_choice text; v_opt jsonb;
  v_meters numeric; v_m jsonb; k text; n numeric;
  amounts jsonb := '{"studio":0,"bijoux":0,"maison":0}'::jsonb;
  sub_made int := 0; sub_stock int := 0; deposit_made numeric := 0;
  v_discount int := 0; disc_made int := 0; eligible_made int := 0; eligible int := 0;
  v_promo jsonb; v_fee int; v_total int; v_due_now int; v_mode payment_mode;
  cod_ok boolean := true; needs_accept boolean := false;
  v_making int := 0; v_delivery int := 0;
  pending jsonb := '[]'::jsonb;  -- lignes validées, insérées après la commande
begin
  -- 1. Client et adresse
  if coalesce(trim(c ->> 'first_name'), '') = '' or coalesce(trim(c ->> 'last_name'), '') = '' then
    raise exception 'Nom et prénom requis.' using errcode = 'P0001';
  end if;
  if length(digits(c ->> 'phone')) < 9 then raise exception 'Numéro de téléphone invalide.' using errcode = 'P0001'; end if;
  if coalesce(trim(c ->> 'quartier'), '') = '' then raise exception 'Quartier requis.' using errcode = 'P0001'; end if;
  select * into zone from delivery_zones where commune = c ->> 'commune' and active;
  if not found then raise exception 'Commune de livraison non desservie.' using errcode = 'P0001'; end if;
  if jsonb_typeof(p -> 'lines') <> 'array' or jsonb_array_length(p -> 'lines') = 0 then
    raise exception 'Panier vide.' using errcode = 'P0001';
  end if;
  select * into st from settings where id = 1;

  -- 2. Lignes : prix relus en base, variantes et disponibilité vérifiées, stock réservé
  for l in select * from jsonb_array_elements(p -> 'lines') loop
    select * into prod from products where id = (l ->> 'product_id')::uuid and active for update;
    if not found then raise exception 'Produit introuvable.' using errcode = 'P0001'; end if;
    if prod.status = 'indisponible' then raise exception '« % » est indisponible.', prod.name using errcode = 'P0001'; end if;
    select * into rule from payment_rules where univers = prod.univers;
    v_qty := greatest(coalesce((l ->> 'qty')::int, 1), 1);

    -- Variantes : toutes requises, valeurs existantes
    v_label := '';
    for v_group in select * from jsonb_array_elements(prod.variants) loop
      v_choice := l -> 'selection' ->> (v_group ->> 'kind');
      v_opt := null;
      select o into v_opt from jsonb_array_elements(v_group -> 'options') o where o ->> 'value' = v_choice;
      if v_opt is null then raise exception 'Choisissez : % (%).', lower(v_group ->> 'label'), prod.name using errcode = 'P0001'; end if;
      v_label := v_label || case when v_label = '' then '' else ' · ' end || (v_opt ->> 'label');
    end loop;
    if prod.fabric_color is not null then
      v_label := v_label || case when v_label = '' then '' else ' · ' end || prod.fabric_color;
    end if;

    v_meters := 0;
    if prod.status = 'sur_commande' then
      v_qty := 1; -- une pièce sur mesure = une ligne
      if coalesce((l ->> 'measurements_by_whatsapp')::boolean, false) then
        v_m := null;
      else
        v_m := l -> 'measurements';
        foreach k in array array['poitrine', 'taille', 'hanches', 'longueur'] loop
          begin n := replace(v_m ->> k, ',', '.')::numeric; exception when others then n := null; end;
          if n is null or n < 30 or n > 250 then
            raise exception 'Mesures incomplètes pour « % ».', prod.name using errcode = 'P0001';
          end if;
        end loop;
      end if;
      if prod.fabric_material_id is not null then
        select * into mat from materials where id = prod.fabric_material_id for update;
        v_meters := prod.fabric_meters;
        if mat.quantity - mat.reserved < v_meters then
          raise exception 'Tissu insuffisant pour « % ».', prod.name using errcode = 'P0001';
        end if;
        update materials set reserved = reserved + v_meters where id = mat.id;
      end if;
      sub_made := sub_made + prod.price;
      deposit_made := deposit_made + prod.price * rule.deposit_rate;
      if rule.requires_making_acceptance then needs_accept := true; end if;
      v_making := greatest(v_making, coalesce(prod.making_days, 0));
    elsif prod.status = 'en_stock' then
      if prod.stock - prod.reserved < v_qty then
        raise exception 'Stock insuffisant pour « % » (% disponible).', prod.name, prod.stock - prod.reserved using errcode = 'P0001';
      end if;
      update products set reserved = reserved + v_qty where id = prod.id;
      sub_stock := sub_stock + prod.price * v_qty;
      if not rule.allow_cash_on_delivery then cod_ok := false; end if;
    else -- précommande
      sub_stock := sub_stock + prod.price * v_qty;
      if not rule.allow_cash_on_delivery then cod_ok := false; end if;
    end if;
    v_delivery := greatest(v_delivery, coalesce(prod.delivery_days, 0));
    amounts := jsonb_set(amounts, array[prod.univers::text], to_jsonb((amounts ->> prod.univers::text)::int + prod.price * v_qty));

    pending := pending || jsonb_build_object(
      'product_id', prod.id, 'product_ref', prod.ref, 'name', prod.name, 'univers', prod.univers,
      'variant_label', v_label, 'selection', coalesce(l -> 'selection', '{}'::jsonb), 'qty', v_qty,
      'unit_price', prod.price, 'made', prod.status = 'sur_commande', 'measurements', v_m,
      'by_whatsapp', prod.status = 'sur_commande' and v_m is null,
      'material', prod.fabric_material_id, 'meters', v_meters,
      'stock_reserved', case when prod.status = 'en_stock' then v_qty else 0 end);
  end loop;

  -- 3. Acceptation des délais de confection
  if needs_accept and not coalesce((p ->> 'accepted_making_terms')::boolean, false) then
    raise exception 'Les délais de confection et de livraison doivent être acceptés.' using errcode = 'P0001';
  end if;

  -- 4. Code promo (répartition de la remise au prorata entre confection et stock)
  if coalesce(trim(p ->> 'promo_code'), '') <> '' then
    v_promo := check_promo(p ->> 'promo_code', amounts);
    if not (v_promo ->> 'ok')::boolean then raise exception '%', v_promo ->> 'message' using errcode = 'P0001'; end if;
    v_discount := (v_promo ->> 'discount')::int;
    select coalesce(sum((x ->> 'unit_price')::int * (x ->> 'qty')::int), 0) into eligible_made
      from jsonb_array_elements(pending) x
      where (x ->> 'made')::boolean and (v_promo -> 'univers' = 'null'::jsonb or v_promo -> 'univers' ? (x ->> 'univers'));
    select coalesce(sum((x ->> 'unit_price')::int * (x ->> 'qty')::int), 0) into eligible
      from jsonb_array_elements(pending) x
      where v_promo -> 'univers' = 'null'::jsonb or v_promo -> 'univers' ? (x ->> 'univers');
    disc_made := case when eligible > 0 then round(v_discount::numeric * eligible_made / eligible)::int else 0 end;
    update promos set used = used + 1 where code = v_promo ->> 'code';
  end if;

  -- 5. Livraison, total, montant exigé maintenant
  v_fee := zone.fee + case when coalesce((p ->> 'split_delivery')::boolean, false) then st.extra_shipment_fee else 0 end;
  v_total := sub_made + sub_stock - v_discount + v_fee;
  v_mode := case when cod_ok and p ->> 'payment_mode' = 'a_la_livraison' then 'a_la_livraison' else 'orange_money' end;
  v_due_now := round(case when sub_made > 0 then deposit_made * (sub_made - disc_made) / sub_made else 0 end)::int
             + case when v_mode = 'orange_money' then (sub_stock - (v_discount - disc_made)) + v_fee else 0 end;

  -- 6. Client : son compte s'il est connecté (jamais celui d'un membre de l'équipe
  --    qui saisit une commande WhatsApp), sinon retrouvé par téléphone, sinon créé
  if auth.uid() is not null and not is_staff() then
    select id into v_customer from customers where user_id = auth.uid();
  end if;
  if v_customer is null then
    select id into v_customer from customers where same_phone(phone, c ->> 'phone') order by created_at limit 1;
  end if;
  if v_customer is null then
    insert into customers (first_name, last_name, phone, email, marketing_consent, user_id)
    values (trim(c ->> 'first_name'), trim(c ->> 'last_name'), digits(c ->> 'phone'), nullif(trim(c ->> 'email'), ''),
            coalesce((c ->> 'marketing_consent')::boolean, false),
            case when auth.uid() is not null and not is_staff()
                  and not exists (select 1 from customers where user_id = auth.uid()) then auth.uid() end)
    returning id into v_customer;
  else
    update customers set marketing_consent = coalesce((c ->> 'marketing_consent')::boolean, marketing_consent),
      email = coalesce(nullif(trim(c ->> 'email'), ''), email) where id = v_customer;
  end if;

  v_ref := next_order_ref();
  v_invoice := next_invoice_number();
  insert into orders (ref, customer_id, first_name, last_name, phone, email, commune, quartier, address, marketing_consent,
    subtotal, discount, promo_code, delivery_fee, total, deposit_due, payment_mode, payment_status, status,
    making_days, delivery_days, split_delivery, invoice_number, expires_at)
  values (v_ref, v_customer, trim(c ->> 'first_name'), trim(c ->> 'last_name'), digits(c ->> 'phone'), nullif(trim(c ->> 'email'), ''),
    zone.commune, trim(c ->> 'quartier'), nullif(trim(c ->> 'address'), ''), coalesce((c ->> 'marketing_consent')::boolean, false),
    sub_made + sub_stock, v_discount, v_promo ->> 'code', v_fee, v_total, v_due_now, v_mode, 'en_attente',
    case when v_due_now > 0 then 'en_attente_paiement'::order_status else 'confirmee'::order_status end,
    nullif(v_making, 0), nullif(v_delivery, 0), coalesce((p ->> 'split_delivery')::boolean, false), v_invoice,
    case when v_due_now > 0 and st.reservation_hours is not null then now() + make_interval(hours => st.reservation_hours) end);

  -- 7. Lignes, mouvements de stock, fiches de confection
  for l in select * from jsonb_array_elements(pending) loop
    with ins as (
      insert into order_lines (order_ref, product_id, product_ref, name, univers, variant_label, selection, qty, unit_price,
        made_to_order, measurements, measurements_by_whatsapp, fabric_material_id, fabric_meters_reserved, stock_reserved)
      values (v_ref, (l ->> 'product_id')::uuid, l ->> 'product_ref', l ->> 'name', (l ->> 'univers')::univers_key,
        l ->> 'variant_label', l -> 'selection', (l ->> 'qty')::int, (l ->> 'unit_price')::int, (l ->> 'made')::boolean,
        case when jsonb_typeof(l -> 'measurements') = 'object' then l -> 'measurements' end, (l ->> 'by_whatsapp')::boolean,
        l ->> 'material', (l ->> 'meters')::numeric, (l ->> 'stock_reserved')::int)
      returning id
    )
    insert into production_jobs (order_line_id) select id from ins where (l ->> 'made')::boolean;

    if (l ->> 'meters')::numeric > 0 then
      insert into stock_movements (material_id, kind, quantity, order_ref, note)
      values (l ->> 'material', 'reservation', (l ->> 'meters')::numeric, v_ref, l ->> 'name');
    end if;
    if (l ->> 'stock_reserved')::int > 0 then
      insert into stock_movements (product_id, kind, quantity, order_ref)
      values ((l ->> 'product_id')::uuid, 'reservation', (l ->> 'stock_reserved')::int, v_ref);
    end if;
  end loop;

  insert into audit_log (user_id, action, target, detail)
  values (auth.uid(), 'Commande créée', v_ref, v_total || ' GNF, ' || v_due_now || ' GNF exigés maintenant');

  return jsonb_build_object('ref', v_ref, 'invoice_number', v_invoice, 'total', v_total, 'due_now', v_due_now,
    'due_later', v_total - v_due_now, 'payment_mode', v_mode, 'delivery_fee', v_fee, 'discount', v_discount);
end $$;

-- ---------- Libérer ce qui est encore réservé (annulation) ----------
create or replace function public.release_reservations(p_ref text) returns void
language plpgsql security definer set search_path = public as $$
declare ln order_lines;
begin
  for ln in select * from order_lines where order_ref = p_ref for update loop
    if ln.fabric_meters_reserved > 0 and not ln.cut_done then
      update materials set reserved = greatest(reserved - ln.fabric_meters_reserved, 0) where id = ln.fabric_material_id;
      insert into stock_movements (material_id, kind, quantity, order_ref) values (ln.fabric_material_id, 'liberation', ln.fabric_meters_reserved, p_ref);
      update order_lines set fabric_meters_reserved = 0 where id = ln.id;
    end if;
    if ln.stock_reserved > 0 then
      update products set reserved = greatest(reserved - ln.stock_reserved, 0) where id = ln.product_id;
      insert into stock_movements (product_id, kind, quantity, order_ref) values (ln.product_id, 'liberation', ln.stock_reserved, p_ref);
      update order_lines set stock_reserved = 0 where id = ln.id;
    end if;
  end loop;
end $$;

-- Sortie définitive du stock des produits finis (expédition / livraison)
create or replace function public.consume_stock(p_ref text) returns void
language plpgsql security definer set search_path = public as $$
declare ln order_lines;
begin
  for ln in select * from order_lines where order_ref = p_ref and stock_reserved > 0 for update loop
    update products set stock = stock - ln.stock_reserved, reserved = reserved - ln.stock_reserved where id = ln.product_id;
    insert into stock_movements (product_id, kind, quantity, order_ref) values (ln.product_id, 'sortie', ln.stock_reserved, p_ref);
    update order_lines set stock_reserved = 0 where id = ln.id;
  end loop;
end $$;

-- ---------- Suivi de commande sans compte ----------------------------
create or replace function public.track_order(p_ref text, p_phone text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare o orders;
begin
  select * into o from orders where ref = upper(trim(p_ref));
  if not found or not same_phone(o.phone, p_phone) then return null; end if;
  return to_jsonb(o) - 'customer_id' - 'delivery_staff' - 'marketing_consent'
    || jsonb_build_object(
      'lines', (select coalesce(jsonb_agg(to_jsonb(x) - 'fabric_material_id' - 'fabric_meters_reserved' - 'stock_reserved' - 'cut_done' order by x.name), '[]'::jsonb) from order_lines x where x.order_ref = o.ref),
      'payments', (select coalesce(jsonb_agg(jsonb_build_object('created_at', y.created_at, 'amount', y.amount, 'mode', y.mode, 'status', y.status) order by y.created_at), '[]'::jsonb) from payments y where y.order_ref = o.ref));
end $$;

-- ---------- Preuve de paiement Orange Money (client) -----------------
create or replace function public.submit_payment_proof(p_ref text, p_phone text, p_payer_number text, p_proof_path text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare o orders; v_amount int;
begin
  select * into o from orders where ref = upper(trim(p_ref)) for update;
  if not found or not same_phone(o.phone, p_phone) then raise exception 'Commande introuvable.' using errcode = 'P0001'; end if;
  if o.status = 'annulee' then raise exception 'Cette commande est annulée.' using errcode = 'P0001'; end if;
  if length(digits(p_payer_number)) < 9 then raise exception 'Numéro Orange Money invalide.' using errcode = 'P0001'; end if;
  if exists (select 1 from payments where order_ref = o.ref and status in ('preuve_recue', 'a_verifier')) then
    raise exception 'Une preuve est déjà en cours de vérification.' using errcode = 'P0001';
  end if;
  v_amount := case when o.paid < o.deposit_due then o.deposit_due - o.paid else o.total - o.paid end;
  if v_amount <= 0 then raise exception 'Aucun montant restant à payer.' using errcode = 'P0001'; end if;
  insert into payments (order_ref, amount, mode, payer_number, status, proof_path)
  values (o.ref, v_amount, 'orange_money', digits(p_payer_number), 'a_verifier', p_proof_path);
  update orders set payment_status = 'a_verifier',
    status = case when status = 'en_attente_paiement' then 'paiement_a_verifier' else status end
  where ref = o.ref;
  insert into audit_log (action, target, detail) values ('Preuve de paiement reçue', o.ref, v_amount || ' GNF, Orange Money ' || digits(p_payer_number));
  return jsonb_build_object('amount', v_amount);
end $$;

-- ---------- Administration : paiements --------------------------------
create or replace function public.verify_payment(p_payment_id uuid, p_amount int default null)
returns void language plpgsql security definer set search_path = public as $$
declare pay payments; o orders; v_amount int;
begin
  if not has_role(array['admin', 'superviseur']::staff_role[]) then raise exception 'Accès refusé.' using errcode = '42501'; end if;
  select * into pay from payments where id = p_payment_id for update;
  if not found or pay.status not in ('preuve_recue', 'a_verifier', 'en_attente') then raise exception 'Paiement non vérifiable.' using errcode = 'P0001'; end if;
  select * into o from orders where ref = pay.order_ref for update;
  v_amount := coalesce(p_amount, pay.amount);
  if v_amount <= 0 or o.paid + v_amount > o.total then raise exception 'Montant incohérent.' using errcode = 'P0001'; end if;
  update payments set status = 'paye', amount = v_amount, verified_by = auth.uid(), verified_at = now() where id = pay.id;
  update orders set paid = paid + v_amount,
    payment_status = case when paid + v_amount >= total then 'paye'::payment_status else 'partiellement_paye'::payment_status end,
    status = case when status in ('en_attente_paiement', 'paiement_a_verifier') and paid + v_amount >= deposit_due then 'confirmee'::order_status else status end,
    expires_at = case when paid + v_amount >= deposit_due then null else expires_at end
  where ref = o.ref;
  -- Échéance de confection à partir de la validation de l'acompte
  update production_jobs j set due_date = (now() at time zone 'Africa/Conakry')::date + coalesce(o.making_days, 0)
  from order_lines x where x.id = j.order_line_id and x.order_ref = o.ref and j.due_date is null;
  perform log_action('Validation de paiement', o.ref, v_amount || ' GNF vérifié');
end $$;

create or replace function public.reject_payment(p_payment_id uuid, p_reason text default 'Transaction non retrouvée')
returns void language plpgsql security definer set search_path = public as $$
declare pay payments;
begin
  if not has_role(array['admin', 'superviseur']::staff_role[]) then raise exception 'Accès refusé.' using errcode = '42501'; end if;
  select * into pay from payments where id = p_payment_id for update;
  if not found or pay.status not in ('preuve_recue', 'a_verifier') then raise exception 'Paiement non refusable.' using errcode = 'P0001'; end if;
  update payments set status = 'echec', verified_by = auth.uid(), verified_at = now() where id = pay.id;
  update orders set payment_status = case when paid > 0 then 'partiellement_paye'::payment_status else 'echec'::payment_status end,
    status = case when status = 'paiement_a_verifier' then 'en_attente_paiement' else status end,
    expires_at = case when expires_at is not null then greatest(expires_at, now() + interval '2 hours') end
  where ref = pay.order_ref;
  perform log_action('Paiement refusé', pay.order_ref, p_reason);
end $$;

-- Paiement reçu en main propre (à la livraison)
create or replace function public.record_cash_payment(p_ref text, p_amount int)
returns void language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  if not has_role(array['admin', 'superviseur', 'livreur']::staff_role[]) then raise exception 'Accès refusé.' using errcode = '42501'; end if;
  insert into payments (order_ref, amount, mode, status) values (upper(p_ref), p_amount, 'a_la_livraison', 'a_verifier') returning id into pid;
  -- Le livreur déclare, l'administration valide ; un admin valide directement
  if has_role(array['admin', 'superviseur']::staff_role[]) then perform verify_payment(pid, p_amount); end if;
  perform log_action('Paiement à la livraison déclaré', upper(p_ref), p_amount || ' GNF');
end $$;

-- ---------- Administration : statut de commande ----------------------
create or replace function public.set_order_status(p_ref text, p_status public.order_status)
returns void language plpgsql security definer set search_path = public as $$
declare o orders;
begin
  if not is_staff() then raise exception 'Accès refusé.' using errcode = '42501'; end if;
  if has_role(array['livreur']::staff_role[]) and p_status not in ('expediee', 'livree') then raise exception 'Accès refusé.' using errcode = '42501'; end if;
  select * into o from orders where ref = p_ref for update;
  if not found then raise exception 'Commande introuvable.' using errcode = 'P0001'; end if;
  if o.status = 'annulee' then raise exception 'Une commande annulée ne peut pas être modifiée.' using errcode = 'P0001'; end if;
  if p_status = 'annulee' then perform release_reservations(p_ref); end if;
  if p_status in ('expediee', 'livree') then perform consume_stock(p_ref); end if;
  update orders set status = p_status, expires_at = null where ref = p_ref;
  perform log_action('Changement de statut', p_ref, o.status || ' → ' || p_status);
end $$;

-- ---------- Administration : confection ------------------------------
-- Le passage à la découpe consomme le tissu : il n'est plus libérable en cas d'annulation (perte).
create or replace function public.set_production_stage(p_job_id uuid, p_stage public.production_stage)
returns void language plpgsql security definer set search_path = public as $$
declare j production_jobs; ln order_lines;
begin
  if not has_role(array['admin', 'superviseur', 'atelier']::staff_role[]) then raise exception 'Accès refusé.' using errcode = '42501'; end if;
  select * into j from production_jobs where id = p_job_id for update;
  select * into ln from order_lines where id = j.order_line_id for update;
  if p_stage <> 'a_demarrer' and not ln.cut_done and ln.fabric_meters_reserved > 0 then
    update materials set quantity = quantity - ln.fabric_meters_reserved, reserved = reserved - ln.fabric_meters_reserved where id = ln.fabric_material_id;
    insert into stock_movements (material_id, kind, quantity, order_ref, note) values (ln.fabric_material_id, 'sortie', ln.fabric_meters_reserved, ln.order_ref, 'Découpe ' || ln.name);
    update order_lines set cut_done = true, fabric_meters_reserved = 0 where id = ln.id;
  end if;
  update production_jobs set stage = p_stage where id = j.id;
  perform log_action('Étape de confection', ln.order_ref, ln.name || ' → ' || p_stage);
end $$;

-- ---------- Annulation automatique des commandes impayées ------------
-- Jamais pendant la vérification d'une preuve de paiement.
create or replace function public.cancel_expired_orders() returns int
language plpgsql security definer set search_path = public as $$
declare o orders; n int := 0;
begin
  for o in select * from orders
    where status = 'en_attente_paiement' and paid = 0 and expires_at is not null and expires_at < now()
      and not exists (select 1 from payments y where y.order_ref = orders.ref and y.status in ('preuve_recue', 'a_verifier'))
    for update skip locked
  loop
    perform release_reservations(o.ref);
    update orders set status = 'annulee', expires_at = null where ref = o.ref;
    insert into audit_log (action, target, detail) values ('Annulation automatique', o.ref, 'Non payée dans le délai');
    n := n + 1;
  end loop;
  return n;
end $$;

-- ---------- Entrée / ajustement de matière (admin) ------------------
create or replace function public.adjust_material(p_id text, p_delta numeric, p_kind text default 'entree', p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not has_role(array['admin', 'superviseur']::staff_role[]) then raise exception 'Accès refusé.' using errcode = '42501'; end if;
  update materials set quantity = quantity + p_delta where id = p_id;
  insert into stock_movements (material_id, kind, quantity, user_id, note) values (p_id, p_kind, p_delta, auth.uid(), p_note);
  perform log_action('Mouvement de matière', p_id, p_delta || ' (' || p_kind || ')');
end $$;

create or replace function public.adjust_stock(p_product uuid, p_delta int, p_kind text default 'entree', p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not has_role(array['admin', 'superviseur']::staff_role[]) then raise exception 'Accès refusé.' using errcode = '42501'; end if;
  update products set stock = stock + p_delta where id = p_product;
  insert into stock_movements (product_id, kind, quantity, user_id, note) values (p_product, p_kind, p_delta, auth.uid(), p_note);
  perform log_action('Modification du stock', (select ref from products where id = p_product), p_delta::text);
end $$;
