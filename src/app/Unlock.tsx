import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { Lock } from "lucide-react";
import { getPrototype } from "./registry";

/** Password prompt for prototypes locked with `npm run lock`. The Worker redirects here. */
export function Unlock() {
  const { slug = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const title = getPrototype(slug)?.meta.title ?? slug;
  const next = params.get("next");
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : `/p/${slug}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const res = await fetch("/api/unlock", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, password }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      // Full navigation so the Worker sees the new cookie.
      window.location.assign(target);
    } else {
      setError(true);
    }
  };

  return (
    <div className="flex h-full items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-[340px] rounded-3xl border border-[var(--pg-border)] bg-[var(--pg-surface)] p-7 text-center shadow-xl">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[var(--pg-bg)]">
          <Lock size={20} />
        </div>
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="mt-1 text-[14px] text-[var(--pg-muted)]">This prototype is password protected.</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          aria-invalid={error}
          className={`mt-5 h-11 w-full rounded-xl border bg-[var(--pg-bg)] px-3 text-[15px] outline-none focus:border-[#0a84ff] ${error ? "border-red-500" : "border-transparent"}`}
        />
        {error && <p className="mt-2 text-[13px] text-red-500">That password didn’t work.</p>}
        <button disabled={busy || !password} className="mt-4 h-11 w-full rounded-xl bg-[#0a84ff] text-[15px] font-semibold text-white disabled:opacity-50">
          {busy ? "Checking…" : "Unlock"}
        </button>
        <button type="button" onClick={() => navigate("/")} className="mt-3 text-[13px] text-[var(--pg-muted)]">
          Back to gallery
        </button>
      </form>
    </div>
  );
}
