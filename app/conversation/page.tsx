"use client";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Conversation from "../components/Conversation";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations/ui";

export default function ConversationPage() {
  const { language } = useLanguage();

  const ui = translations[language] as Record<
    string,
    string
  >;

  const text = (
    key: string,
    fallback: string
  ) => ui[key] ?? fallback;

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <Header />

        <section
          className="welcome-section"
          aria-labelledby="conversation-page-title"
        >
          <div>
            <span className="eyebrow">
              {text(
                "accessibilityFeature",
                "ACCESSIBILITY FEATURE"
              )}
            </span>

            <h2 id="conversation-page-title">
              {text(
                "conversation",
                "Conversation"
              )}
            </h2>

            <p>
              {text(
                "conversationDescription",
                "Follow a conversation with live speech recognition, translation, and speaker switching."
              )}
            </p>
          </div>

          <div
            className="status-pill"
            aria-label={text(
              "conversationStatus",
              "Conversation"
            )}
          >
            <span
              className="status-dot"
              aria-hidden="true"
            />

            {text(
              "conversationStatus",
              "Conversation"
            )}
          </div>
        </section>

        <section
          className="dashboard-section"
          aria-label={text(
            "conversation",
            "Conversation"
          )}
        >
          <Conversation />
        </section>
      </main>
    </div>
  );
}