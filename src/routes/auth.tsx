import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, rtdb, googleProvider } from "@/integrations/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ShieldCheck,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  Truck,
  LineChart,
  BadgeCheck,
  Sparkles,
} from "lucide-react";
import type { AppRole } from "@/lib/auth-context";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — TransitOps" }] }),
  component: AuthPage,
});

// The only admin account — cannot be created via sign-up
export const ADMIN_EMAIL = "admin@transitops.com";

const SIGNUP_ROLES: {
  label: string;
  value: AppRole;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { label: "Driver", value: "driver", description: "Assigned trips & compliance", icon: BadgeCheck },
  { label: "Fleet Manager", value: "fleet_manager", description: "Full fleet & dispatch control", icon: Truck },
  { label: "Financial Analyst", value: "financial_analyst", description: "Revenue, cost & fuel insights", icon: LineChart },
];

type AuthMode = "signin" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AppRole>("driver");
  const [loading, setLoading] = useState(false);

  // ── Google first-time role-selection state ──
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleRole, setGoogleRole] = useState<AppRole>("driver");
  const [googleSaving, setGoogleSaving] = useState(false);
  // Ref-based guard: prevents onAuthStateChanged auto-redirect while we're
  // waiting for the user to pick a role in the modal.
  const skipAutoNavRef = useRef(false);

  // Detect if the typed email is the admin email
  const isAdminEmail = email.trim().toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (u && !skipAutoNavRef.current) navigate({ to: "/" });
    });
    return () => unsub();
  }, [navigate]);

  async function createUserProfile(uid: string, email: string | null, displayName: string | null, assignRole?: AppRole, isAdmin = false) {
    const payload: Record<string, any> = {
      uid,
      email,
      display_name: displayName,
      created_at: new Date().toISOString(),
    };
    if (isAdmin) {
      payload.roles = ["admin"];
      payload.status = "approved";
    } else if (assignRole) {
      payload.roles = [assignRole];
      payload.status = "pending"; // awaits admin approval
    }
    await set(ref(rtdb, `user_profiles/${uid}`), payload);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        // Ensure admin doc exists on first admin login
        if (isAdminEmail) {
          await createUserProfile(cred.user.uid, cred.user.email, cred.user.displayName ?? "Admin", undefined, true);
        }
        toast.success("Welcome back");
      } else {
        if (isAdminEmail) {
          toast.error("Admin account cannot be created via sign-up.");
          setLoading(false);
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const dn = name.trim() || email.split("@")[0];
        await updateProfile(cred.user, { displayName: dn });
        await createUserProfile(cred.user.uid, cred.user.email, dn, role);
        toast.success("Account created — awaiting admin approval.");
      }
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    if (isAdminEmail) {
      toast.error("Admin must sign in with email and password.");
      return;
    }
    // Block the auto-nav effect until we know whether this is a first-time
    // Google user (needs role) or a returning user (should proceed).
    skipAutoNavRef.current = true;
    try {
      const cred = await signInWithPopup(auth, googleProvider);

      // Admin can never enter through Google — force sign-out and abort.
      if (cred.user.email?.toLowerCase() === ADMIN_EMAIL) {
        await fbSignOut(auth);
        skipAutoNavRef.current = false;
        toast.error("Admin must sign in with email and password.");
        return;
      }

      const snap = await get(ref(rtdb, `user_profiles/${cred.user.uid}`));
      if (snap.exists()) {
        // Returning user — role/status already set. Let routing take over.
        skipAutoNavRef.current = false;
        toast.success("Welcome back");
        navigate({ to: "/" });
        return;
      }

      // First-time Google user — open the role picker. Keep skipAutoNavRef true
      // so the auto-nav effect doesn't fire while the modal is open.
      setGoogleRole("driver");
      setGoogleUser(cred.user);
    } catch (err: any) {
      skipAutoNavRef.current = false;
      toast.error(err.message ?? "Google sign-in failed");
    }
  }

  // Save role + status:pending for a first-time Google user, then redirect
  // through the app root so the pending screen picks them up (same as signup).
  async function confirmGoogleRole() {
    if (!googleUser) return;
    setGoogleSaving(true);
    try {
      await set(ref(rtdb, `user_profiles/${googleUser.uid}`), {
        uid: googleUser.uid,
        email: googleUser.email,
        display_name: googleUser.displayName,
        roles: [googleRole],
        status: "pending",
        created_at: new Date().toISOString(),
      });
      toast.success("Account created — awaiting admin approval.");
      setGoogleUser(null);
      skipAutoNavRef.current = false;
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save role");
    } finally {
      setGoogleSaving(false);
    }
  }

  // If the user cancels the role picker, sign them out so we don't leave a
  // Firebase-authenticated user without a profile.
  async function cancelGoogleRole() {
    try {
      await fbSignOut(auth);
    } catch { /* noop */ }
    setGoogleUser(null);
    skipAutoNavRef.current = false;
  }

  function switchMode(m: AuthMode) {
    setMode(m);
    setEmail("");
    setPassword("");
    setName("");
    setRole("driver");
  }

  function fillAdminDemo() {
    // Admin can only sign in, never sign up
    setMode("signin");
    setEmail(ADMIN_EMAIL);
    setPassword("Admin@123");
    toast.info("Admin credentials filled in — press Sign in.");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-background">
      {/* ─────────────────────────  LEFT PANEL  ───────────────────────── */}
      <div className="relative flex flex-col px-5 py-10 sm:p-10 lg:p-14 xl:p-20 bg-paper border-b border-line lg:border-b-0 lg:border-r overflow-hidden lg:sticky lg:top-0 lg:h-screen">
        {/* ── Ambient background stack ── */}
        {/* Aurora sweep */}
        <div
          className="absolute -top-[30%] -left-[20%] h-[160%] w-[140%] pointer-events-none opacity-[0.55]"
          style={{
            background:
              "conic-gradient(from 210deg at 50% 50%, transparent 0deg, color-mix(in oklab, var(--accent) 22%, transparent) 60deg, transparent 140deg, color-mix(in oklab, var(--ink) 14%, transparent) 220deg, transparent 300deg)",
            filter: "blur(60px)",
            animation: "ambient-aurora 22s ease-in-out infinite",
          }}
        />
        {/* Primary accent orb */}
        <div
          className="absolute -top-40 -left-24 h-[520px] w-[520px] rounded-full blur-3xl pointer-events-none"
          style={{
            background: "radial-gradient(closest-side, var(--accent), transparent 70%)",
            animation: "ambient-breathe 14s ease-in-out infinite",
          }}
        />
        {/* Ink orb */}
        <div
          className="absolute -bottom-48 -right-24 h-[560px] w-[560px] rounded-full blur-3xl pointer-events-none opacity-30"
          style={{
            background: "radial-gradient(closest-side, var(--ink), transparent 70%)",
            animation: "ambient-drift 26s ease-in-out infinite",
          }}
        />
        {/* Small warm highlight */}
        <div
          className="absolute top-1/3 right-[-6rem] h-[280px] w-[280px] rounded-full blur-3xl pointer-events-none opacity-40"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in oklab, var(--accent) 70%, var(--paper)), transparent 70%)",
            animation: "ambient-breathe 18s ease-in-out infinite 3s",
          }}
        />
        {/* Diagonal sheen */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background:
              "linear-gradient(135deg, transparent 0%, color-mix(in oklab, var(--background) 30%, transparent) 55%, transparent 100%)",
          }}
        />
        {/* Subtle noise veil */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.22]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.10  0 0 0 0 0.10  0 0 0 0 0.10  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
            backgroundSize: "220px 220px",
          }}
        />
        {/* Vignette focus */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(130% 90% at 50% 45%, transparent 40%, color-mix(in oklab, var(--background) 55%, transparent) 100%)",
          }}
        />

        {/* ── Content: hero only, vertically centred ── */}
        <div className="relative flex flex-col h-full min-h-0">
          {/* Hero — vertically centred, generously spaced */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <div className="inline-flex items-center gap-2 mb-5 sm:mb-8 px-3 py-1 rounded-full border border-line bg-background/70 backdrop-blur-sm w-fit">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-70 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Live · Fleet Intelligence
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-[3rem] lg:text-[3.25rem] xl:text-[3.75rem] leading-[1.08] sm:leading-[1.02] tracking-tight mb-4 sm:mb-6">
              Every asset accounted for.
              <br />
              <span className="relative inline-block mt-1">
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(115deg, var(--accent) 0%, color-mix(in oklab, var(--accent) 65%, var(--ink)) 100%)",
                  }}
                >
                  Every kilometre earned.
                </span>
                <span className="absolute -bottom-2 sm:-bottom-3 left-0 h-[3px] w-16 sm:w-24 rounded-full bg-accent/80" />
              </span>
            </h1>

            <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground max-w-md mt-3 sm:mt-4">
              Fleet, dispatch, fuel and maintenance intelligence — orchestrated
              in a single, decision-grade console. Powered by Firebase.
            </p>

            {/* Admin demo card — click to autofill credentials */}
            <button
              type="button"
              onClick={fillAdminDemo}
              className="group relative mt-8 sm:mt-12 max-w-md text-left cursor-pointer"
              aria-label="Fill admin demo credentials"
            >
              <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-accent/40 via-transparent to-ink/20 opacity-70 blur-[1px] transition-opacity group-hover:opacity-100" />
              <div className="relative p-4 sm:p-5 border border-line rounded-xl bg-background/85 backdrop-blur-sm shadow-sm transition-all group-hover:border-line-strong group-hover:-translate-y-0.5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-6 w-6 rounded-md bg-ink/90 text-background grid place-items-center">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em]">
                    Admin Demo
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-accent">
                    Try it
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-mono text-foreground truncate">{ADMIN_EMAIL}</span>
                  <span className="text-muted-foreground">Password</span>
                  <span className="font-mono text-foreground">Admin@123</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────  RIGHT PANEL  ───────────────────────── */}
      <div className="relative flex items-center justify-center px-4 py-10 sm:px-6 sm:py-14 lg:p-12">
        {/* Ambient background on mobile / right side */}
        <div
          className="absolute inset-0 pointer-events-none opacity-70"
          style={{
            background:
              "radial-gradient(60% 40% at 80% 0%, color-mix(in oklab, var(--accent) 12%, transparent), transparent 70%), radial-gradient(50% 40% at 0% 100%, color-mix(in oklab, var(--ink) 8%, transparent), transparent 70%)",
          }}
        />

        <div className="relative w-full max-w-md">
          {/* Card halo */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-accent/30 via-line to-ink/10 opacity-80" />
          <div className="relative rounded-2xl bg-background border border-line shadow-[0_1px_0_0_rgba(0,0,0,0.02),0_20px_60px_-24px_rgba(0,0,0,0.18)] p-7 sm:p-8">
            {/* Header */}
            <div className="mb-7">
              <div className="inline-flex items-center gap-2 mb-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                <Sparkles className="h-3 w-3 text-accent" />
                {mode === "signin" ? "Return to console" : "Request access"}
              </div>
              <h2 className="font-display text-[2rem] leading-tight tracking-tight">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {mode === "signin"
                  ? "Sign in to pick up where you left off."
                  : "New accounts require admin approval before access is granted."}
              </p>
            </div>

            {/* Google — hidden when admin email is typed */}
            {!isAdminEmail && (
              <>
                <Button
                  variant="outline"
                  className="w-full h-11 font-medium border-line hover:border-line-strong bg-paper/40 hover:bg-paper transition-all"
                  onClick={onGoogle}
                  type="button"
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-line" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-[0.22em]">
                    <span className="bg-background px-3 text-muted-foreground">
                      or continue with email
                    </span>
                  </div>
                </div>
              </>
            )}

            {isAdminEmail && mode === "signup" && (
              <div className="mb-4 p-3 rounded-md border border-destructive/30 bg-destructive/5 text-sm text-destructive">
                Admin accounts cannot be created here. Please sign in instead.
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              {mode === "signup" && !isAdminEmail && (
                <>
                  {/* Display name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs uppercase tracking-widest text-muted-foreground">
                      Full name
                    </Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Ravi Kapadia"
                        autoComplete="name"
                        className="h-11 pl-9 bg-paper/40"
                      />
                    </div>
                  </div>

                  {/* Role selector — 3 premium cards */}
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                      Choose your role
                    </Label>
                    <div className="grid grid-cols-1 gap-2">
                      {SIGNUP_ROLES.map((r) => {
                        const active = role === r.value;
                        const Icon = r.icon;
                        return (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() => setRole(r.value)}
                            className={`group relative text-left px-4 py-3 rounded-lg border transition-all overflow-hidden ${
                              active
                                ? "border-ink bg-ink text-background shadow-md shadow-ink/10"
                                : "border-line bg-paper/40 hover:bg-paper hover:border-line-strong"
                            }`}
                          >
                            {active && (
                              <span
                                className="pointer-events-none absolute inset-0 opacity-40"
                                style={{
                                  background:
                                    "radial-gradient(60% 100% at 100% 50%, color-mix(in oklab, var(--accent) 55%, transparent), transparent 60%)",
                                }}
                              />
                            )}
                            <div className="relative flex items-center gap-3">
                              <div
                                className={`h-8 w-8 rounded-md grid place-items-center shrink-0 ${
                                  active
                                    ? "bg-background/15 text-accent ring-1 ring-background/20"
                                    : "bg-muted text-ink-soft"
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium leading-tight">{r.label}</div>
                                <div
                                  className={`text-[11px] mt-0.5 ${
                                    active ? "text-background/70" : "text-muted-foreground"
                                  }`}
                                >
                                  {r.description}
                                </div>
                              </div>
                              <div
                                className={`ml-auto h-4 w-4 rounded-full border shrink-0 transition-all ${
                                  active
                                    ? "border-background bg-accent"
                                    : "border-line group-hover:border-line-strong"
                                }`}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="you@company.com"
                    className="h-11 pl-9 bg-paper/40"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground">
                    Password
                  </Label>
                  {mode === "signin" && (
                    <span className="text-[11px] text-muted-foreground">Min. 6 characters</span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    placeholder="••••••••"
                    className="h-11 pl-9 bg-paper/40"
                  />
                </div>
              </div>

              {/* Submit with accent glow */}
              <div className="relative pt-1">
                <div className="absolute inset-x-4 -bottom-1 h-4 rounded-full bg-accent/25 blur-xl opacity-70" />
                <Button
                  type="submit"
                  className="relative w-full h-11 font-medium group"
                  disabled={loading || (mode === "signup" && isAdminEmail)}
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full border-2 border-background/40 border-t-background animate-spin" />
                      Processing
                    </span>
                  ) : (
                    <>
                      {mode === "signin" ? "Sign in to console" : "Request access"}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Footer switch + legal — kept inside the card */}
            <div className="mt-7 pt-5 border-t border-line space-y-3 text-center">
              <div className="text-xs text-muted-foreground">
                {mode === "signin" ? "New to TransitOps?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  className="font-medium text-foreground underline-offset-4 hover:underline hover:text-accent transition-colors"
                  onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
                >
                  {mode === "signin" ? "Create an account" : "Sign in instead"}
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                By continuing you agree to our{" "}
                <span className="underline underline-offset-2">Terms</span> and{" "}
                <span className="underline underline-offset-2">Privacy Policy</span>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────  GOOGLE FIRST-TIME ROLE PICKER (modal)  ─────────── */}
      {googleUser && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="google-role-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-md">
            {/* Halo */}
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-accent/40 via-line to-ink/10 opacity-90" />
            <div className="relative rounded-2xl bg-background border border-line shadow-[0_30px_80px_-24px_rgba(0,0,0,0.35)] p-7">
              <div className="mb-5">
                <div className="inline-flex items-center gap-2 mb-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-accent" />
                  One more step
                </div>
                <h3 id="google-role-title" className="font-display text-2xl leading-tight tracking-tight">
                  Choose your role
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Welcome{googleUser.displayName ? `, ${googleUser.displayName.split(" ")[0]}` : ""}.
                  Pick the role that best fits your work. New accounts require admin approval.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 mb-6">
                {SIGNUP_ROLES.map((r) => {
                  const active = googleRole === r.value;
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setGoogleRole(r.value)}
                      disabled={googleSaving}
                      className={`group relative text-left px-4 py-3 rounded-lg border transition-all overflow-hidden ${
                        active
                          ? "border-ink bg-ink text-background shadow-md shadow-ink/10"
                          : "border-line bg-paper/40 hover:bg-paper hover:border-line-strong"
                      }`}
                    >
                      {active && (
                        <span
                          className="pointer-events-none absolute inset-0 opacity-40"
                          style={{
                            background:
                              "radial-gradient(60% 100% at 100% 50%, color-mix(in oklab, var(--accent) 55%, transparent), transparent 60%)",
                          }}
                        />
                      )}
                      <div className="relative flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-md grid place-items-center shrink-0 ${
                            active
                              ? "bg-background/15 text-accent ring-1 ring-background/20"
                              : "bg-muted text-ink-soft"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium leading-tight">{r.label}</div>
                          <div
                            className={`text-[11px] mt-0.5 ${
                              active ? "text-background/70" : "text-muted-foreground"
                            }`}
                          >
                            {r.description}
                          </div>
                        </div>
                        <div
                          className={`ml-auto h-4 w-4 rounded-full border shrink-0 transition-all ${
                            active
                              ? "border-background bg-accent"
                              : "border-line group-hover:border-line-strong"
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="h-10 px-4"
                  onClick={cancelGoogleRole}
                  disabled={googleSaving}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  className="h-10 flex-1 group"
                  onClick={confirmGoogleRole}
                  disabled={googleSaving}
                  type="button"
                >
                  {googleSaving ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full border-2 border-background/40 border-t-background animate-spin" />
                      Saving
                    </span>
                  ) : (
                    <>
                      Request access
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground text-center">
                Signed in as{" "}
                <span className="font-mono text-foreground">{googleUser.email}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
