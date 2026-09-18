"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations/ui";

type User = {
  name: string;
  email: string;
};

export default function Header() {
  const { language } = useLanguage();
  const t = translations[language];

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser =
      localStorage.getItem("accessview-user");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  return (
    <header className="top-header">
      <div>
        <p className="header-label">
          ACCESSVIEW
        </p>

        <h1>{t.home}</h1>
      </div>

      <Link
        href="/profile"
        className="header-profile"
      >
        <div className="avatar">
          {user?.name
            ? user.name.charAt(0).toUpperCase()
            : "U"}
        </div>

        <div className="header-user">
          <strong>
            {user?.name || "AccessView User"}
          </strong>

          <span>
            {user?.email || "User Profile"}
          </span>
        </div>
      </Link>
    </header>
  );
}