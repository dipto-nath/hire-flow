"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AnimatedGradient, { GradientConfig } from "@/components/ui/animated-gradient";
import { LiquidGlassCard } from "@/components/ui/liquid-weather-glass";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";

const gradientConfig: GradientConfig = {
  preset: "custom",
  color1: "#ffffff", // white
  color2: "#f3e8ff", // light purple/cream
  color3: "#ffedd5", // light orange/cream
  rotation: 45,
  proportion: 50,
  scale: 1,
  speed: 15,
  distortion: 20,
  swirl: 30,
  swirlIterations: 5,
  softness: 80,
  offset: 0,
  shape: "Edge",
  shapeSize: 20,
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-50">
      {/* Background Mesh */}
      <div className="absolute inset-0 z-0">
        <AnimatedGradient config={gradientConfig} />
      </div>

      {/* Foreground Form */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 pointer-events-none">
        <div className="w-full max-w-md pointer-events-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">HireFlow</h1>
            <p className="text-gray-500 mt-2 font-medium">AI Recruitment Intelligence</p>
          </div>
          <LiquidGlassCard
            shadowIntensity="md"
            glowIntensity="sm"
            blurIntensity="xl"
            borderRadius="1.5rem"
            className="p-8 bg-white/40 border border-white/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
              <p className="text-gray-500 text-sm">
                Sign in to continue to your dashboard
              </p>
            </div>

            {error && (
              <div
                className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2"
                role="alert"
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-gray-700 text-sm font-medium mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"
                    aria-hidden="true"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3 bg-white/70 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-gray-700 text-sm font-medium mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"
                    aria-hidden="true"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full pl-10 pr-12 py-3 bg-white/70 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900/50 focus:ring-offset-2 focus:ring-offset-white/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-500 text-sm">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-gray-900 hover:text-gray-700 font-medium transition-colors"
                >
                  Create one
                </Link>
              </p>
            </div>
          </LiquidGlassCard>

          <div className="mt-6 text-center text-gray-400 text-xs font-medium">
            <p>Demo credentials: admin@hireflow.com / admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}
