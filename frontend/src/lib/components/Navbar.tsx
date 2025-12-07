import {
  faAddressBook,
  faBars,
  faDatabase,
  faLayerGroup,
  faChartLine,
  faHouse,
  faMoon,
  faRobot,
  faSun,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocation } from "react-router-dom";
import { useTheme } from "../store/theme";
import { useMemo, useState } from "react";
import { useLanguage } from "../store/language";

export default function Navbar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) =>
    path === "/" ? location.pathname === path : location.pathname.includes(path);

  const menuItems = useMemo(
    () => [
      {
        icon: faHouse,
        label: "Home",
        link: "/",
        isActive: isActive("/"),
      },
      {
        icon: faRobot,
        label: "Formulář",
        link: "/score",
        isActive: isActive("/score"),
      },
      {
        icon: faChartLine,
        label: "Historie predikcí",
        link: "/result",
        isActive: isActive("/result"),
      },
      {
        icon: faAddressBook,
        label: "Trénovací data",
        link: "/catalog",
        isActive: isActive("/catalog"),
      },
      {
        icon: faLayerGroup,
        label: "Modely",
        link: "/models",
        isActive: isActive("/models"),
      },
      {
        icon: faDatabase,
        label: "Datasety",
        link: "/datasets",
        isActive: isActive("/datasets"),
      },
    ],
    [location.pathname]
  );

  const navList = (
    <ul className="flex flex-col md:flex-row gap-2 md:gap-4 items-start md:items-center">
      {menuItems.map((item) => (
        <li key={item.label}>
          <a
            href={item.link}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-white ${
              item.isActive
                ? "bg-white/25 shadow-sm"
                : "text-white/95 hover:bg-white/12"
            }`}
          >
            <FontAwesomeIcon icon={item.icon} className="drop-shadow-sm" />
            <span className="text-sm md:text-base">{item.label}</span>
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <nav className="bg-gradient-to-r from-[#2b1f7a] via-[var(--primary)] to-[#0f86c9] text-white shadow-md sticky top-0 z-50 w-full border-b border-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            className="text-2xl md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle navigation"
          >
            <FontAwesomeIcon icon={mobileOpen ? faXmark : faBars} />
          </button>
          <a href="/" className="font-bold text-lg">
            Scoring System
          </a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {navList}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-1 py-1 rounded-full">
            <FontAwesomeIcon
              icon={faSun}
              className={`text-xs ${theme === "light" ? "text-yellow-200" : "text-white/50"}`}
            />
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className={`relative w-12 h-6 rounded-full transition-colors ${
                theme === "dark" ? "bg-white/30" : "bg-white"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${
                  theme === "dark"
                    ? "translate-x-6 bg-indigo-500"
                    : "translate-x-0 bg-[var(--secondary)]"
                }`}
              />
            </button>
            <FontAwesomeIcon
              icon={faMoon}
              className={`text-xs ${theme === "dark" ? "text-indigo-100" : "text-white/50"}`}
            />
          </div>
          <div className="flex items-center gap-2 px-1 py-1 rounded-full">
            <span className={`text-xs font-semibold ${language === "cs" ? "text-white" : "text-white/60"}`}>
              CS
            </span>
            <button
              type="button"
              onClick={toggleLanguage}
              aria-label="Toggle language"
              className={`relative w-12 h-6 rounded-full transition-colors ${
                language === "en" ? "bg-white/30" : "bg-white"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${
                  language === "en"
                    ? "translate-x-6 bg-indigo-500"
                    : "translate-x-0 bg-[var(--secondary)]"
                }`}
              />
            </button>
            <span className={`text-xs font-semibold ${language === "en" ? "text-white" : "text-white/60"}`}>
              EN
            </span>
          </div>
          <a
            href="/account"
            className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-[var(--secondary)] text-white hover:bg-[var(--secondary-hover)] shadow transition"
            aria-label="Account"
          >
            <FontAwesomeIcon icon={faAddressBook} />
          </a>
        </div>
      </div>

      <div className={`${mobileOpen ? "block" : "hidden"} md:hidden px-4 pb-4`}>
        {navList}
      </div>
    </nav>
  );
}
