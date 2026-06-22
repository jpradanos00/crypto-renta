"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { useT } from "@/lib/i18n/context";
import { Sun, Moon, Monitor, Globe, Menu, X } from "lucide-react";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useT();

  const cycleTheme = () => {
    const order: Array<"system" | "light" | "dark"> = ["system", "light", "dark"];
    const nextIndex = (order.indexOf(theme) + 1) % order.length;
    setTheme(order[nextIndex]);
  };

  const getLabel = () => {
    if (theme === "light") return t("nav.themeLight");
    if (theme === "dark") return t("nav.themeDark");
    return t("nav.themeSystem");
  };

  return (
    <button
      onClick={cycleTheme}
      title={t("nav.changeTheme", { theme: getLabel() })}
      className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
      aria-label={t("nav.changeTheme", { theme: getLabel() })}
    >
      {theme === "light" ? (
        <Sun className="h-5 w-5" />
      ) : theme === "dark" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Monitor className="h-5 w-5" />
      )}
    </button>
  );
}

function LangToggle() {
  const { locale, setLocale } = useT();

  const cycleLocale = () => {
    setLocale(locale === "es" ? "en" : "es");
  };

  return (
    <button
      onClick={cycleLocale}
      title={locale === "es" ? "Switch to English" : "Cambiar a español"}
      className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
      aria-label={locale === "es" ? "Switch to English" : "Cambiar a español"}
    >
      <Globe className="h-5 w-5" />
      <span className="ml-1 text-xs font-bold">{locale === "es" ? "ES" : "EN"}</span>
    </button>
  );
}

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useT();

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/calculadora", label: t("nav.calculator") },
    { href: "/guia", label: t("nav.guide") },
  ];

  return (
    <nav
      className="relative mx-auto flex max-w-5xl items-center justify-between px-4 py-3"
      aria-label={t("nav.mainNav")}
    >
      <Link
        href="/"
        className="text-lg font-bold tracking-tight focus:outline-none focus:ring-2 focus:ring-ring rounded-md px-1 py-0.5 shrink-0"
      >
        CryptoRenta
      </Link>

      {/* Desktop links */}
      <ul className="hidden sm:flex items-center gap-4 md:gap-6">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={[
                  "text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-md px-2 py-1",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Desktop toggles */}
      <div className="hidden sm:flex items-center gap-1">
        <LangToggle />
        <ThemeToggle />
      </div>

      {/* Mobile menu button + toggles */}
      <div className="flex sm:hidden items-center gap-1">
        <LangToggle />
        <ThemeToggle />
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label={mobileOpen ? t("common.close") : "Menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 z-40 border-b border-border bg-background/95 backdrop-blur sm:hidden">
          <ul className="flex flex-col px-4 py-4 gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={[
                      "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    ].join(" ")}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </nav>
  );
}
