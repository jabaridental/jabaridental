import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stockDir = path.join(root, "public", "images", "stock");
const backupDir = path.join(stockDir, "_originals");

const MAX_DIM = 1600;
const QUALITY = 80;

await fs.mkdir(backupDir, { recursive: true });
const files = (await fs.readdir(stockDir)).filter((f) => /\.jpg$/i.test(f));

let totalBefore = 0;
let totalAfter = 0;

for (const file of files) {
  const srcPath = path.join(stockDir, file);
  const buf = await fs.readFile(srcPath);
  totalBefore += buf.length;

  // back up original (no deletion)
  await fs.writeFile(path.join(backupDir, file), buf);

  const optimized = await sharp(buf)
    .rotate()
    .resize({ width: MAX_DIM, height: MAX_DIM, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true });

  const out = await optimized.toBuffer();
  await fs.writeFile(srcPath, out);
  totalAfter += out.length;

  console.log(
    `${file.padEnd(24)} ${(buf.length / 1e6).toFixed(2)}MB -> ${(out.length / 1e6).toFixed(2)}MB`
  );
}

console.log(
  `\nTotal: ${(totalBefore / 1e6).toFixed(1)}MB -> ${(totalAfter / 1e6).toFixed(1)}MB ` +
    `(saved ${Math.round((1 - totalAfter / totalBefore) * 100)}%)`
);
console.log(`Originals backed up to: ${backupDir}`);
