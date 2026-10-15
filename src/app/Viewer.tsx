import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import QRCode from "qrcode";
import { Check, ChevronLeft, Copy, ExternalLink, Moon, RotateCcw, Share, Smartphone, Square, Sun } from "lucide-react";
import { DeviceFrame, useIsPhone } from "@/kit";
import { getPrototype } from "./registry";

/**
 * The Worker gates full page loads, but in-app navigation never reaches it,
 * so double-check access before rendering a locked prototype.
 */
function useAccess(slug: string) {
  const navigate = useNavigate();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    setOk(false);
    fetch(`/api/access?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : { unlocked: true }))
      .catch(() => ({ unlocked: true }))
      .then((a: { unlocked: boolean }) => {
        if (a.unlocked) setOk(true);
        else navigate(`/unlock/${slug}?next=${encodeURIComponent(window.location.pathname + window.location.search)}`, { replace: true });
      });
  }, [slug, navigate]);
  return ok;
}

function useSystemDark() {
  const [dark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  return dark;
}

/**
 * /p/:slug    toolbar + device on desktop, full-screen on phones
 * /embed/:slug device only (for embedding in Figma, Notion, slides)
 * Query: ?theme=dark|light  ?frame=0
 */
export function Viewer({ embed = false }: { embed?: boolean }) {
  const { slug = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const isPhone = useIsPhone();
  const systemDark = useSystemDark();
  const [restartKey, setRestartKey] = useState(0);
  const allowed = useAccess(slug);

  const entry = getPrototype(slug);
  const Prototype = useMemo(() => (entry ? lazy(entry.load) : null), [entry]);

  const theme = (params.get("theme") as "light" | "dark" | null) ?? (systemDark ? "dark" : "light");
  const framed = params.get("frame") !== "0";
  const setParam = (key: string, value: string | null) =>
    setParams(
      (p) => {
        if (value === null) p.delete(key);
        else p.set(key, value);
        return p;
      },
      { replace: true },
    );

  useEffect(() => {
    if (entry) document.title = `${entry.meta.title} · Exploration`;
  }, [entry]);

  if (!entry || !Prototype) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-lg font-semibold">No prototype called “{slug}”</p>
        <Link to="/" className="text-[15px] text-[#0a84ff]">
          Back to gallery
        </Link>
      </div>
    );
  }

  const device = (
    <DeviceFrame key={restartKey} theme={theme} mode={isPhone ? "fullscreen" : framed ? "frame" : "bare"}>
      <Suspense fallback={null}>{allowed && <Prototype />}</Suspense>
    </DeviceFrame>
  );

  if (isPhone || embed) return <div className="h-full">{device}</div>;

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[var(--pg-border)] bg-[var(--pg-surface)] px-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link to="/" className="flex size-9 items-center justify-center rounded-lg hover:bg-[var(--pg-bg)]" aria-label="Gallery">
            <ChevronLeft size={20} />
          </Link>
          <div className="min-w-0">
            <div className="truncate text-[14px] font-semibold">{entry.meta.title}</div>
            {entry.meta.description && <div className="truncate text-[12px] text-[var(--pg-muted)]">{entry.meta.description}</div>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {entry.meta.figma && (
            <a
              href={entry.meta.figma}
              target="_blank"
              rel="noreferrer"
              className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium hover:bg-[var(--pg-bg)]"
            >
              Figma <ExternalLink size={14} />
            </a>
          )}
          <ToolButton label={theme === "dark" ? "Light mode" : "Dark mode"} onClick={() => setParam("theme", theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </ToolButton>
          <ToolButton label={framed ? "Hide device frame" : "Show device frame"} onClick={() => setParam("frame", framed ? "0" : null)}>
            {framed ? <Smartphone size={18} /> : <Square size={18} />}
          </ToolButton>
          <ToolButton label="Restart prototype" onClick={() => setRestartKey((k) => k + 1)}>
            <RotateCcw size={18} />
          </ToolButton>
          <SharePopover />
        </div>
      </header>
      <main className="min-h-0 flex-1">{device}</main>
    </div>
  );
}

function ToolButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={label} aria-label={label} className="flex size-9 items-center justify-center rounded-lg hover:bg-[var(--pg-bg)]">
      {children}
    </button>
  );
}

function SharePopover() {
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState<string>();
  const [copied, setCopied] = useState(false);
  const url = window.location.href;

  useEffect(() => {
    if (open) QRCode.toDataURL(url, { margin: 1, width: 360 }).then(setQr);
  }, [open, url]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="ml-1 flex h-9 items-center gap-1.5 rounded-lg bg-[#0a84ff] px-3 text-[13px] font-semibold text-white hover:brightness-110"
      >
        <Share size={15} /> Share
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-[260px] rounded-2xl border border-[var(--pg-border)] bg-[var(--pg-surface)] p-4 shadow-2xl">
            <p className="text-[13px] font-semibold">Open on your phone</p>
            <p className="mb-3 text-[12px] text-[var(--pg-muted)]">Scan to try it full-screen.</p>
            {qr && <img src={qr} alt="QR code for this prototype" className="w-full rounded-lg bg-white" />}
            <button
              onClick={() => {
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--pg-bg)] text-[13px] font-medium"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
