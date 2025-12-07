import { useMemo } from "react";
import { useLanguage, LanguageCode } from "../store/language";
import en from "./locales/en.json";
import cs from "./locales/cs.json";

type Dictionary = Record<string, string>;
const translations: Record<LanguageCode, Dictionary> = { en, cs };

export function useTranslations() {
  const { language } = useLanguage();

  const t = useMemo(
    () =>
      (key: string, fallback?: string) => {
        const dict = translations[language] || translations.en;
        return dict[key] ?? fallback ?? key;
      },
    [language]
  );

  return { t, language };
}
