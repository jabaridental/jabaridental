// ============================================================
// Shared list of valid content collections for API routes.
// Keep this single source of truth so adding a new collection
// only requires one edit.
// ============================================================
import type { CollectionKey } from "./types";

export const SINGLE: ReadonlySet<CollectionKey> = new Set<CollectionKey>([
  "site",
  "hero",
  "contact",
]);

export const ARRAYS: ReadonlySet<CollectionKey> = new Set<CollectionKey>([
  "announcements",
  "offers",
  "treatments",
  "team",
  "gallery",
  "beforeAfter",
  "testimonials",
  "articles",
  "faqs",
  "social",
  "specialHours",
  "hours",
]);

export const ALL: ReadonlySet<CollectionKey> = new Set<CollectionKey>([
  ...SINGLE,
  ...ARRAYS,
]);

export function isCollectionKey(k: string): k is CollectionKey {
  return ALL.has(k as CollectionKey);
}