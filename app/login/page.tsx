"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleLogin = (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !email.trim()) {
      return;
    }

    const user = {
      name: name.trim(),
      email: email.trim(),
    };

    localStorage.setItem(
      "accessview-user",
      JSON.stringify(user)
    );

    router.push("/home");
  };

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-brand">
          <div className="logo-icon large">
            AV
          </div>

          <h1>AccessView</h1>

          <p>Making Sound Visible</p>
        </div>

        <div className="login-message">
          <h2>
            Communication should be accessible to everyone.
          </h2>

          <p>
            Convert speech and important sounds into
            meaningful visual information.
          </p>
        </div>
      </section>

      <section className="login-form-section">
        <div className="login-card">
          <div className="mobile-logo">
            <div className="logo-icon">
              AV
            </div>

            <strong>AccessView</strong>
          </div>

          <span className="eyebrow">
            WELCOME
          </span>

          <h2>Sign in to AccessView</h2>

          <p className="form-description">
            Enter your details to continue.
          </p>

          <form onSubmit={handleLogin}>
            <label>
              Name

              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                required
              />
            </label>

            <label>
              Email

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />
            </label>

            <button
              type="submit"
              className="primary-button full-width"
            >
              Sign In →
            </button>
          </form>

          <p className="login-note">
            Demo authentication for the hackathon prototype.
          </p>
        </div>
      </section>
    </main>
  );
}