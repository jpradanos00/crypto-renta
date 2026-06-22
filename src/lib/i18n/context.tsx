"use client";

import React, { createContext, useContext, useCallback, useEffect } from "react";
import type { Locale } from "./types";
import es from "./es.json";
import en from "./en.json";

const DICTS: Record<Locale, typeof es> = { es, en };

type DotPrefix<T extends string> = T extends "" ? "" : `.${T}`;

type DotNotationKeys<T> = (
  T extends object
    ? {
        [K in Exclude<keyof T, symbol>]: `${K}${DotPrefix<DotNotationKeys<T[K]>>}`;
      }[Exclude<keyof T, symbol>]
    : ""
) extends infer D
  ? Extract<D, string>
  : never;

type TranslationKey = DotNotationKeys<typeof es>;

type TranslationParams = Record<string, string | number>;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "es",
  setLocale: () => {},
  t: (key: string) => key,
});

export function I18nProvider({
  children,
  defaultLocale = "es",
  onLocaleChange,
}: {
  children: React.ReactNode;
  defaultLocale?: Locale;
  onLocaleChange?: (locale: Locale) => void;
}) {
  const [locale, setLocaleState] = React.useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cryptorenta-locale");
      if (stored === "en" || stored === "es") return stored;
    }
    return defaultLocale;
  });

  const setLocale = useCallback((newLocale: Locale) => {
    localStorage.setItem("cryptorenta-locale", newLocale);
    setLocaleState(newLocale);
    onLocaleChange?.(newLocale);
  }, [onLocaleChange]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (key: string, params?: TranslationParams): string => {
      const dict = DICTS[locale];
      const keys = key.split(".");
      let value: unknown = dict;
      for (const k of keys) {
        if (value == null || typeof value !== "object") return key;
        value = (value as Record<string, unknown>)[k];
      }
      if (typeof value !== "string") return key;

      if (params) {
        return value.replace(
          /\{(\w+)\}/g,
          (_, paramKey: string) => String(params[paramKey] ?? `{${paramKey}}`)
        );
      }
      return value;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useT must be used within an I18nProvider");
  }
  return ctx;
}
