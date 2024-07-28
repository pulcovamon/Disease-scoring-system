import React from "react";

export default function Navbar() {
  return (
    <div className="navbar header">
      <a className="navbar-item" href="/">
        Disease scoring system
      </a>
      <a className="navbar-item" href="/">
        Home
      </a>
      <a className="navbar-item" href="/score">
        Score
      </a>
      <a className="navbar-item" href="/catalog">
        Catalog
      </a>
    </div>
  );
}
