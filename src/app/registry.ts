import type { ComponentType } from "react";

export interface PrototypeMeta {
  title: string;
  description?: string;
  tags?: string[];
  /** Source Figma frame/file, if built from Figma. */
  figma?: string;
  /** Optional cover image path (put it in /public) or CSS background. */
  cover?: string;
  /** Status shown in the gallery. */
  status?: "draft" | "review" | "final";
  /** ISO date, used for gallery sort order. */
  updated?: string;
}

export interface PrototypeEntry {
  slug: string;
  meta: PrototypeMeta;
  load: () => Promise<{ default: ComponentType }>;
}

// Every folder in src/prototypes with a meta.ts + index.tsx is a prototype.
// Folders starting with "_" (like _template) are ignored.
const metas = import.meta.glob<{ default: PrototypeMeta }>(["../prototypes/*/meta.ts", "!../prototypes/_*/**"], {
  eager: true,
});
const modules = import.meta.glob<{ default: ComponentType }>(["../prototypes/*/index.tsx", "!../prototypes/_*/**"]);

const slugOf = (path: string) => path.split("/").at(-2)!;

export const prototypes: PrototypeEntry[] = Object.entries(metas)
  .map(([path, mod]) => {
    const slug = slugOf(path);
    const load = modules[path.replace(/meta\.ts$/, "index.tsx")] as PrototypeEntry["load"] | undefined;
    return load ? { slug, meta: mod.default, load } : null;
  })
  .filter((p): p is PrototypeEntry => !!p)
  .sort((a, b) => (b.meta.updated ?? "").localeCompare(a.meta.updated ?? ""));

export const getPrototype = (slug: string) => prototypes.find((p) => p.slug === slug);
