import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth";
import LoadingSpinner from "./LoadingSpinner";
import { useLanguage } from "../store/language";

export default function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();
  const { buildPath } = useLanguage();

  if (status === "loading") {
    return (
      <div className="pagebody">
        <LoadingSpinner />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Navigate
        to={buildPath("/login")}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <Outlet />;
}
