"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import AccessibilityControls from "../components/AccessibilityControls";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations/ui";

type Theme = "light" | "dark" | "system";

export default function SettingsPage() {
  const { language } = useLanguage();
  const t = translations[language];

  const [theme, setTheme] =
    useState<Theme>("system");

  useEffect(() => {
    const savedTheme =
      localStorage.getItem("accessview-theme");

    if (
      savedTheme === "light" ||
      savedTheme === "dark" ||
      savedTheme === "system"
    ) {
      setTheme(savedTheme);
    }
  }, []);

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);

    localStorage.setItem(
      "accessview-theme",
      newTheme
    );

    document.documentElement.dataset.theme =
      newTheme;
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <div className="page-heading">
          <span className="eyebrow">
            CUSTOMIZATION
          </span>

          <h1>{t.settings}</h1>

          <p>
            Customize AccessView for your
            preferred viewing experience.
          </p>
        </div>

        <section className="settings-card">
          <div className="card-heading">
            <div className="settings-icon">
              ◐
            </div>

            <div>
              <h2>{t.appearance}</h2>

              <p>
                Choose how AccessView should
                appear.
              </p>
            </div>
          </div>

          <div className="theme-grid">
            <button
              className={`theme-option ${
                theme === "light"
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                changeTheme("light")
              }
            >
              <span>☀</span>
              <strong>{t.light}</strong>
              <small>
                Bright interface
              </small>
            </button>

            <button
              className={`theme-option ${
                theme === "dark"
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                changeTheme("dark")
              }
            >
              <span>☾</span>
              <strong>{t.dark}</strong>
              <small>
                Dark interface
              </small>
            </button>

            <button
              className={`theme-option ${
                theme === "system"
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                changeTheme("system")
              }
            >
              <span>◐</span>
              <strong>{t.system}</strong>
              <small>
                Follow device setting
              </small>
            </button>
          </div>
        </section>

        <section className="settings-card">
          <div className="card-heading">
            <div className="settings-icon">
              ♿
            </div>

            <div>
              <h2>
                {t.accessibility}
              </h2>

              <p>
                Make the interface easier to
                see and use.
              </p>
            </div>
          </div>

          <AccessibilityControls />
        </section>
      </main>
    </div>
  );
}