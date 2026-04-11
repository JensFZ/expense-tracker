"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronDown, Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDailyMotto } from "@/lib/motd";
import { SetupDialog } from "@/components/users/setup-dialog";

export default function LoginPage() {
  const [status, setStatus] = useState<"loading" | "setup" | "login">("loading");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mottoOpen, setMottoOpen] = useState(true);
  const motto = getDailyMotto();

  // 2FA step
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const totpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/users/setup-status")
      .then((r) => r.json())
      .then((d) => setStatus(d.hasUsers ? "login" : "setup"))
      .catch(() => setStatus("login"));
  }, []);

  useEffect(() => {
    if (pendingToken) totpRef.current?.focus();
  }, [pendingToken]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Anmeldung fehlgeschlagen.");
      } else if (data.totp_required) {
        setPendingToken(data.pendingToken);
        setTotpCode("");
      } else {
        window.location.href = "/";
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleTotpSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/totp/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken, code: totpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Ungültiger Code.");
        setTotpCode("");
        totpRef.current?.focus();
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      setError("Verbindungsfehler. Bitte erneut versuchen.");
      console.error("TOTP login error:", err);
    } finally {
      setLoading(false);
    }
  }

  const gridBg = (
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(251,191,36,1) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,1) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    />
  );

  if (status === "loading") {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0a0905]">
        <div className="w-6 h-6 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
      </div>
    );
  }

  if (status === "setup") {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0a0905]">
        {gridBg}
        <SetupDialog onComplete={() => setStatus("login")} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0a0905]">
      {gridBg}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center mb-4">
            {pendingToken
              ? <ShieldCheck className="w-6 h-6 text-amber-400" />
              : <span className="text-amber-400 text-2xl leading-none font-numbers">€</span>
            }
          </div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-stone-500">
            Ausgaben<span className="text-amber-500/80">·</span>Tracker
          </p>
        </div>

        <div className="rounded-xl border border-stone-800 bg-stone-950/80 backdrop-blur-sm p-7 shadow-2xl">
          {pendingToken ? (
            <>
              <h1 className="font-display text-2xl text-stone-100 mb-1">Zwei-Faktor-Auth</h1>
              <p className="text-stone-500 text-[13px] mb-6">
                Gib den 6-stelligen Code aus deiner Authenticator-App ein.
              </p>
              <form onSubmit={handleTotpSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="totp-code">Authentifizierungscode</Label>
                  <Input
                    id="totp-code"
                    ref={totpRef}
                    value={totpCode}
                    onChange={(e) => { setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(null); }}
                    placeholder="000000"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="text-center text-xl tracking-[0.4em] font-numbers"
                    maxLength={6}
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">{error}</p>
                )}
                <Button type="submit" className="w-full gap-2" disabled={loading || totpCode.length !== 6}>
                  {loading ? "Prüfen…" : <><ShieldCheck className="w-4 h-4" />Bestätigen</>}
                </Button>
                <button
                  type="button"
                  onClick={() => { setPendingToken(null); setError(null); }}
                  className="w-full text-center text-[12px] text-stone-600 hover:text-stone-400 transition-colors"
                >
                  Zurück zur Anmeldung
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl text-stone-100 mb-1">Willkommen zurück</h1>
              <p className="text-stone-500 text-[13px] mb-6">Melde dich an, um fortzufahren.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="username">Benutzername</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(null); }}
                    placeholder="Benutzername eingeben"
                    autoComplete="username"
                    autoFocus
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Passwort</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(null); }}
                      placeholder="Passwort eingeben"
                      autoComplete="current-password"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {error && (
                  <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">{error}</p>
                )}
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? "Anmelden…" : <><LogIn className="w-4 h-4" />Anmelden</>}
                </Button>
              </form>
            </>
          )}
        </div>

        {/* Motto des Tages */}
        <div className="mt-4 border-l-2 border-amber-700/30 rounded-r-md bg-stone-950/50 backdrop-blur-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setMottoOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left"
          >
            <p className="text-[10px] uppercase tracking-[0.12em] text-amber-700/60">Motto des Tages</p>
            <ChevronDown className={cn("w-3 h-3 text-amber-700/40 transition-transform duration-200", mottoOpen && "rotate-180")} />
          </button>
          {mottoOpen && (
            <div className="px-4 pb-3">
              <p className="text-stone-400 text-[13px] leading-snug italic">&bdquo;{motto.text}&ldquo;</p>
              <p className="text-stone-600 text-[11px] mt-1.5">— {motto.author}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
