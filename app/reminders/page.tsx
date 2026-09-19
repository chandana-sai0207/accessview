"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations/ui";

const STORAGE_KEY = "accessview-reminders";

type Reminder = {
  id: number;
  text: string;
  createdAt: string;
};

export default function RemindersPage() {
  const { language } = useLanguage();
  const ui = translations[language] as Record<string, string>;
  const text = (key: string, fallback: string) => ui[key] ?? fallback;

  const [reminders, setReminders] = useState<Reminder[]>([]);

  const loadReminders = () => {
    const existing = localStorage.getItem(STORAGE_KEY);

    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        if (Array.isArray(parsed)) {
          setReminders(parsed);
        }
      } catch {
        setReminders([]);
      }
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const deleteReminder = (id: number) => {
    const updated = reminders.filter((item) => item.id !== id);
    setReminders(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearAll = () => {
    setReminders([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <Header />

        <section className="welcome-section">
          <div>
            <span className="eyebrow">
              {text("reminders", "REMINDERS")}
            </span>
            <h2>{text("reminders", "Reminders")}</h2>
            <p>
              {text(
                "remindersDescription",
                "Reminders you saved from Live Captions and Conversation."
              )}
            </p>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="conversation-feature">
            {reminders.length === 0 ? (
              <div
                style={{
                  minHeight: "200px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#6b7280",
                  fontSize: "17px",
                }}
              >
                {text(
                  "noReminders",
                  "No reminders saved yet."
                )}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    style={{
                      padding: "16px 20px",
                      borderRadius: "14px",
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#111827",
                        }}
                      >
                        {reminder.text}
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#6b7280",
                          marginTop: "4px",
                        }}
                      >
                        {reminder.createdAt}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteReminder(reminder.id)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      {text("delete", "Delete")}
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={clearAll}
                  style={{
                    alignSelf: "flex-start",
                    marginTop: "8px",
                    padding: "10px 18px",
                    borderRadius: "999px",
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    color: "#374151",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {text("clearAll", "Clear All")}
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}