"use client";

import { FormEvent, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations/ui";

export default function ProfilePage() {
  const { language, setLanguage } =
    useLanguage();

  const t = translations[language];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const savedUser =
      localStorage.getItem("accessview-user");

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);

        setName(user.name || "");
        setEmail(user.email || "");
      } catch {
        // Ignore invalid data
      }
    }
  }, []);

  const saveProfile = (event: FormEvent) => {
    event.preventDefault();

    const user = {
      name: name.trim(),
      email: email.trim(),
    };

    localStorage.setItem(
      "accessview-user",
      JSON.stringify(user)
    );

    alert("Profile updated successfully.");
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <div className="page-heading">
          <span className="eyebrow">
            ACCOUNT
          </span>

          <h1>{t.profile}</h1>

          <p>
            Manage your profile and application
            language.
          </p>
        </div>

        <div className="settings-layout">
          <section className="settings-card">
            <div className="card-heading">
              <div className="profile-avatar">
                {name
                  ? name.charAt(0).toUpperCase()
                  : "U"}
              </div>

              <div>
                <h2>{name || "AccessView User"}</h2>

                <p>
                  {email || "No email added"}
                </p>
              </div>
            </div>

            <form onSubmit={saveProfile}>
              <label>
                {t.name}

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                />
              </label>

              <label>
                {t.email}

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />
              </label>

              <button
                type="submit"
                className="primary-button"
              >
                {t.saveChanges}
              </button>
            </form>
          </section>

          <section className="settings-card">
            <div className="card-heading">
              <div className="settings-icon">
                🌐
              </div>

              <div>
                <h2>{t.preferredLanguage}</h2>

                <p>
                  This controls only the
                  AccessView interface.
                </p>
              </div>
            </div>

            <label>
              {t.preferredLanguage}

              <select
                value={language}
                onChange={(e) =>
                  setLanguage(
                    e.target.value as
                      | "en"
                      | "te"
                      | "hi"
                  )
                }
              >
                <option value="en">
                  English
                </option>

                <option value="te">
                  తెలుగు
                </option>

                <option value="hi">
                  हिन्दी
                </option>
              </select>
            </label>

            <div className="info-box">
              <strong>
                Important
              </strong>

              <p>
                Your Live Caption spoken/target
                languages and Translator From/To
                languages remain independent.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}