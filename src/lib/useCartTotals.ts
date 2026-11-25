"use client";

import { useShopData } from "@/components/shop/ShopData";
import { computeCart } from "./pricing";
import { useCart } from "@/store/cart";

export function useCartTotals() {
  const { products, zones, rules, settings } = useShopData();
  const { lines, commune, mode, promo, splitDelivery } = useCart();
  return computeCart(lines, products, { commune, mode, promo, splitDelivery, zones, rules, extraShipmentFee: settings.extraShipmentFee });
}
