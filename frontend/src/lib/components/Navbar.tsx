import { faAddressBook, faHouse, faRobot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import "./navbar.css";
import Footer from "./Footer";

export default function Navbar() {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  // Toggling jednotlivých menu
  const toggleMenu = (menu: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu], // Přepne stav konkrétního menu
    }));
  };

  return (
    <div className="navbar">
      <ul>
        {/* Home */}
        <li>
          <a href="/">
            <FontAwesomeIcon icon={faHouse} />
            <span>Home</span>
          </a>
        </li>

        {/* Scoring system */}
        <li>
          <div
            className="menu-button"
            onClick={() => toggleMenu("scoring-system")}
          >
            <FontAwesomeIcon icon={faRobot} />
            <span>Scoring system</span>
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

        {/* Catalog */}
        <li>
          <div
            className="menu-button"
            onClick={() => toggleMenu("catalog")}
          >
            <FontAwesomeIcon icon={faAddressBook} />
            <span>Training data</span>
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
      <Footer />
    </div>
  );
}
