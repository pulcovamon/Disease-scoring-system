import {
  faAddressBook,
  faAnglesLeft,
  faAnglesRight,
  faHouse,
  faRobot,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import "./navbar.css";

export default function Navbar() {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState<boolean>(false);

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
        <li>
          <a href="/">
            <FontAwesomeIcon icon={faHouse} />
            {collapsed ? <></> : <span>Home</span>}
          </a>
        </li>

        <li>
          <div
            className="menu-button"
            onClick={() => toggleMenu("scoring-system")}
          >
            <FontAwesomeIcon icon={faRobot} />
            {collapsed ? <></> : <span>Scoring system</span>}
          </div>
          {openMenus["scoring-system"] && (
            <ul className="submenu">
              <li>
                <a href="/score">Import data</a>
              </li>
              <li>
                <a href="#">History</a>
              </li>
            </ul>
          )}
        </li>

        <li>
          <div className="menu-button" onClick={() => toggleMenu("catalog")}>
            <FontAwesomeIcon icon={faAddressBook} />
            {collapsed ? <></> : <span>Training data</span>}
          </div>
          {openMenus["catalog"] && (
            <ul className="submenu">
              <li>
                <a href="/catalog">Lung cancer</a>
              </li>
            </ul>
          )}
        </li>
      </ul>
    </div>
  );
}
