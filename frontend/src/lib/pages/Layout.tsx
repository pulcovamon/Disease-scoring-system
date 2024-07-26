import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Layout() {
    return (
        <div className="homepage">
            <Navbar />
            <Outlet />
        </div>
    )
}