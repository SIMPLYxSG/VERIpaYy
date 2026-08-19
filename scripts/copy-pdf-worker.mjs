import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(root, "..", "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const destDir = path.join(root, "..", "public");
const dest = path.join(destDir, "pdf.worker.min.mjs");

if (!existsSync(src)) {
  console.warn("pdfjs-dist worker not found, skipping copy:", src);
  process.exit(0);
}

if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log("Copied pdf.worker.min.mjs to public/");
