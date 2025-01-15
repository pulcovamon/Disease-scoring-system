import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Layout() {
  return (
    <div className="homepage">
      <img alt="" src="/assets/background.jpg" className="background-image"/>
      <Navbar />
      <div className="content">
        <main
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

