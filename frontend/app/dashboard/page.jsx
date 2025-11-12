"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Import the LogOut icon
import { LogOut } from "lucide-react";

/**
 * A full-screen dashboard component that displays the
 * text "dejaview" with a blinking (pulse) animation
 * and includes a logout button.
 */
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/auth");
        return;
      }

      try {
        // Validate token with backend
        const res = await fetch(
          "https://dejaview-l2o0.onrender.com/auth/verify",
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          throw new Error("Invalid token");
        }

        const userData = await res.json();
        setUser(userData);
      } catch (error) {
        // Invalid token, remove it and redirect
        localStorage.removeItem("token");
        router.push("/auth");
        return;
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A8C3A0] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-[Cormorant_Garamond] text-[#3B3B3B]">
            Welcome to DejaView
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              Hello, {user?.name || user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="bg-white rounded-lg p-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-[#3B3B3B]">
            Dashboard Content
          </h2>
          <p className="text-gray-600">
            This is your protected dashboard. Only authenticated users can see
            this.
          </p>
        </div>
      </div>
    </div>
  );
}