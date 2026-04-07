"use client";

import { useEffect, useState } from "react";
import { SetupDialog } from "./setup-dialog";

export function SetupGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "needs-setup" | "ready">("loading");

  useEffect(() => {
    fetch("/api/users/setup-status")
      .then((r) => r.json())
      .then((data) => setStatus(data.hasUsers ? "ready" : "needs-setup"))
      .catch(() => setStatus("ready")); // fail open
  }, []);

  return (
    <>
      {status === "needs-setup" && (
        <SetupDialog onComplete={() => setStatus("ready")} />
      )}
      {children}
    </>
  );
}
