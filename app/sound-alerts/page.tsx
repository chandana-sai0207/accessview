"use client";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import SoundDetector from "../components/SoundDetector";

export default function SoundAlertsPage() {
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

            <h2>Sound Alerts</h2>

            <p>
              Environmental sounds are converted
              into clear visual notifications.
            </p>
          </div>

          <div className="status-pill">
            <span className="status-dot" />

            Sound awareness
          </div>
        </section>

        <section className="dashboard-section">
          <SoundDetector />
        </section>
      </main>
    </div>
  );
}