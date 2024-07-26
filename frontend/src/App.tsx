import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./lib/pages/Layout";
import Home from "./lib/pages/Home";
import ScoringSystem from "./lib/pages/ScoringSystem";
import Catalog from "./lib/pages/Catalog";
import React from "react";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="scoring-system" element={<ScoringSystem />} />
          <Route path="catalog" element={<Catalog />} /> 
        </Route>
      </Routes>
    </BrowserRouter>
  );
}