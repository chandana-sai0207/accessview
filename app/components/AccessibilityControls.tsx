"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations/ui";

type AccessibilitySettings = {
  largeText: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
};

export default function AccessibilityControls() {
  const { language } = useLanguage();
  const t = translations[language];

  const [settings, setSettings] =
    useState<AccessibilitySettings>({
      largeText: false,
      highContrast: false,
      reducedMotion: false,
    });

  useEffect(() => {
    const saved = localStorage.getItem(
      "accessview-accessibility"
    );

    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch {
        // Ignore invalid saved settings
      }
    }
  }, []);

  const updateSetting = (
    key: keyof AccessibilitySettings
  ) => {
    setSettings((current) => {
      const updated = {
        ...current,
        [key]: !current[key],
      };

      localStorage.setItem(
        "accessview-accessibility",
        JSON.stringify(updated)
      );

      return updated;
    });
  };

  return (
    <div className="accessibility-grid">
      <button
        className={`accessibility-card ${
          settings.largeText ? "selected" : ""
        }`}
        onClick={() => updateSetting("largeText")}
      >
        <span className="accessibility-card-icon">
          Aa
        </span>

        <strong>{t.largeText}</strong>

        <small>
          Increase application text size
        </small>
      </button>

      <button
        className={`accessibility-card ${
          settings.highContrast ? "selected" : ""
        }`}
        onClick={() =>
          updateSetting("highContrast")
        }
      >
        <span className="accessibility-card-icon">
          ◐
        </span>

        <strong>{t.highContrast}</strong>

        <small>
          Improve visual contrast
        </small>
      </button>

      <button
        className={`accessibility-card ${
          settings.reducedMotion ? "selected" : ""
        }`}
        onClick={() =>
          updateSetting("reducedMotion")
        }
      >
        <span className="accessibility-card-icon">
          ◌
        </span>

        <strong>{t.reducedMotion}</strong>

        <small>
          Reduce visual movement
        </small>
      </button>
    </div>
  );
}