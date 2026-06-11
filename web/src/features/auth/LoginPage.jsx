import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore.js";
import { api } from "../../shared/services/api.js";
import { MONO } from "../../shared/utils/tokens.js";
import { IS_MOCK } from "../../shared/services/api.js";
import { Modal } from "../../shared/components/Modal.jsx";
import { Button } from "../../shared/components/Button.jsx";
import logo from "../../assets/sepl-logo.jpg";
import heroBanner from "../../assets/hero-banner.png";
import { Mail, Lock, Eye, EyeOff, XCircle, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, busy, error } = useAuthStore();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotBusy, setForgotBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const ok = await login(email, pw);
    if (ok) navigate("/dashboard");
  };

  const sendReset = async () => {
    if (!forgotEmail.trim()) return;
    setForgotBusy(true);
    try { await api.resetPassword(forgotEmail.trim()); } catch { /* silently ignore */ }
    setForgotBusy(false);
    setForgotSent(true);
  };
  const closeForgot = () => { setForgotOpen(false); setForgotSent(false); setForgotEmail(""); setForgotBusy(false); };

  return (
    <div className="flex font-sans overflow-hidden" style={{ width: "100vw", height: "100vh" }}>

      {/* Animation keyframes */}
      <style>{`
        @keyframes heroFadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes heroBreathe {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.06); }
        }
        @keyframes shimmerSweep {
          0%   { transform: translateX(-120px) skewX(-12deg); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateX(calc(47vw + 120px)) skewX(-12deg); opacity: 0; }
        }
      `}</style>

      {/* Left — hero image */}
      <div className="relative hidden overflow-hidden bg-[#060e1e] lg:block" style={{ width: "47vw", height: "100vh", flexShrink: 0 }}>

        {/* Fade-in + Ken Burns on load, then breathing loop */}
        <div style={{
          width: "100%", height: "100%",
          animation: "heroFadeIn 1.8s ease-out forwards, heroBreathe 10s ease-in-out 2s infinite",
        }}>
          <img
            src={heroBanner}
            alt="SEPL ColdChain – See Everything, Control Anything"
            style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center", display: "block" }}
          />
        </div>

        {/* Shimmer glow sweep */}
        <div style={{
          position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none",
        }}>
          <div style={{
            position: "absolute", top: "-20%", left: 0,
            width: "80px", height: "140%",
            background: "linear-gradient(90deg, transparent 0%, rgba(100,180,255,0.18) 50%, transparent 100%)",
            animation: "shimmerSweep 4.5s ease-in-out 2.5s infinite",
          }} />
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex items-center justify-center overflow-y-auto bg-slate-50 px-6" style={{ width: "53vw", height: "100vh", flexShrink: 0 }}>
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src={logo} alt="SEPL" className="h-11 w-11 rounded-lg object-contain ring-1 ring-slate-200" />
            <div className="font-semibold tracking-tight text-slate-900">SEPL ColdChain</div>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Sign in to your workspace</h2>
          <p className="mt-1 text-sm text-slate-500">Enter your operator credentials to continue.</p>

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Email</span>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" placeholder="you@sepl.in"
                  className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
            </label>
            <label className="block">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">Password</span>
                <button type="button" onClick={() => setForgotOpen(true)} className="text-xs font-medium text-blue-600 hover:underline">Forgot?</button>
              </div>
              <div className="relative mt-1">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" placeholder="••••••••"
                  className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300 accent-blue-600" defaultChecked /> Keep me signed in
            </label>
            <button type="submit" disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-700 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-70">
              {busy ? (<><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>) : "Sign in"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Token auth · Role-based access · Encrypted transport
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">2026 SEPL ColdChain · v4.8.0</p>
        </div>
      </div>

      <Modal open={forgotOpen} onClose={closeForgot} title="Reset password"
        footer={forgotSent
          ? <Button variant="primary" onClick={closeForgot}>Done</Button>
          : <>
              <Button onClick={closeForgot} disabled={forgotBusy}>Cancel</Button>
              <Button variant="primary" onClick={sendReset} disabled={forgotBusy}>
                {forgotBusy ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending...</> : "Send reset link"}
              </Button>
            </>}>
        {forgotSent ? (
          <div className="flex flex-col items-center gap-2 py-3 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <p className="text-sm font-medium text-slate-700">Check your inbox</p>
            <p className="max-w-xs text-xs text-slate-500">If an account exists for <b>{forgotEmail}</b>, a password reset link has been sent. Contact your administrator if you don't receive it.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Enter your work email and we'll send a reset link.</p>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Email</span>
              <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@sepl.in"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}
