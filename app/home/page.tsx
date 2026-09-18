"use client";

import Link from "next/link";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import AccessibilityControls from "../components/AccessibilityControls";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations/ui";

export default function HomePage() {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <Header />

        {/* Welcome Section */}
        <section className="welcome-section">
          <div>
            <span className="eyebrow">
              ACCESSIBILITY PLATFORM
            </span>

            <h2>{t.welcome}</h2>

            <p>{t.subtitle}</p>
          </div>

          <div className="status-pill">
            <span className="status-dot" />
            Accessibility ready
          </div>
        </section>

        {/* Feature Cards */}
        <section className="feature-grid">

          {/* Live Captions */}
          <Link
            href="/live-captions"
            className="feature-card"
          >
            <div className="feature-icon">
              CC
            </div>

            <h3>{t.liveCaptions}</h3>

            <p>
              Convert spoken words into clear,
              readable captions and translates it according to the prefered language.
            </p>

            <span>
              Open feature →
            </span>
          </Link>

          {/* Conversation */}
          <Link
            href="/conversation"
            className="feature-card"
          >
            <div className="feature-icon">
              💬
            </div>

            <h3>{t.conversation}</h3>

            <p>
              Follow conversations with
              Person A and Person B.
            </p>

            <span>
              Open feature →
            </span>
          </Link>

          {/* Sound Alerts */}
          <Link
            href="/sound-alerts"
            className="feature-card"
          >
            <div className="feature-icon">
              🔊
            </div>

            <h3>{t.soundAlerts}</h3>

            <p>
              Turn important environmental
              sounds into visual alerts.
            </p>

            <span>
              Open feature →
            </span>
          </Link>

          {/* Reminders */}
          <Link
            href="/reminders"
            className="feature-card"
          >
            <div className="feature-icon">
              🔔
            </div>

            <h3>{t.reminders}</h3>

            <p>
              Keep important captions and
              information for later.
            </p>

            <span>
              Open feature →
            </span>
          </Link>

          {/* Settings */}
          <Link
            href="/settings"
            className="feature-card"
          >
            <div className="feature-icon">
              ⚙
            </div>

            <h3>{t.settings}</h3>

            <p>
              Customize appearance and
              accessibility preferences.
            </p>

            <span>
              Open settings →
            </span>
          </Link>

        </section>

        {/* Quick Settings */}
        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                QUICK SETTINGS
              </span>

              <h2>
                {t.accessibilitySettings}
              </h2>
            </div>

            <Link
              href="/settings"
              className="text-link"
            >
              {t.settings} →
            </Link>
          </div>

          <AccessibilityControls />
        </section>
      </main>
    </div>
  );
}