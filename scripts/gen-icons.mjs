/**
 * Generates the raster favicon from public/icons/favicon.svg.
 *
 * `package.json` already referenced `scripts/gen-icons.mjs` via `npm run gen:icons`
 * but the file did not exist, so the script always failed. This provides it.
 *
 * Produces:
 *   public/favicon.ico        — 32x32, requested by older browsers and some crawlers
 *
 * The existing PNG icons (icon-192, icon-512, apple-touch-icon) are left untouched.
 */
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = resolve(root, "public/icons/favicon.svg");

if (!existsSync(svgPath)) {
  console.error(`Missing ${svgPath}`);
  process.exit(1);
}

const svg = readFileSync(svgPath);

// Render the SVG at high density so the 32px downscale stays crisp.
const png = await sharp(svg, { density: 384 })
  .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

// Minimal single-image ICO container wrapping the PNG payload.
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // image count

const entry = Buffer.alloc(16);
entry[0] = 32; // width
entry[1] = 32; // height
entry[2] = 0; // palette colours (0 = truecolour)
entry[3] = 0; // reserved
entry.writeUInt16LE(1, 4); // colour planes
entry.writeUInt16LE(32, 6); // bits per pixel
entry.writeUInt32LE(png.length, 8); // payload size
entry.writeUInt32LE(header.length + entry.length, 12); // payload offset

const out = resolve(root, "public/favicon.ico");
writeFileSync(out, Buffer.concat([header, entry, png]));
console.log(`Wrote public/favicon.ico (${header.length + entry.length + png.length} bytes)`);
