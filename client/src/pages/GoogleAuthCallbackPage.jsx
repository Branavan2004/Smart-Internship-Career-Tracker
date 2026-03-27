import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const GoogleAuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { completeOAuthLogin } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      navigate("/auth", { replace: true });
      return;
    }

    const finalizeLogin = async () => {
      try {
        await completeOAuthLogin(token);
        navigate("/", { replace: true });
      } catch (_error) {
        navigate("/auth", { replace: true });
      }
    };

    finalizeLogin();
  }, [completeOAuthLogin, navigate, searchParams]);

  return <div className="page-loader">Completing Google sign-in...</div>;
};

export default GoogleAuthCallbackPage;
