"use client";

import { allProducts } from "./api";
import { demoPromos } from "./data/orders";
import { computeCart } from "./pricing";
import { useCart } from "@/store/cart";

export function useCartTotals() {
  const { lines, commune, mode, promoCode, splitDelivery } = useCart();
  const promo = promoCode ? demoPromos.find((p) => p.code === promoCode) ?? null : null;
  return computeCart(lines, allProducts(), { commune, mode, promo, splitDelivery });
}
