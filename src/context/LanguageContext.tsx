"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { en } from "@/locales/en";
import { ar } from "@/locales/ar";

export type Locale = "en" | "ar";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  isRTL: boolean;
  t: (path: string, params?: Record<string, string | number>) => string;
}

const dictionaries: Record<Locale, any> = { en, ar };

const LanguageContext = createContext<LanguageContextType>({
  locale: "en",
  setLocale: () => {},
  toggleLocale: () => {},
  isRTL: false,
  t: (path: string) => path,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    // Read persisted preference
    const saved = localStorage.getItem("agrisat_locale") as Locale | null;
    if (saved === "en" || saved === "ar") {
      setLocaleState(saved);
      document.documentElement.lang = saved;
      document.documentElement.dir = saved === "ar" ? "rtl" : "ltr";
    } else {
      document.documentElement.lang = "en";
      document.documentElement.dir = "ltr";
    }
    setMounted(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("agrisat_locale", newLocale);
      document.documentElement.lang = newLocale;
      document.documentElement.dir = newLocale === "ar" ? "rtl" : "ltr";
    } catch (e) {
      console.warn("Could not save locale to localStorage:", e);
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "en" ? "ar" : "en");
  }, [locale, setLocale]);

  const isRTL = locale === "ar";

  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      const keys = path.split(".");
      
      // Look up in current locale
      let currentVal: any = dictionaries[locale];
      for (const k of keys) {
        if (currentVal && typeof currentVal === "object" && k in currentVal) {
          currentVal = currentVal[k];
        } else {
          currentVal = undefined;
          break;
        }
      }

      // Fallback to English if not found
      if (typeof currentVal !== "string") {
        let fallbackVal: any = dictionaries.en;
        for (const k of keys) {
          if (fallbackVal && typeof fallbackVal === "object" && k in fallbackVal) {
            fallbackVal = fallbackVal[k];
          } else {
            fallbackVal = undefined;
            break;
          }
        }
        if (typeof fallbackVal === "string") {
          currentVal = fallbackVal;
        } else {
          return path;
        }
      }

      // Variable interpolation
      let res = currentVal as string;
      if (params) {
        Object.entries(params).forEach(([paramKey, paramVal]) => {
          res = res.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal));
        });
      }
      return res;
    },
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      isRTL,
      t,
    }),
    [locale, setLocale, toggleLocale, isRTL, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
