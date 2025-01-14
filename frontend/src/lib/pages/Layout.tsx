import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Layout() {
  return (
    <div className="homepage">
      <Navbar />
      <div className="content">
        <main
        style={{ backgroundImage: "url('/assets/background.jpg')" }}
        >
          <div className="page">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}

