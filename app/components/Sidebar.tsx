"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations/ui";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage();

  const t = translations[language];

  const menuItems = [
    {
      name: t.home,
      href: "/home",
      icon: "⌂",
    },
    {
      name: t.liveCaptions,
      href: "/#live-captions",
      icon: "CC",
    },
    {
      name: t.conversation,
      href: "/#conversation",
      icon: "💬",
    },
    {
      name: t.soundAlerts,
      href: "/#sound-alerts",
      icon: "🔊",
    },
    {
      name: t.reminders,
      href: "/#reminders",
      icon: "🔔",
    },
    
  ];

  const handleLogout = () => {
    localStorage.removeItem("accessview-user");
    router.push("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">AV</div>

        <div>
          <h2>AccessView</h2>
          <span>Making Sound Visible</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`sidebar-link ${
                active ? "active" : ""
              }`}
            >
              <span className="sidebar-icon">
                {item.icon}
              </span>

              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <Link
          href="/profile"
          className="sidebar-link"
        >
          <span className="sidebar-icon">👤</span>
          <span>{t.profile}</span>
        </Link>

        <Link
          href="/settings"
          className="sidebar-link"
        >
          <span className="sidebar-icon">⚙</span>
          <span>{t.settings}</span>
        </Link>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          <span>↪</span>
          {t.logout}
        </button>
      </div>
    </aside>
  );
}