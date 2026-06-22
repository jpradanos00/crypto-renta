import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { I18nProvider } from "@/lib/i18n/context";

function AllProviders({ children }: { children: React.ReactNode }) {
  return <I18nProvider defaultLocale="es">{children}</I18nProvider>;
}

function customRender(ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from "@testing-library/react";
export { customRender as render };
