import React, { useRef, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { NavbarProvider } from "../store/navbar";

export default function Layout() {
  const navWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = navWrapRef.current;
    if (!el) return;
    const update = () =>
      document.documentElement.style.setProperty("--navbar-height", `${el.offsetHeight}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <NavbarProvider>
      <div className="homepage">
        <div ref={navWrapRef}>
          <Navbar />
        </div>
        <div className="content">
          <main>
            <div className="page">
              <Outlet />
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </NavbarProvider>
  );
}
