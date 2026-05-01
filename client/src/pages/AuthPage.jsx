import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (submitError) {
      setError("Authentication failed. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="font-mono-sm text-primary animate-pulse uppercase tracking-[0.2em]">Synchronizing...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background flex items-center justify-center p-6 relative overflow-hidden font-body-md">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        <section className="space-y-6">
          <span className="font-mono-sm text-primary uppercase tracking-[0.2em]">Enterprise Career Tracking</span>
          <h1 className="text-5xl font-black tracking-tighter leading-none">
            Scale your <br/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500">internship journey.</span>
          </h1>
          <p className="text-neutral-400 max-w-md leading-relaxed">
            Manage interviews, reminders, and success analytics with the smart platform designed for modern career growth.
          </p>
          <div className="flex items-center gap-4 pt-4">
             <div className="flex -space-x-3">
                {[1,2,3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-surface-variant flex items-center justify-center overflow-hidden">
                    <span className="material-symbols-outlined text-[20px] text-neutral-600">person</span>
                  </div>
                ))}
             </div>
             <span className="text-xs text-neutral-500 font-medium italic">Joined by 1,000+ students this semester</span>
          </div>
        </section>

        <section className="glass-card p-10 rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
           <div className="w-20 h-20 rounded-[24px] bg-gradient-to-tr from-primary to-secondary flex items-center justify-center mb-8 shadow-xl shadow-primary/20">
              <span className="material-symbols-outlined text-white text-4xl fill-1">rocket_launch</span>
           </div>

           <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
           <p className="text-neutral-500 text-sm mb-10 max-w-[280px]">
             Securely sign in using Asgardeo Identity Cloud to access your personalized dashboard.
           </p>

           {error && (
             <div className="w-full mb-6 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-medium animate-shake">
               {error}
             </div>
           )}

           <button 
             onClick={handleLogin}
             className="shimmer-btn relative overflow-hidden w-full py-5 bg-primary text-on-primary font-bold rounded-2xl shadow-xl shadow-violet-900/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
           >
             <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">login</span>
             Continue with Asgardeo
           </button>

           <div className="mt-8 flex items-center gap-2 text-xs text-neutral-500">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              Enterprise SSO Protected
           </div>

           <div className="mt-auto pt-10 grid grid-cols-2 gap-4 w-full opacity-50">
              <div className="flex flex-col gap-1 items-center">
                 <span className="text-[10px] font-bold uppercase tracking-widest">Powered By</span>
                 <span className="text-xs font-black tracking-tighter">WSO2 Asgardeo</span>
              </div>
              <div className="flex flex-col gap-1 items-center">
                 <span className="text-[10px] font-bold uppercase tracking-widest">Cloud Platform</span>
                 <span className="text-xs font-black tracking-tighter">Choreo Runtime</span>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default AuthPage;
