"use client";

import { useState, useEffect, useCallback } from "react";
import type { AccountWithBalance } from "@/lib/db";

export function useAccounts() {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/accounts");
      setAccounts(await res.json());
    } catch {
      // keep previous state on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { accounts, loading, reload: load };
}
