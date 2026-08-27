import sharp from "sharp";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const phDir = path.join(root, "public", "images", "ph");
const iconDir = path.join(root, "public", "icons");
await fs.mkdir(phDir, { recursive: true });
await fs.mkdir(iconDir, { recursive: true });

const IVORY = "#f6f1e8";
const FOREST = "#003C80";
const FOREST_DEEP = "#00264F";
const SAGE = "#3E73B6";
const GOLD = "#b08d57";

// name -> [label, width, height, variant]
const PLACEHOLDERS = {
  "hero": ["JABARI DENTAL — Kampala", 2200, 1480, "hero"],
  "hero-mobile": ["JABARI DENTAL", 1400, 1800, "hero"],
  "treatment-general": ["General Dentistry", 1200, 900, "a"],
  "treatment-cosmetic": ["Cosmetic Dentistry", 1200, 900, "b"],
  "treatment-whitening": ["Teeth Whitening", 1200, 900, "c"],
  "treatment-ortho": ["Orthodontics", 1200, 900, "d"],
  "treatment-implants": ["Dental Implants", 1200, 900, "e"],
  "treatment-kids": ["Children's Dentistry", 1200, 900, "f"],
  "gallery-reception": ["Reception", 1000, 1250, "a"],
  "gallery-room": ["Treatment room", 1000, 1250, "b"],
  "gallery-light": ["Natural light", 1000, 1250, "c"],
  "gallery-smile": ["A confident smile", 1000, 1250, "d"],
  "gallery-detail": ["Precision", 1000, 1250, "e"],
  "gallery-comfort": ["Comfort", 1000, 1250, "f"],
  "article-habits": ["Daily habits", 1280, 840, "a"],
  "article-first": ["First visit", 1280, 840, "b"],
  "article-whitening": ["Whitening", 1280, 840, "c"],
  "og-default": ["JABARI DENTAL", 1200, 630, "og"],
};

function duotone(variant) {
  const sets = {
    hero: [FOREST_DEEP, FOREST, SAGE],
    og: [FOREST_DEEP, FOREST, GOLD],
    a: [FOREST, SAGE, IVORY],
    b: [FOREST_DEEP, FOREST, SAGE],
    c: [FOREST, FOREST_DEEP, GOLD],
    d: [FOREST, SAGE, IVORY],
    e: [FOREST_DEEP, FOREST, SAGE],
    f: [FOREST, FOREST_DEEP, IVORY],
  };
  return sets[variant] || sets.a;
}

function placeholderSvg(name, label, w, h, variant) {
  const [c1, c2, c3] = duotone(variant);
  const id = name.replace(/[^a-z0-9]/gi, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
  <defs>
    <linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="r${id}" cx="0.7" cy="0.3" r="0.9">
      <stop offset="0" stop-color="${c3}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${c3}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g${id})"/>
  <rect width="${w}" height="${h}" fill="url(#r${id})"/>
  <g fill="none" stroke="${IVORY}" stroke-opacity="0.12" stroke-width="1.5">
    ${Array.from({ length: 6 }, (_, i) => `<line x1="0" y1="${(h / 6) * (i + 1)}" x2="${w}" y2="${(h / 6) * (i + 1)}"/>`).join("")}
  </g>
  <g transform="translate(${w / 2}, ${h / 2})" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif">
    <text y="-10" font-size="${Math.round(Math.min(w, h) * 0.07)}" fill="${IVORY}" fill-opacity="0.92" letter-spacing="2">JABARI DENTAL</text>
    <line x1="-${Math.round(Math.min(w, h) * 0.12)}" y1="24" x2="${Math.round(Math.min(w, h) * 0.12)}" y2="24" stroke="${GOLD}" stroke-width="2"/>
    <text y="64" font-size="${Math.round(Math.min(w, h) * 0.035)}" fill="${IVORY}" fill-opacity="0.7" font-style="italic">${label}</text>
  </g>
</svg>`;
}

for (const [name, [label, w, h, variant]] of Object.entries(PLACEHOLDERS)) {
  const svg = placeholderSvg(name, label, w, h, variant);
  await fs.writeFile(path.join(phDir, `${name}.svg`), svg, "utf8");
}

// PWA icon master (square)
function iconSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${FOREST_DEEP}"/>
  <rect x="${size * 0.06}" y="${size * 0.06}" width="${size * 0.88}" height="${size * 0.88}" rx="${size * 0.18}" fill="none" stroke="${GOLD}" stroke-opacity="0.5" stroke-width="${size * 0.012}"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, serif" font-size="${size * 0.52}" fill="${IVORY}">J</text>
  <line x1="${size * 0.32}" y1="${size * 0.74}" x2="${size * 0.68}" y2="${size * 0.74}" stroke="${GOLD}" stroke-width="${size * 0.02}"/>
</svg>`;
}

const master = iconSvg(512);
await sharp(Buffer.from(master)).png().toFile(path.join(iconDir, "icon-512.png"));
await sharp(Buffer.from(master)).resize(192, 192).png().toFile(path.join(iconDir, "icon-192.png"));
await sharp(Buffer.from(master)).resize(180, 180).png().toFile(path.join(iconDir, "apple-touch-icon.png"));
await fs.writeFile(path.join(iconDir, "favicon.svg"), iconSvg(64), "utf8");
await fs.writeFile(path.join(root, "public", "favicon.svg"), iconSvg(64), "utf8");

console.log("Assets generated:", Object.keys(PLACEHOLDERS).length, "placeholders + icons");
