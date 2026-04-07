"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className={cn("w-8 h-8", className)} />;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Zum hellen Modus wechseln" : "Zum dunklen Modus wechseln"}
      className={cn(
        "relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group",
        "border hover:scale-105 active:scale-95",
        isDark
          ? "border-stone-800 bg-stone-900/60 text-stone-500 hover:border-amber-800/50 hover:text-amber-400 hover:bg-amber-950/30"
          : "border-stone-300 bg-stone-100/80 text-stone-500 hover:border-amber-400/60 hover:text-amber-600 hover:bg-amber-50",
        className
      )}
    >
      <span className={cn(
        "absolute inset-0 flex items-center justify-center transition-all duration-300",
        isDark ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
      )}>
        <Sun className="w-3.5 h-3.5" />
      </span>
      <span className={cn(
        "absolute inset-0 flex items-center justify-center transition-all duration-300",
        isDark ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"
      )}>
        <Moon className="w-3.5 h-3.5" />
      </span>
    </button>
  );
}
