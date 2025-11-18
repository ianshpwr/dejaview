'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const router = useRouter();

  // Fast local JWT check to prevent redirect flicker
  const isTokenValidLocally = (token) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (!payload) return false;
      const now = Math.floor(Date.now() / 1000);
      return !payload.exp || payload.exp > now;
    } catch {
      return false;
    }
  };

  // Redirect away from /auth when already authenticated
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      if (typeof window === 'undefined') return;
      const token = localStorage.getItem('token');
      if (!token) return;

      // If token looks valid locally, go straight to dashboard (avoid network call)
      if (isTokenValidLocally(token)) {
        router.replace('/dashboard');
        return;
      }

      // Otherwise try server verify once; if valid, redirect, else remove token
      try {
        const res = await fetch('https://dejaview-l2o0.onrender.com/auth/verify', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });

        if (res.ok) {
          router.replace('/dashboard');
        } else {
          localStorage.removeItem('token');
        }
      } catch (err) {
        // network error — don't remove token if local check passed (we already handled that case).
        // If token was invalid locally and network failed, keep user on /auth (no redirect).
        console.warn('Auth verify network error:', err);
      }
    };

    checkAuthAndRedirect();
  }, [router]);


  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  /* ----------------------------------------------------
        🔥 API CALLS HAPPEN HERE
     ---------------------------------------------------- */
  const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);
  setSuccess(null);
  setIsLoading(true);

  const endpoint =
    mode === 'login'
      ? 'https://dejaview-l2o0.onrender.com/auth/login'
      : 'https://dejaview-l2o0.onrender.com/auth/signup';

  const body =
    mode === 'login'
      ? { email, password }
      : { name, email, password };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    if (mode === 'login') {
      localStorage.setItem('token', data.token);

      // 🔥 Redirect user to dashboard
      router.push("/dashboard");
    } else {
      setSuccess('Account created! You can now log in.');
    }
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="
      relative flex min-h-screen w-full flex-col items-center justify-center 
      bg-[#F8F9FF] /* updated from bg-white */
      overflow-hidden 
      p-4 sm:p-6 lg:p-12
    ">
      {/* Background */}
      <div className="absolute top-0 right-0 w-1/3 max-w-xs md:max-w-sm lg:max-w-md">
        <div className="w-full aspect-square bg-center bg-no-repeat bg-cover"
          style={{
            backgroundImage:
              'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBqjwmLfCCA1Qz9wsgGN5MXDaxYtuvrkkhdH7S_QV4sFnbKzHC6NA9LTl2rnJW67vV8QVArqIvSB9-uOd4bdJeUTgwUWDF8t8IpHJ7MisoVO6W6Y_FYItQCvIbTK1SK5nUm8fO42bSrfl3-L6XTANmCLtYofApNOKCQB2WSCrZd2-rH6jrhg9dVDBpDAXwxnmKcIM62oFk_sXD4xpil6RNZs-5eanWxnbwPe99c5SbXPL8stgFq8HebW9HdYTrNHHuHH7onNonVTXY")',
            maskImage: 'radial-gradient(circle, white 70%, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(circle, white 70%, transparent 72%)',
          }}
        />
      </div>

      <div className="flex flex-col w-full max-w-sm md:max-w-lg z-10">
        <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10">

          {/* TITLE */}
          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="text-[#4A4D6B] text-3xl sm:text-4xl lg:text-6xl font-black">
              DejaView
            </div>

            <p className="text-[#4A4D6B] text-sm sm:text-base lg:text-2xl font-normal">
              {mode === 'login' ? 'Welcome Back' : 'Create Your Memory Space'}
            </p>
          </div>

          {/* TABS */}
          <div className="flex w-full bg-gray-100 p-1 sm:p-2 lg:p-3 rounded-lg">
            <button
              onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
              className={`w-1/2 py-2 sm:py-2 lg:py-4 rounded-md text-sm sm:text-base lg:text-lg font-bold ${
                mode === 'login'
                  ? 'bg-primary text-black shadow'
                  : 'text-[#4A4D6B] hover:bg-gray-200'
              }`}
            >
              Log In
            </button>

            <button
              onClick={() => { setMode('signup'); setError(null); setSuccess(null); }}
              className={`w-1/2 py-2 sm:py-2 lg:py-4 rounded-md text-sm sm:text-base lg:text-lg font-bold ${
                mode === 'signup'
                  ? 'bg-primary text-black shadow'
                  : 'text-[#4A4D6B] hover:bg-gray-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4 lg:gap-6">
            {/* NAME (signup only) */}
            {mode === 'signup' && (
              <label className="flex flex-col w-full">
                <p className="text-[#4A4D6B] text-sm sm:text-base lg:text-lg pb-1">Name</p>
                <input
                  className="rounded-xl border border-black bg-white h-10 sm:h-12 lg:h-16 px-3 lg:px-4 text-sm sm:text-base lg:text-lg"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            )}

            {/* EMAIL */}
            <label className="flex flex-col w-full">
              <p className="text-[#4A4D6B] text-sm sm:text-base lg:text-lg pb-1">Email</p>
              <input
                className="rounded-xl border border-black bg-white h-10 sm:h-12 lg:h-16 px-3 lg:px-4 text-sm sm:text-base lg:text-lg"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            {/* PASSWORD */}
            <label className="flex flex-col w-full">
              <div className="flex justify-between pb-1">
                <p className="text-[#4A4D6B] text-sm sm:text-base lg:text-lg">Password</p>

                {mode === 'login' && (
                  <Link href="/forgot-password" className="text-[#7E95F7] text-xs sm:text-sm lg:text-base">
                    Forgot Password?
                  </Link>
                )}
              </div>

              <div className="relative">
                <input
                  className="rounded-xl border border-black bg-white h-10 sm:h-12 lg:h-16 px-3 pr-10 lg:px-4 text-sm sm:text-base lg:text-lg w-full"
                  placeholder={mode === 'login' ? 'Enter your password' : 'Create a strong password'}
                  type={passwordVisible ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  <span className="material-symbols-outlined text-sm sm:text-base lg:text-lg">
                    {passwordVisible ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </label>

            {/* FEEDBACK + BUTTON */}
            <div className="flex flex-col items-center gap-2 lg:gap-3 pt-2 lg:pt-3">
              {error && <p className="text-red-500 text-xs sm:text-sm lg:text-base">{error}</p>}
              {success && <p className="text-green-500 text-xs sm:text-sm lg:text-base">{success}</p>}

              <button
                type="submit"
                className="w-full h-12 sm:h-14 lg:h-16 rounded-xl bg-[#7E95F7] text-sm sm:text-base lg:text-lg font-bold text-white hover:bg-opacity-90 disabled:opacity-60"
                disabled={isLoading}
              >
                {isLoading
                  ? mode === 'login' ? 'Logging In...' : 'Creating Account...'
                  : mode === 'login' ? 'Log In' : 'Create Account'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
