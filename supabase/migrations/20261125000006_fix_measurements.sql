-- Correctif : les mesures d'une pièce sur mesure ne doivent pas être recopiées sur les lignes suivantes de la commande.
-- (v_m réinitialisé à chaque ligne ; même correction dans 20261125000002_functions.sql)

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
    v_m := null; -- jamais hérité de la ligne précédente
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
