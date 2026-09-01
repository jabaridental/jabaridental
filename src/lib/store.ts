/**
 * Backwards-compatible façade.
 *
 * The old `src/lib/store.ts` exposed no-arg getters like `getSite()`. The new
 * D1 implementation needs `Astro.locals` to reach the binding. This module
 * keeps the no-arg API working by reading `Astro.locals` out of a thread-local
 * that `src/middleware.ts` populates for every request.
 *
 * Pages and components keep calling `await getSite()` etc. without changes.
 */
import * as db from "./db";

/** Minimal subset of Astro's `Locals` that the store needs. */
type LocalsLike = { platform: import("./platform").PlatformEnv; runtime?: { env?: unknown } };

let _locals: LocalsLike | null = null;

/** Called from middleware at the top of every request. */
export function setRequestLocals(locals: LocalsLike) {
  _locals = locals;
}
function l(): LocalsLike {
  if (!_locals) throw new Error("setRequestLocals() was not called for this request");
  return _locals;
}

// Re-export the DB getters with the no-arg, request-scoped form. The shape
// passed to db.getX() satisfies the `{ runtime?: { env?: unknown } }`
// parameter type because the db helpers extract the platform from
// `locals.runtime.env` via getPlatform().
export const getSite                 = () => db.getSite(l());
export const getHero                 = () => db.getHero(l());
export const getContact              = () => db.getContact(l());
export const getHours                = () => db.getHours(l());
export const getSpecialHours         = () => db.getSpecialHours(l());
export const getSocial               = () => db.getSocial(l());
export const getAnnouncements        = () => db.getAnnouncements(l());
export const getOffers               = () => db.getOffers(l());
export const getTreatments           = (onlyPublished = true) => db.getTreatments(onlyPublished, l());
export const getTeam                 = () => db.getTeam(l());
export const getGallery              = () => db.getGallery(l());
export const getBeforeAfter          = () => db.getBeforeAfter(l());
export const getTestimonials         = () => db.getTestimonials(l());
export const getArticles             = (onlyPublished = true) => db.getArticles(onlyPublished, l());
export const getFaqs                 = () => db.getFaqs(l());