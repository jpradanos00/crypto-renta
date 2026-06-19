"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, Monitor } from "lucide-react";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/calculadora", label: "Calculadora" },
  { href: "/guia", label: "Guía" },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const order: Array<"system" | "light" | "dark"> = ["system", "light", "dark"];
    const nextIndex = (order.indexOf(theme) + 1) % order.length;
    setTheme(order[nextIndex]);
  };

  const getLabel = () => {
    if (theme === "light") return "Modo claro";
    if (theme === "dark") return "Modo oscuro";
    return "Sistema";
  };

  return (
    <button
      onClick={cycleTheme}
      title={`Tema: ${getLabel()}`}
      className="ml-4 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
      aria-label={`Cambiar tema (actual: ${getLabel()})`}
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

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav
      className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4"
      aria-label="Navegación principal"
    >
      <Link
        href="/"
        className="text-lg font-bold tracking-tight focus:outline-none focus:ring-2 focus:ring-ring rounded-md px-1 py-0.5"
      >
        CryptoRenta
      </Link>
      <ul className="flex items-center gap-6">
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
      <ThemeToggle />
    </nav>
  );
}
