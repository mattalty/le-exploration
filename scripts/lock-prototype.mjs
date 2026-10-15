// Password-protect a prototype:  npm run lock <slug>
// Remove the lock:               npm run lock <slug> -- --remove
// Writes a salted PBKDF2 hash to locks.json (read by the Worker). Deploy to apply.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const remove = args.includes("--remove");
const root = join(import.meta.dirname, "..");
const locksPath = join(root, "locks.json");
const locks = JSON.parse(readFileSync(locksPath, "utf8"));

if (!slug) {
  console.log("Locked prototypes:", Object.keys(locks).join(", ") || "(none)");
  console.log("Usage: npm run lock <slug>   |   npm run lock <slug> -- --remove");
  process.exit(0);
}
if (!existsSync(join(root, "src", "prototypes", slug))) {
  console.error(`No prototype at src/prototypes/${slug}`);
  process.exit(1);
}

if (remove) {
  delete locks[slug];
  writeFileSync(locksPath, JSON.stringify(locks, null, 2) + "\n");
  console.log(`Unlocked ${slug}. Deploy to apply.`);
  process.exit(0);
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  // Hide typed characters.
  rl._writeToOutput = (s) => rl.output.write(s.includes(question) ? s : "");
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    }),
  );
}

const password = process.env.PROTOTYPE_PASSWORD ?? (await ask(`Password for ${slug}: `));
if (!password) {
  console.error("Password can't be empty");
  process.exit(1);
}

const iterations = 100_000; // Workers' PBKDF2 maximum
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
const hex = (b) => Buffer.from(b).toString("hex");

locks[slug] = { salt: hex(salt), hash: hex(bits), iterations };
writeFileSync(locksPath, JSON.stringify(locks, null, 2) + "\n");
console.log(`Locked ${slug}. Deploy (or push to main) to apply.`);
