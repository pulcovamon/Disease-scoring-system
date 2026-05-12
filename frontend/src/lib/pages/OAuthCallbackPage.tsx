import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import { useLanguage } from "../store/language";
import LoadingSpinner from "../components/LoadingSpinner";

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const { buildPath } = useLanguage();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const err = searchParams.get("error");
    if (token) {
      loginWithToken(token).then(() => navigate(buildPath("/models"), { replace: true }));
    } else {
      setError(err || "oauth_failed");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="page-body p-5 flex items-center justify-center">
        <div className="section-card text-center flex flex-col gap-4 max-w-sm w-full">
          <p className="text-red-500 font-semibold">OAuth sign-in failed</p>
          <p className="muted text-sm">{error.replace(/_/g, " ")}</p>
          <a href={buildPath("/login")} className="ghost-button text-center">
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="page-body flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}
