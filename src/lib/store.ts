import { promises as fs } from "node:fs";
import path from "node:path";
import { SEED } from "../data/seed";
import type {
  ContentMap,
  Treatment,
  Article,
  GalleryItem,
  TeamMember,
  Testimonial,
  BeforeAfterCase,
  Faq,
  Announcement,
  Offer,
  SocialLink,
  SpecialHours,
  DayHours,
  SiteSettings,
  Hero,
  ContactSettings,
} from "./types";

export type CollectionKey = keyof ContentMap;

const SINGLE: Array<"site" | "hero" | "contact"> = ["site", "hero", "contact"];

function dataDir(): string {
  return path.join(process.cwd(), "data");
}

async function ensureDir() {
  await fs.mkdir(dataDir(), { recursive: true });
}

async function fileFor(key: string): Promise<string> {
  return path.join(dataDir(), `${key}.json`);
}

export async function readRaw<K extends CollectionKey>(key: K): Promise<ContentMap[K]> {
  await ensureDir();
  const file = await fileFor(key);
  try {
    const txt = await fs.readFile(file, "utf8");
    return JSON.parse(txt) as ContentMap[K];
  } catch {
    const seedVal = SEED[key];
    // On read-only filesystems (e.g. Cloudflare edge) writing fails — fall back to seed.
    try {
      await fs.writeFile(file, JSON.stringify(seedVal, null, 2), "utf8");
    } catch {
      /* ignore — no persistent disk */
    }
    return seedVal as ContentMap[K];
  }
}

export async function writeRaw<K extends CollectionKey>(key: K, value: ContentMap[K]): Promise<void> {
  await ensureDir();
  const file = await fileFor(key);
  await fs.writeFile(file, JSON.stringify(value, null, 2), "utf8");
}

// ---------- Public getters (filtered) ----------

export async function getSite(): Promise<SiteSettings> {
  return readRaw("site");
}
export async function getHero(): Promise<Hero> {
  return readRaw("hero");
}
export async function getContact(): Promise<ContactSettings> {
  return readRaw("contact");
}
export async function getHours(): Promise<DayHours[]> {
  return readRaw("hours");
}
export async function getSpecialHours(): Promise<SpecialHours[]> {
  return readRaw("specialHours");
}
export async function getSocial(): Promise<SocialLink[]> {
  const s = await readRaw("social");
  return s.filter((x) => x.published).sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const list = await readRaw("announcements");
  const today = new Date().toISOString().slice(0, 10);
  return list
    .filter((a) => a.published && a.startDate <= today && a.endDate >= today)
    .sort((a, b) => (a.priority === "high" ? -1 : 1) - (b.priority === "high" ? -1 : 1));
}

export async function getOffers(): Promise<Offer[]> {
  const list = await readRaw("offers");
  const today = new Date().toISOString().slice(0, 10);
  return list
    .filter((o) => o.active && o.validFrom <= today && o.validUntil >= today)
    .sort((a, b) => Number(b.featured) - Number(a.featured));
}

export async function getTreatments(onlyPublished = true): Promise<Treatment[]> {
  const list = await readRaw("treatments");
  const out = onlyPublished ? list.filter((t) => t.published && t.active) : list;
  return out.sort((a, b) => a.displayOrder - b.displayOrder);
}
export async function getTreatment(slug: string): Promise<Treatment | undefined> {
  const list = await readRaw("treatments");
  return list.find((t) => t.slug === slug && t.published && t.active);
}

export async function getTeam(): Promise<TeamMember[]> {
  const list = await readRaw("team");
  return list.filter((t) => t.published).sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function getGallery(): Promise<GalleryItem[]> {
  const list = await readRaw("gallery");
  return list
    .filter((g) => g.published)
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.displayOrder - b.displayOrder);
}

export async function getBeforeAfter(): Promise<BeforeAfterCase[]> {
  const list = await readRaw("beforeAfter");
  return list
    .filter((c) => c.published && c.approval === "approved" && c.consent)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const list = await readRaw("testimonials");
  return list
    .filter((t) => t.published && t.approved)
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.displayOrder - b.displayOrder);
}

export async function getArticles(onlyPublished = true): Promise<Article[]> {
  const list = await readRaw("articles");
  const out = onlyPublished ? list.filter((a) => a.published) : list;
  return out.sort(
    (a, b) => Number(b.featured) - Number(a.featured) ||
      (b.publishedDate < a.publishedDate ? -1 : 1)
  );
}
export async function getArticle(slug: string): Promise<Article | undefined> {
  const list = await readRaw("articles");
  return list.find((a) => a.slug === slug && a.published);
}

export async function getFaqs(): Promise<Faq[]> {
  const list = await readRaw("faqs");
  return list.filter((f) => f.published).sort((a, b) => a.displayOrder - b.displayOrder);
}

// ---------- Generic CRUD (admin) ----------

export async function listCollection<K extends CollectionKey>(
  key: K
): Promise<ContentMap[K] extends Array<unknown> ? any[] : any> {
  return readRaw(key as any) as any;
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function sortByOrder<T extends { displayOrder?: number }>(arr: T[]): T[] {
  return arr.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

export async function createItem(key: CollectionKey, body: any): Promise<any> {
  if (SINGLE.includes(key as any)) {
    const value = { ...(await readRaw(key as any)), ...sanitize(body) };
    await writeRaw(key as any, value);
    return value;
  }
  const list = (await readRaw(key as any)) as any[];
  const item = {
    id: newId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    published: body.published ?? true,
    displayOrder: body.displayOrder ?? list.length + 1,
    ...sanitize(body),
  };
  list.push(item);
  await writeRaw(key as any, sortByOrder(list) as any);
  return item;
}

export async function updateItem(key: CollectionKey, id: string, body: any): Promise<any> {
  if (SINGLE.includes(key as any)) {
    const value = { ...(await readRaw(key as any)), ...sanitize(body) };
    await writeRaw(key as any, value);
    return value;
  }
  const list = (await readRaw(key as any)) as any[];
  const idx = list.findIndex((x) => x.id === id);
  if (idx === -1) return undefined;
  list[idx] = { ...list[idx], ...sanitize(body), id, updatedAt: new Date().toISOString() };
  await writeRaw(key as any, list as any);
  return list[idx];
}

export async function deleteItem(key: CollectionKey, id: string): Promise<boolean> {
  if (SINGLE.includes(key as any)) return false;
  const list = (await readRaw(key as any)) as any[];
  const next = list.filter((x) => x.id !== id);
  if (next.length === list.length) return false;
  await writeRaw(key as any, next as any);
  return true;
}

export async function reorderItem(key: CollectionKey, id: string, dir: "up" | "down"): Promise<boolean> {
  if (SINGLE.includes(key as any)) return false;
  const list = (await readRaw(key as any)) as any[];
  const idx = list.findIndex((x) => x.id === id);
  if (idx === -1) return false;
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= list.length) return false;
  const a = list[idx].displayOrder ?? idx;
  const b = list[swap].displayOrder ?? swap;
  [list[idx].displayOrder, list[swap].displayOrder] = [b, a];
  await writeRaw(key as any, sortByOrder(list) as any);
  return true;
}

// Strip obviously dangerous keys; keep it simple. Never allow prototype pollution.
function sanitize<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: any = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (k === "__proto__" || k === "constructor" || k === "prototype") continue;
    out[k] = v;
  }
  return out;
}
