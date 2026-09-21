import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../store/store";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setSessionFromToken = useStore((s) => s.setSessionFromToken);
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = params.get("token");
    const errParam = params.get("error");

    if (errParam) {
      setError(errParam);
      return;
    }
    if (!token) {
      setError("No sign-in token received from Google.");
      return;
    }
    setSessionFromToken(token)
      .then(() => navigate("/app/dashboard", { replace: true }))
      .catch(() => setError("Could not complete Google sign-in."));
  }, [params, setSessionFromToken, navigate]);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-6"
      style={{ background: "var(--bg-gradient)" }}
    >
      <div
        className="px-8 py-7 rounded-[20px] text-center max-w-[380px]"
        style={{
          background: "var(--glass)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {error ? (
          <>
            <p className="font-bold text-[14px] mb-2" style={{ color: "#DC2626" }}>
              Sign-in failed
            </p>
            <p className="text-[12.5px] mb-5" style={{ color: "var(--muted-strong)" }}>
              {error}
            </p>
            <button className="btn-3d-raised" onClick={() => navigate("/", { replace: true })}>
              Back to login
            </button>
          </>
        ) : (
          <p className="text-[13px] font-semibold" style={{ color: "var(--deep)" }}>
            Completing Google sign-in...
          </p>
        )}
      </div>
    </div>
  );
}
