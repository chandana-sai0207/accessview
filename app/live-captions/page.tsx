"use client";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Conversation from "../components/Conversation";

export default function LiveCaptionsPage() {
  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <Header />

        <section className="welcome-section">
          <div>
            <span className="eyebrow">
              SPEECH ACCESSIBILITY
            </span>

            <h2>Live Captions</h2>

            <p>
              Convert spoken words into
              readable captions and translate
              them into your preferred language.
            </p>
          </div>

          <div className="status-pill">
            <span className="status-dot" />

            Speech to text
          </div>
        </section>

        <section className="dashboard-section">
          <Conversation />
        </section>
      </main>
    </div>
  );
}