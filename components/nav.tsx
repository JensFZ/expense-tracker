"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, PlusCircle, List, Settings, Repeat, Landmark, Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/",          label: "Übersicht",   icon: LayoutDashboard, mobileVisible: true  },
  { href: "/add",       label: "Neu",         icon: PlusCircle,      mobileVisible: true  },
  { href: "/expenses",  label: "Ausgaben",    icon: List,            mobileVisible: true  },
  { href: "/recurring", label: "Regelmäßig",  icon: Repeat,          mobileVisible: true  },
  { href: "/accounts",  label: "Konten",      icon: Landmark,        mobileVisible: true  },
  { href: "/settings",  label: "Kategorien",  icon: Settings,        mobileVisible: true  },
  { href: "/users",     label: "Benutzer",    icon: Users,           mobileVisible: true  },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setUsername(d.user?.username ?? null))
      .catch(() => {});
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* ── Desktop top bar ── */}
      <header className="sticky top-0 z-50 w-full hidden sm:block">
        <div className="h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        <div className="nav-header border-b nav-border">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between h-14">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-7 h-7 rounded-md bg-amber-500/15 border border-amber-500/25 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <span className="text-amber-400 text-sm leading-none font-numbers">€</span>
                </div>
                <span className="text-[13px] font-medium tracking-[0.06em] uppercase text-stone-400 group-hover:text-stone-300 transition-colors">
                  Ausgaben<span className="text-amber-500/80">·</span>Tracker
                </span>
              </Link>
              <div className="flex items-center gap-1">
                <nav className="flex items-center">
                  {navItems.map(({ href, label }) => {
                    const isActive = pathname === href;
                    return (
                      <Link key={href} href={href}
                        className={cn(
                          "relative px-4 py-1.5 text-[13px] tracking-wide transition-colors duration-200",
                          isActive ? "text-amber-400" : "text-stone-500 hover:text-stone-300"
                        )}>
                        {label}
                        {isActive && <span className="absolute bottom-0 left-3 right-3 h-px bg-amber-500/60 rounded-full" />}
                      </Link>
                    );
                  })}
                </nav>
                <div className="w-px h-5 bg-stone-800 mx-2" />
                <ThemeToggle />
                {username && (
                  <>
                    <div className="w-px h-5 bg-stone-800 mx-2" />
                    <span className="text-[12px] text-stone-500 tracking-wide hidden lg:block">
                      {username}
                    </span>
                    <button
                      onClick={handleLogout}
                      title="Abmelden"
                      className="ml-1 p-1.5 rounded-md text-stone-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile top bar ── */}
      <header className="sticky top-0 z-50 w-full sm:hidden">
        <div className="h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        <div className="nav-header border-b nav-border">
          <div className="flex items-center justify-between h-14 px-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                <span className="text-amber-400 text-sm leading-none font-numbers">€</span>
              </div>
              <span className="text-[13px] font-medium tracking-[0.06em] uppercase text-stone-400">
                Ausgaben<span className="text-amber-500/80">·</span>Tracker
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-stone-500 tracking-wide">
                {navItems.find((n) => n.href === pathname)?.label ?? ""}
              </span>
              <ThemeToggle />
              {username && (
                <button
                  onClick={handleLogout}
                  title="Abmelden"
                  className="p-1.5 rounded-md text-stone-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 mobile-tab-bar">
        <div className="flex items-stretch">
          {navItems.filter((n) => n.mobileVisible).map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            const isAdd    = href === "/add";
            return (
              <Link key={href} href={href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 transition-colors duration-200 tap-target relative",
                  isActive
                    ? isAdd ? "text-emerald-400" : "text-amber-400"
                    : "text-stone-600 active:text-stone-400"
                )}>
                {isAdd ? (
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
                    isActive
                      ? "bg-emerald-500/20 border border-emerald-500/30"
                      : "bg-stone-800/80 border border-stone-700/50 active:scale-95"
                  )}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                ) : (
                  <Icon className={cn("w-[18px] h-[18px] transition-transform duration-200", isActive && "scale-110")} />
                )}
                <span className={cn(
                  "text-[9px] tracking-wide transition-colors leading-tight",
                  isActive ? (isAdd ? "text-emerald-400" : "text-amber-400") : "text-stone-600"
                )}>
                  {label}
                </span>
                {isActive && !isAdd && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-amber-500/60" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
