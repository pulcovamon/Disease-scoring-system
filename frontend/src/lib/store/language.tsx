import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type LanguageCode = "cs" | "en";

type LanguageContextValue = {
  language: LanguageCode;
  toggleLanguage: () => void;
  setLanguage: (lang: LanguageCode) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function getInitialLanguage(): LanguageCode {
  if (typeof window === "undefined") return "cs";
  const stored = localStorage.getItem("language");
  if (stored === "cs" || stored === "en") return stored;
  return navigator.language?.toLowerCase().startsWith("cs") ? "cs" : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      toggleLanguage: () => setLanguageState((l) => (l === "cs" ? "en" : "cs")),
      setLanguage: (lang: LanguageCode) => setLanguageState(lang),
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
