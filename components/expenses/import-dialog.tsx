"use client";

import { useState, useRef } from "react";
import { useAccounts } from "@/hooks/use-accounts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export function ImportDialog({ onImported }: { onImported?: () => void }) {
  const { accounts } = useAccounts();
  const [open, setOpen]           = useState(false);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [file, setFile]           = useState<File | null>(null);
  const [status, setStatus]       = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [result, setResult]       = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg]   = useState("");
  const fileRef                   = useRef<HTMLInputElement>(null);

  function reset() {
    setFile(null);
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setStatus("uploading");

    const form = new FormData();
    form.append("file", file);
    if (accountId !== null) form.append("account_id", String(accountId));

    try {
      const res  = await fetch("/api/import", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unbekannter Fehler");
      setResult(data);
      setStatus("done");
      onImported?.();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Fehler");
      setStatus("error");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <button className={cn(
          "flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-800",
          "text-[13px] text-stone-500 hover:text-stone-300 hover:border-stone-700 transition-colors"
        )}>
          <Upload className="w-3.5 h-3.5" />
          Import
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-[#0f0e0a] border-stone-800">
        <DialogHeader>
          <DialogTitle className="text-stone-200 text-[15px] font-medium">
            CSV importieren
          </DialogTitle>
        </DialogHeader>

        {status === "done" && result ? (
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3 rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[13px] text-emerald-300 font-medium">Import abgeschlossen</p>
                <p className="text-[12px] text-stone-500 mt-1">
                  {result.imported} importiert
                  {result.skipped > 0 && `, ${result.skipped} übersprungen (Duplikate)`}
                </p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-3">
                <p className="text-[11px] text-amber-400 font-medium mb-1.5">
                  {result.errors.length} Fehler
                </p>
                <ul className="space-y-0.5">
                  {result.errors.slice(0, 5).map((e, i) => (
                    <li key={i} className="text-[11px] text-stone-500 truncate">{e}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={() => setOpen(false)}
              className="w-full py-2.5 rounded-lg border border-stone-800 text-stone-400 text-[13px] hover:border-stone-700 hover:text-stone-300 transition-colors"
            >
              Schließen
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-2">
                Konto
              </p>
              {accounts.length === 0 ? (
                <p className="text-[12px] text-stone-600">
                  Keine Konten vorhanden. Bitte zuerst ein Konto anlegen.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {accounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setAccountId(acc.id)}
                      className="px-3 py-1.5 rounded-lg border text-[12px] transition-colors"
                      style={
                        accountId === acc.id
                          ? { borderColor: `${acc.color}60`, backgroundColor: `${acc.color}10`, color: acc.color }
                          : { borderColor: "#292524", color: "#78716c" }
                      }
                    >
                      {acc.icon} {acc.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.1em] text-stone-500 mb-2">
                CSV-Datei (Sparkasse)
              </label>
              <label
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed",
                  "py-8 cursor-pointer transition-colors",
                  file
                    ? "border-amber-800/60 bg-amber-950/10"
                    : "border-stone-800 hover:border-stone-700"
                )}
              >
                <Upload className={cn("w-5 h-5", file ? "text-amber-400" : "text-stone-600")} />
                <span className="text-[12px] text-stone-500 text-center px-4">
                  {file ? file.name : "Datei auswählen oder hier ablegen"}
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="sr-only"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            {status === "error" && (
              <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-3">
                <p className="text-[13px] text-red-400">{errorMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || accountId === null || status === "uploading"}
              className={cn(
                "w-full py-2.5 rounded-lg border text-[13px] font-medium",
                "flex items-center justify-center gap-2 transition-all",
                !file || accountId === null || status === "uploading"
                  ? "border-stone-800 text-stone-600 cursor-not-allowed"
                  : "border-amber-800/50 bg-amber-950/30 text-amber-400 hover:bg-amber-950/50"
              )}
            >
              {status === "uploading" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importiere…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Importieren
                </>
              )}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
