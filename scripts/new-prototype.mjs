// Scaffold a new prototype:  npm run new "Booking flow"  ->  src/prototypes/booking-flow
import { cpSync, existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const name = process.argv.slice(2).join(" ").trim();
if (!name) {
  console.error('Usage: npm run new "Prototype name"');
  process.exit(1);
}

const slug = name
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");
const title = name.replace(/(^|[\s-])\w/g, (c) => c.toUpperCase()).replace(/-/g, " ");
const root = join(import.meta.dirname, "..", "src", "prototypes");
const dest = join(root, slug);

if (existsSync(dest)) {
  console.error(`src/prototypes/${slug} already exists`);
  process.exit(1);
}

cpSync(join(root, "_template"), dest, { recursive: true });
const today = new Date().toISOString().slice(0, 10);
for (const file of readdirSync(dest)) {
  const path = join(dest, file);
  writeFileSync(
    path,
    readFileSync(path, "utf8").replaceAll("__TITLE__", title).replaceAll("__SLUG__", slug).replaceAll("__DATE__", today),
  );
}

console.log(`Created src/prototypes/${slug}\nOpen http://localhost:5173/p/${slug}`);
