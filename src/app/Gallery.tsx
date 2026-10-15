import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Lock, PenTool } from "lucide-react";
import { prototypes } from "./registry";

/** Slugs locked via `npm run lock`, as reported by the Worker. */
export function useLockedSlugs() {
  const [locked, setLocked] = useState<string[]>([]);
  useEffect(() => {
    fetch("/api/locks")
      .then((r) => (r.ok ? r.json() : []))
      .then(setLocked)
      .catch(() => setLocked([]));
  }, []);
  return locked;
}

function hue(slug: string) {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export function Gallery() {
  const locked = useLockedSlugs();
  // Locked prototypes stay out of the public gallery; you see them while developing locally.
  const visible = prototypes.filter((p) => import.meta.env.DEV || !locked.includes(p.slug));

  return (
    <div className="min-h-full px-5 py-10 sm:px-10">
      <header className="mx-auto mb-10 flex max-w-6xl items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Exploration</h1>
          <p className="mt-1 text-[15px] text-[var(--pg-muted)]">App prototypes · {visible.length} total</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-6">
        {visible.map((p) => {
          const h = hue(p.slug);
          const isLocked = locked.includes(p.slug);
          return (
            <Link
              key={p.slug}
              to={`/p/${p.slug}`}
              className="group overflow-hidden rounded-2xl border border-[var(--pg-border)] bg-[var(--pg-surface)] transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div
                className="relative flex aspect-[4/3] items-end justify-center overflow-hidden"
                style={{
                  background: p.meta.cover?.startsWith("/")
                    ? `center / cover url(${p.meta.cover})`
                    : (p.meta.cover ?? `linear-gradient(135deg, hsl(${h} 80% 62%), hsl(${(h + 50) % 360} 85% 52%))`),
                }}
              >
                {!p.meta.cover && (
                  <div className="h-[78%] w-[42%] translate-y-[12%] rounded-t-[22px] border-[5px] border-b-0 border-black/80 bg-white/30 backdrop-blur transition group-hover:translate-y-[8%]" />
                )}
                <div className="absolute right-3 top-3 flex gap-1.5">
                  {p.meta.figma && (
                    <span className="flex size-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur">
                      <PenTool size={14} />
                    </span>
                  )}
                  {isLocked && (
                    <span className="flex size-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur">
                      <Lock size={14} />
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="truncate font-semibold">{p.meta.title}</h2>
                  {p.meta.status && (
                    <span className="shrink-0 rounded-full border border-[var(--pg-border)] px-2 py-0.5 text-[11px] font-medium capitalize text-[var(--pg-muted)]">
                      {p.meta.status}
                    </span>
                  )}
                </div>
                {p.meta.description && <p className="mt-1 line-clamp-2 text-[13px] text-[var(--pg-muted)]">{p.meta.description}</p>}
                {p.meta.tags && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.meta.tags.map((t) => (
                      <span key={t} className="rounded-md bg-[var(--pg-bg)] px-1.5 py-0.5 text-[11px] text-[var(--pg-muted)]">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
