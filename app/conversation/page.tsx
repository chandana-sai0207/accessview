"use client";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Conversation from "../components/Conversation";

export default function ConversationPage() {
  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <Header />

        <section className="welcome-section">
          <div>
            <span className="eyebrow">
              ACCESSIBILITY FEATURE
            </span>

            <h2>Conversation</h2>

            <p>
              Follow a conversation with live
              speech recognition, translation,
              and speaker switching.
            </p>
          </div>

          <div className="status-pill">
            <span className="status-dot" />

            Conversation
          </div>
        </section>

        <section className="dashboard-section">
          <Conversation />
        </section>
      </main>
    </div>
  );
}