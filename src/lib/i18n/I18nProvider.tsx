import * as React from "react";
import { translations, type Lang, type TKey } from "./translations";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: TKey) => string;
};

const I18nContext = React.createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>("pt");

  React.useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("jq_lang")) as Lang | null;
    if (saved === "pt" || saved === "en") {
      setLangState(saved);
    } else if (typeof navigator !== "undefined") {
      setLangState(navigator.language.toLowerCase().startsWith("pt") ? "pt" : "en");
    }
  }, []);

  const setLang = React.useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("jq_lang", l);
  }, []);

  const t = React.useCallback((k: TKey) => translations[lang][k] ?? k, [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
