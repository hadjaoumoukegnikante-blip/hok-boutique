import "server-only";
import { randomBytes } from "node:crypto";

/** 12 caractères lisibles (sans 0/O, 1/l), à changer à la première connexion. */
export function tempPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from(randomBytes(12), (b) => alphabet[b % alphabet.length]).join("");
}
