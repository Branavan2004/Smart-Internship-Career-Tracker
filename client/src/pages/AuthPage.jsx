import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "@asgardeo/auth-react";

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, signIn } = useAuthContext();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [callbackTimedOut, setCallbackTimedOut] = useState(false);

  const loginStartError =
    "Sign-in did not start. Check the Asgardeo client ID, base URL, and redirect URLs for this deployment.";

  const callbackParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isOAuthCallback =
    callbackParams.has("code") ||
    callbackParams.has("session_state") ||
    callbackParams.has("state");

  useEffect(() => {
    if (state?.isAuthenticated) {
      navigate("/");
    }
  }, [state?.isAuthenticated, navigate]);

  useEffect(() => {
    if (!isOAuthCallback || state?.isAuthenticated || state?.isLoading) {
      setCallbackTimedOut(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCallbackTimedOut(true);
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isOAuthCallback, state?.isAuthenticated, state?.isLoading]);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSubmitting(true);

    const redirectFallback = window.setTimeout(() => {
      setSubmitting(false);
      setError(loginStartError);
    }, 4000);

    try {
      await signIn();
    } catch (submitError) {
      window.clearTimeout(redirectFallback);
      console.error("Asgardeo signIn failed:", submitError);
      setError(`Authentication failed: ${submitError?.message || "Please try again."}`);
      setSubmitting(false);
    }
  };

  if (state?.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="font-mono-data text-primary-container animate-pulse uppercase tracking-[0.2em]">Synchronizing...</span>
      </div>
    );
  }

  if (isOAuthCallback && !callbackTimedOut && !error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="font-mono-data text-primary-container animate-pulse uppercase tracking-[0.2em]">Completing sign-in...</span>
      </div>
    );
  }

  const callbackError =
    callbackParams.get("error_description") ||
    callbackParams.get("error") ||
    (callbackTimedOut ? "Sign-in completed at Asgardeo, but the app did not finish the login handoff." : "");

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col md:flex-row antialiased">
      {/* Left Conceptual Pane */}
      <div className="hidden md:flex w-1/2 bg-surface-container-lowest flex-col relative overflow-hidden border-r border-outline-variant p-[64px]">
        {/* Abstract Glows */}
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-primary-container rounded-full blur-[160px] opacity-10 pointer-events-none"></div>
        <div className="absolute bottom-[10%] -right-[20%] w-[500px] h-[500px] bg-primary-container rounded-full blur-[140px] opacity-[0.08] pointer-events-none"></div>
        
        {/* Header */}
        <div className="flex items-baseline gap-xs z-10">
          <h1 className="font-h2 text-[32px] font-extrabold tracking-tight">CarrierX.</h1>
          <span className="font-label-caps text-[12px] text-on-surface-variant uppercase tracking-widest ml-2">Smart Tracker</span>
        </div>
        
        {/* Main Copy & Features */}
        <div className="mt-auto mb-[48px] z-10 max-w-xl">
          <h2 className="font-h1 text-[40px] mb-[32px] text-on-surface">
            Track your career,<br/>land your <span className="text-primary-container">dream role.</span>
          </h2>
          <ul className="flex flex-col gap-[16px]">
            <li className="flex items-center gap-[16px]">
              <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="font-body-lg text-[18px] text-on-surface-variant">Real-time application pipeline</span>
            </li>
            <li className="flex items-center gap-[16px]">
              <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="font-body-lg text-[18px] text-on-surface-variant">Secured by Asgardeo Identity</span>
            </li>
            <li className="flex items-center gap-[16px]">
              <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="font-body-lg text-[18px] text-on-surface-variant">Smart analytics & insights</span>
            </li>
          </ul>
        </div>
        
        {/* Footer Badge */}
        <div className="mt-auto z-10">
          <div className="inline-flex items-center gap-[8px] px-[16px] py-[8px] rounded-lg bg-surface-container/40 border border-outline-variant backdrop-blur-sm">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_sync</span>
            <span className="font-code-sm text-[12px] text-on-surface-variant">Deployed on WSO2 Choreo</span>
          </div>
        </div>
      </div>
      
      {/* Right Authentication Pane */}
      <div className="w-full md:w-1/2 flex flex-col relative bg-background">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="flex md:hidden items-center justify-center p-[32px] border-b border-outline-variant bg-surface-container-lowest">
          <h1 className="font-h3 text-[24px] font-extrabold tracking-tight">CarrierX.</h1>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-[24px] sm:p-[48px] w-full max-w-lg mx-auto relative z-10">
          {/* Auth Card */}
          <div className="w-full bg-surface-container border border-outline-variant rounded-xl p-[32px] shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
            {/* Tab Switcher */}
            <div className="flex border-b border-outline-variant mb-[32px]">
              <button type="button" className="flex-1 pb-[8px] border-b-2 border-primary-container font-label-caps text-[12px] text-primary-container transition-colors uppercase">
                Login
              </button>
              <button type="button" className="flex-1 pb-[8px] border-b-2 border-transparent font-label-caps text-[12px] text-on-surface-variant hover:text-on-surface transition-colors uppercase">
                Register
              </button>
            </div>
            
            {/* Content */}
            <h2 className="font-h2 text-[32px] mb-[24px] text-on-surface">Welcome back</h2>
            
            {error && (
              <div className="w-full mb-6 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-medium">
                {error}
              </div>
            )}

            {!error && callbackError && (
              <div className="w-full mb-6 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-medium">
                {callbackError}
              </div>
            )}
            
            <form className="flex flex-col gap-[24px]" onSubmit={handleLogin}>
              {/* Email Input */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-[16px] top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">mail</span>
                <input 
                  className="w-full bg-surface-container-high border border-outline-variant rounded-lg py-[16px] pl-[48px] pr-[16px] font-body-md text-[16px] text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary-container focus:ring-1 focus:ring-primary-container/20 transition-all outline-none" 
                  placeholder="name@company.com" 
                />
              </div>
              
              {/* Password Input */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-[16px] top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">lock</span>
                <input 
                  className="w-full bg-surface-container-high border border-outline-variant rounded-lg py-[16px] pl-[48px] pr-[16px] font-body-md text-[16px] text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary-container focus:ring-1 focus:ring-primary-container/20 transition-all outline-none" 
                  placeholder="••••••••" 
                  type="password" 
                />
              </div>
              
              {/* Actions Row */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-[8px] cursor-pointer group">
                  <div className="relative flex items-center justify-center w-4 h-4 rounded border border-outline-variant bg-surface-container-high group-hover:border-primary-container transition-colors">
                    <input className="opacity-0 absolute inset-0 cursor-pointer" type="checkbox" />
                  </div>
                  <span className="font-code-sm text-[12px] text-on-surface-variant group-hover:text-on-surface transition-colors">Remember me</span>
                </label>
                <a href="#" className="font-code-sm text-[12px] text-primary-container hover:text-primary transition-colors">Forgot password?</a>
              </div>
              
              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-primary-container text-on-primary-container font-label-caps text-[12px] uppercase tracking-widest py-[16px] rounded-lg hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(255,115,0,0.2)] transition-all active:translate-y-0 disabled:opacity-50"
              >
                {submitting ? "Redirecting..." : "Sign in to CarrierX"}
              </button>
            </form>
            
            {/* Divider */}
            <div className="flex items-center gap-[16px] my-[32px] opacity-60">
              <div className="flex-1 h-px bg-outline-variant"></div>
              <span className="font-code-sm text-[12px] text-on-surface-variant uppercase">Or continue with</span>
              <div className="flex-1 h-px bg-outline-variant"></div>
            </div>
            
            {/* Social Auth */}
            <div className="flex flex-col sm:flex-row gap-[16px]">
              <button type="button" onClick={handleLogin} className="flex-1 flex items-center justify-center gap-[8px] bg-surface-container-high border border-outline-variant rounded-lg py-[8px] px-[16px] hover:bg-surface-bright hover:border-outline transition-all group disabled:opacity-50" disabled={submitting}>
                <span className="font-code-sm text-[12px] text-on-surface group-hover:text-white transition-colors">Google</span>
              </button>
              <button type="button" onClick={handleLogin} className="flex-1 flex items-center justify-center gap-[8px] bg-surface-container-high border border-outline-variant rounded-lg py-[8px] px-[16px] hover:bg-surface-bright hover:border-outline transition-all group disabled:opacity-50" disabled={submitting}>
                <span className="material-symbols-outlined text-secondary text-[18px]">security</span>
                <span className="font-code-sm text-[12px] text-on-surface group-hover:text-white transition-colors">Asgardeo SSO</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Global Footer */}
        <div className="mt-auto flex justify-center py-[24px] border-t border-outline-variant/30 bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-[16px] font-mono-data text-[13px] text-on-surface-variant/70">
            <a href="#" className="hover:text-primary-container transition-colors">Privacy</a>
            <span>·</span>
            <a href="#" className="hover:text-primary-container transition-colors">Terms</a>
            <span>·</span>
            <span>© 2025 CarrierX</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
