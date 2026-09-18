"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type GlobalLanguage = "en" | "te" | "hi";

type LanguageContextType = {
  language: GlobalLanguage;
  setLanguage: (language: GlobalLanguage) => void;
};

const LanguageContext =
  createContext<LanguageContextType | undefined>(
    undefined
  );

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguage] =
    useState<GlobalLanguage>("en");

  useEffect(() => {
    const saved =
      localStorage.getItem("accessview-ui-language");

    if (
      saved === "en" ||
      saved === "te" ||
      saved === "hi"
    ) {
      setLanguage(saved);
    }
  }, []);

  const changeLanguage = (
    newLanguage: GlobalLanguage
  ) => {
    setLanguage(newLanguage);

    localStorage.setItem(
      "accessview-ui-language",
      newLanguage
    );
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: changeLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}