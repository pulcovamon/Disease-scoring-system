import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";

export function useAuthGuard(): boolean {
  const navigate = useNavigate();
  const location = useLocation();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      navigate("/login", {
        replace: true,
        state: { from: location.pathname + location.search },
      });
    }
  }, [location.pathname, location.search, navigate, status]);

  return status === "authenticated";
}
