import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import Layout from "./lib/pages/Layout";
import Home from "./lib/pages/Home";
import ScoringSystem from "./lib/pages/ScoringSystem";
import Catalog from "./lib/pages/Catalog";
import ResultPage from "./lib/pages/ResultPage";
import PatientDetailPage from "./lib/pages/PatientDetailPage";
import History from "./lib/pages/History";
import AccountPage from "./lib/pages/AccountPage";
import ModelsPage from "./lib/pages/ModelsPage";
import AdminUsersPage from "./lib/pages/AdminUsersPage";
import DatasetsPage from "./lib/pages/DatasetsPage";
import Login from "./lib/pages/LoginPage";
import Register from "./lib/pages/RegisterPage";
import OAuthCallbackPage from "./lib/pages/OAuthCallbackPage";
import ProtectedRoute from "./lib/components/ProtectedRoute";
import { AuthProvider } from "./lib/store/auth";
import { ThemeProvider } from "./lib/store/theme";
import { LanguageProvider, getDefaultLanguage } from "./lib/store/language";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<RedirectToPreferredLanguage />} />
          <Route path="/:lang/*" element={<LanguageScopedApp />} />
          <Route path="*" element={<RedirectToPreferredLanguage />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

function LanguageScopedApp() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="score" element={<ScoringSystem />} />
            <Route path="catalog" element={<Catalog />} />
            <Route path="result/:id" element={<ResultPage />} />
            <Route path="catalog/:id" element={<PatientDetailPage />} />
            <Route path="result" element={<History />} />
            <Route element={<ProtectedRoute />}>
              <Route path="account" element={<AccountPage />} />
              <Route path="models" element={<ModelsPage />} />
              <Route path="datasets" element={<DatasetsPage />} />
              <Route path="admin/users" element={<AdminUsersPage />} />
            </Route>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="oauth/callback" element={<OAuthCallbackPage />} />
            <Route path="*" element={<Navigate to="." replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </LanguageProvider>
  );
}

function RedirectToPreferredLanguage() {
  const navigate = useNavigate();
  const location = useLocation();
  const preferred = getDefaultLanguage();

  useEffect(() => {
    const path = location.pathname === "/" ? "" : location.pathname;
    navigate(`/${preferred}${path}${location.search}${location.hash}`, { replace: true });
  }, [location.hash, location.pathname, location.search, navigate, preferred]);

  return null;
}
