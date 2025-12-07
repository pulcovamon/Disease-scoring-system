import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

export type LanguageCode = "cs" | "en";

type LanguageContextValue = {
  language: LanguageCode;
  toggleLanguage: () => void;
  setLanguage: (lang: LanguageCode) => void;
  buildPath: (path: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);
const supported: LanguageCode[] = ["cs", "en"];

function getDefaultLanguage(): LanguageCode {
  if (typeof navigator === "undefined") return "en";
  return navigator.language?.toLowerCase().startsWith("cs") ? "cs" : "en";
}

function stripLangPrefix(pathname: string): string {
  const segments = pathname.split("/");
  if (segments.length > 1 && supported.includes(segments[1] as LanguageCode)) {
    const rest = segments.slice(2).join("/");
    return `/${rest}`.replace(/\/+$/, "") || "/";
  }
  return pathname || "/";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ lang?: string }>();

  const langParam = params.lang?.toLowerCase();
  const fallbackLang = getDefaultLanguage();
  const language: LanguageCode = supported.includes(langParam as LanguageCode)
    ? (langParam as LanguageCode)
    : fallbackLang;

  useEffect(() => {
    if (!supported.includes(langParam as LanguageCode)) {
      const rest = stripLangPrefix(location.pathname);
      const suffix = rest === "/" ? "" : rest;
      navigate(`/${fallbackLang}${suffix}${location.search}${location.hash}`, { replace: true });
    }
  }, [fallbackLang, langParam, location.hash, location.pathname, location.search, navigate]);

  const buildPath = useCallback(
    (path: string) => {
      const normalized = path.startsWith("/") ? path : `/${path}`;
      const rest = stripLangPrefix(normalized);
      const suffix = rest === "/" ? "" : rest;
      return `/${language}${suffix}`;
    },
    [language]
  );

  const setLanguage = useCallback(
    (nextLang: LanguageCode) => {
      const rest = stripLangPrefix(location.pathname);
      const suffix = rest === "/" ? "" : rest;
      navigate(`/${nextLang}${suffix}${location.search}${location.hash}`, { replace: true });
    },
    [location.hash, location.pathname, location.search, navigate]
  );

  const value = useMemo(
    () => ({
      language,
      toggleLanguage: () => setLanguage(language === "cs" ? "en" : "cs"),
      setLanguage,
      buildPath,
    }),
    [buildPath, language, setLanguage]
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

export { getDefaultLanguage };
