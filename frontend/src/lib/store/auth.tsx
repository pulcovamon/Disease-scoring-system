import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "./language";
import {
  getMethod,
  registerAuthTokenGetter,
  registerUnauthorizedHandler,
  baseURL,
} from "../classes/api";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type UserProfile = {
  first_name: string;
  last_name: string;
  email: string;
  id: string;
  is_approved: boolean;
  role: string;
};

type AuthContextValue = {
  status: AuthStatus;
  user: UserProfile | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: (redirect?: boolean) => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>(token ? "loading" : "unauthenticated");
  const navigate = useNavigate();
  const location = useLocation();
  const { buildPath } = useLanguage();
  const tokenRef = useRef<string | null>(token);

  const setTokenAndPersist = useCallback((nextToken: string | null) => {
    tokenRef.current = nextToken;
    setToken(nextToken);
    if (nextToken) {
      localStorage.setItem("token", nextToken);
    } else {
      localStorage.removeItem("token");
    }
  }, []);

  const logout = useCallback(
    (redirect: boolean = true) => {
      setUser(null);
      setStatus("unauthenticated");
      setTokenAndPersist(null);
      if (redirect) {
        navigate(buildPath("/login"), {
          replace: true,
          state: { from: location.pathname + location.search },
        });
      }
    },
    [buildPath, location.pathname, location.search, navigate, setTokenAndPersist]
  );

  const refreshUser = useCallback(async () => {
    if (!tokenRef.current) {
      setUser(null);
      setStatus("unauthenticated");
      return;
    }

    setStatus((prev) => (prev === "authenticated" ? prev : "loading"));
    try {
      const profile = await getMethod<UserProfile>("/auth/user/me", undefined, {
        includeAuth: true,
        handleUnauthorized: false,
      });
      setUser(profile);
      setStatus("authenticated");
    } catch (error) {
      console.error("Failed to refresh user", error);
      logout(false);
    }
  }, [logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await fetch(`${baseURL}/auth/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: email,
            password: password,
          }),
        });

        if (!res.ok) {
          throw new Error("Login failed");
        }

        const data = await res.json();
        setTokenAndPersist(data.access_token);
        await refreshUser();
        return true;
      } catch (error) {
        console.error("Login failed", error);
        setUser(null);
        setStatus("unauthenticated");
        setTokenAndPersist(null);
        return false;
      }
    },
    [refreshUser, setTokenAndPersist]
  );

  useEffect(() => {
    registerAuthTokenGetter(() => tokenRef.current);
    registerUnauthorizedHandler(() => logout(true));
    return () => registerUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    if (tokenRef.current) {
      refreshUser();
    }
  }, [refreshUser]);

  const value = useMemo(
    () => ({
      status,
      user,
      token,
      login,
      logout,
      refreshUser,
    }),
    [status, user, token, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
