import {
  faAddressBook,
  faAnglesLeft,
  faAnglesRight,
  faHouse,
  faRobot,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import "./navbar.css";
import { useLocation } from "react-router-dom";

export default function Navbar() {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState<boolean>(localStorage.getItem("navbarCollapsed") === "true");
  const location = useLocation();

  useEffect(() => {
    const stored = localStorage.getItem("navbarCollapsed");
    if (stored !== null) setCollapsed(stored === "true");
    const openMenus = localStorage.getItem("openMenus");
  }, []);
  
  useEffect(() => {
    localStorage.setItem("navbarCollapsed", collapsed.toString());
  }, [collapsed]);  

  useEffect(() => {
    if (collapsed) {
      setOpenMenus({});
    }
  }, [collapsed]);

  const toggleMenu = (menu: string) => {
    setCollapsed(false);
    setOpenMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  function isActive(path: string) {
    if (path === "/") {
      return location.pathname === path;
    }
    return location.pathname.includes(path);
  }

  return (
    <div className="navbar">
      <div className="collapse-button-box">
        <button
          className="collapse-button"
          onClick={() => setCollapsed(!collapsed)}
        >
          <FontAwesomeIcon icon={collapsed ? faAnglesRight : faAnglesLeft} />
        </button>
      </div>
      <ul className="outer-list">
        <li className={isActive("/") ? "active" : undefined}>
          <a href="/">
            <FontAwesomeIcon icon={faHouse} />
            {collapsed ? <></> : <span>Home</span>}
          </a>
        </li>

        <li
          className={
            (isActive("/score") || isActive("/result")) &&
            !openMenus["scoring-system"]
              ? "active"
              : "passive"
          }
        >
          <div
            className="menu-button"
            onClick={() => toggleMenu("scoring-system")}
          >
            <FontAwesomeIcon icon={faRobot} />
            {collapsed ? <></> : <span>Scoring system</span>}
          </div>
          {openMenus["scoring-system"] && (
            <ul className="submenu">
              <li className={isActive("/score") ? "active" : "passive"}>
                <a href="/score">Import data</a>
              </li>
              <li className={isActive("/result") ? "active" : "passive"}>
                <a href="/result">History</a>
              </li>
            </ul>
          )}
        </li>

        <li
          className={
            isActive("/catalog") &&
            !openMenus["catalog"]
              ? "active"
              : "passive"
          }
          >
          <div className="menu-button" onClick={() => toggleMenu("catalog")}>
            <FontAwesomeIcon icon={faAddressBook} />
            {collapsed ? <></> : <span>Training data</span>}
          </div>
          {openMenus["catalog"] && (
            <ul className="submenu">
              <li className={isActive("/catalog") ? "active" : "passive"}>
                <a href="/catalog">Lung cancer</a>
              </li>
            </ul>
          )}
        </li>
        <li
          className={
            (isActive("/account") || isActive("/models") || isActive("/datasets")) &&
            !openMenus["personal"]
              ? "active"
              : "passive"
          }
          >
          <div className="menu-button" onClick={() => toggleMenu("personal")}>
            <FontAwesomeIcon icon={faUser} />
            {collapsed ? <></> : <span>Personal</span>}
          </div>
          {openMenus["personal"] && (
            <ul className="submenu">
              <li className={isActive("/account") ? "active" : "passive"}>
                <a href="/account">Account</a>
              </li>
              <li className={isActive("/models") ? "active" : "passive"}>
                <a href="/models">Models</a>
              </li>
              <li className={isActive("/datasets") ? "active" : "passive"}>
                <a href="/datasets">Datasets</a>
              </li>
            </ul>
          )}
        </li>
      </ul>
    </div>
  );
}
