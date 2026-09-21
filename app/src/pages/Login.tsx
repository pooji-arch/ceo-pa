import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn } from "lucide-react";
import { useStore } from "../store/store";
import { RotatingBadge3D } from "../components/ui/RotatingBadge3D";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4c-7.5 0-14 4.2-17.7 10.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.7 34.7 27 35.5 24 35.5c-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C9.9 39.6 16.4 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C41.6 35.9 44 30.3 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const role = useStore((s) => s.role);
  const login = useStore((s) => s.login);
  const loginWithGoogle = useStore((s) => s.loginWithGoogle);
  const authLoading = useStore((s) => s.authLoading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  if (role) return <Navigate to="/app/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await login(email, password);
      navigate("/app/dashboard");
    } catch {
      setFormError(useStore.getState().authError ?? "Could not sign in. Please try again.");
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "var(--bg-gradient)" }}
    >
      {/* One box — transparent branding half on the left, sign-in form on the right */}
      <div
        className="anim-pop relative z-10 w-full max-w-[860px] flex overflow-hidden"
        style={{
          border: "1px solid var(--glass-border)",
          borderRadius: 20,
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Left half — transparent branding panel (desktop only) */}
        <div
          className="hidden md:flex flex-col items-center justify-center flex-1 relative px-10 py-10"
          style={{
            background: "rgba(255,255,255,0.10)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            borderRight: "1px solid var(--glass-border)",
          }}
        >
          <RotatingBadge3D size={180} />
          <div className="relative text-center mt-4">
            <div className="text-[12px] font-bold tracking-[0.18em] uppercase" style={{ color: "var(--muted-strong)" }}>
              CEO (PA) Application
            </div>
            <h2 className="text-[22px] font-extrabold font-display leading-tight mt-2" style={{ color: "var(--deep)" }}>
              The CEO Office,
              <br />
              in one control center.
            </h2>
            <p className="text-[12.5px] mt-3 max-w-[280px] mx-auto" style={{ color: "var(--muted-strong)" }}>
              Appointments, tasks, meetings, Kaizen and daily execution — tracked end to end.
            </p>
          </div>
        </div>

        {/* Right half — sign-in form */}
        <div
          className="relative px-8 sm:px-10 py-10 overflow-hidden flex-1 max-w-[420px]"
          style={{
            background: "var(--glass)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          {/* glossy top-left highlight sweep */}
          <div
            className="absolute -top-16 -left-16 w-56 h-56 pointer-events-none rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 70%)" }}
          />

          <div className="relative">
            {/* mobile-only badge, since the branding panel is hidden below md */}
            <div className="md:hidden flex justify-center mb-4">
              <RotatingBadge3D size={100} />
            </div>

            <h1 className="text-[24px] font-extrabold font-display leading-tight" style={{ color: "var(--deep)" }}>
              Welcome back
            </h1>
            <p className="text-[12.5px] mt-1.5 mb-7" style={{ color: "var(--muted-strong)" }}>
              Sign in to the CEO Office control center.
            </p>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div>
                <label
                  className="block text-[11px] font-bold uppercase tracking-wide mb-1.5"
                  style={{ color: "var(--muted-strong)" }}
                >
                  Email
                </label>
                <div
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-[14px] border transition-colors bg-[var(--surface)] border-[var(--line)] focus-within:border-[var(--brand)] focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.14)] focus-within:bg-[rgba(255,255,255,0.55)]"
                >
                  <Mail size={15} className="shrink-0" style={{ color: "var(--brand)" }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="flex-1 bg-transparent outline-none text-[13.5px] placeholder:text-[var(--muted)]"
                    style={{ color: "var(--deep)" }}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-[11px] font-bold uppercase tracking-wide mb-1.5"
                  style={{ color: "var(--muted-strong)" }}
                >
                  Password
                </label>
                <div
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-[14px] border transition-colors bg-[var(--surface)] border-[var(--line)] focus-within:border-[var(--brand)] focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.14)] focus-within:bg-[rgba(255,255,255,0.55)]"
                >
                  <Lock size={15} className="shrink-0" style={{ color: "var(--brand)" }} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="flex-1 bg-transparent outline-none text-[13.5px] placeholder:text-[var(--muted)]"
                    style={{ color: "var(--deep)" }}
                  />
                </div>
              </div>

              {formError && (
                <p className="text-[12px] font-medium" style={{ color: "#DC2626" }}>
                  {formError}
                </p>
              )}

              <button type="submit" disabled={authLoading} className="btn-3d-raised w-full mt-1 disabled:opacity-60">
                <LogIn size={15} /> {authLoading ? "Signing in..." : "Log In"}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <span className="flex-1 h-px" style={{ background: "var(--line)" }} />
              <span className="text-[11px] font-semibold" style={{ color: "var(--muted-strong)" }}>
                OR
              </span>
              <span className="flex-1 h-px" style={{ background: "var(--line)" }} />
            </div>

            <button
              type="button"
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full border text-[12.5px] font-bold transition-colors bg-[var(--glass)] border-[var(--glass-border)] hover:bg-white hover:border-[var(--brand)]"
              style={{ color: "var(--deep)" }}
            >
              <GoogleIcon /> Continue with Google
            </button>

            <p className="text-center text-[10.5px] mt-7" style={{ color: "var(--muted)" }}>
              Internal build · CEO Office / Personal Assistant · not for distribution
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
