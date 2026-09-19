"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations/ui";

export default function Sidebar() {
const pathname = usePathname();
const router = useRouter();
const { language } = useLanguage();

const t = translations[language] as Record<
string,
string

> ;

const text = (
key: string,
fallback: string
) => t[key] ?? fallback;

const menuItems = [
{
name: text("home", "Home"),
href: "/home",
icon: "⌂",
},
{
name: text(
"liveCaptions",
"Live Captions"
),
href: "/live-captions",
icon: "CC",
},
{
name: text(
"conversation",
"Conversation"
),
href: "/conversation",
icon: "💬",
},
{
name: text(
"soundAlerts",
"Sound Alerts"
),
href: "/sound-alerts",
icon: "🔊",
},
];

const handleLogout = () => {
localStorage.removeItem(
"accessview-user"
);

router.push("/login");

};

return ( <aside className="sidebar"> <div className="sidebar-logo"> <div className="logo-icon">AV</div>

    <div>
      <h2>AccessView</h2>

      <span>Making Sound Visible</span>
    </div>
  </div>

  <nav className="sidebar-nav">
    {menuItems.map((item) => {
      const active =
        pathname === item.href ||
        pathname.startsWith(
          `${item.href}/`
        );

      return (
        <Link
          key={item.href}
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
      className={`sidebar-link ${
        pathname === "/profile"
          ? "active"
          : ""
      }`}
    >
      <span className="sidebar-icon">
        👤
      </span>

      <span>
        {text("profile", "Profile")}
      </span>
    </Link>

    <Link
      href="/settings"
      className={`sidebar-link ${
        pathname === "/settings"
          ? "active"
          : ""
      }`}
    >
      <span className="sidebar-icon">
        ⚙
      </span>

      <span>
        {text("settings", "Settings")}
      </span>
    </Link>

    <button
      type="button"
      className="logout-button"
      onClick={handleLogout}
    >
      <span>↪</span>

      {text("logout", "Logout")}
    </button>
  </div>
</aside>

);
}
