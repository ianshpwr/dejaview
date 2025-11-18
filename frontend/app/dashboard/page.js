"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../navbar";

export default function Dashboard() {
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const router = useRouter();

  const decodeTokenPayload = (token) => {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload || null;
    } catch {
      return null;
    }
  };

  const getUserFromToken = async () => {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("token");
    if (!token) return null;

    // Try local decode first (fast, prevents flicker)
    const payload = decodeTokenPayload(token);
    if (payload && ((payload.exp && payload.exp > Math.floor(Date.now() / 1000)) || !payload.exp)) {
      // map common id fields
      return {
        id: payload.id || payload.sub || payload.userId,
        name: payload.name || null,
        email: payload.email || null,
      };
    }

    // Fallback to server verify only if local decode failed
    try {
      const res = await fetch("https://dejaview-l2o0.onrender.com/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user || data || null;
    } catch {
      return null;
    }
  };

  const fetchEntries = async () => {
    try {
      const user = await getUserFromToken();

      if (!user) {
        // no valid token/user -> send to auth
        localStorage.removeItem("token");
        router.replace("/auth");
        return;
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        localStorage.removeItem("token");
        router.replace("/auth");
        return;
      }

      let res;
      let data;

      // 1) Try the user-id endpoint first (avoid 404 from token-only endpoint)
      if (user.id) {
        res = await fetch(`https://dejaview-l2o0.onrender.com/journal/entries/${user.id}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          router.replace("/auth");
          return;
        }

        if (res.ok) {
          data = await res.json().catch(() => ({}));
          const entries = Array.isArray(data) ? data : Array.isArray(data.entries) ? data.entries : [];
          setJournalEntries(entries);
          return;
        }
        // if not ok (e.g. 404), fall through to try token-only endpoint
      }

      // 2) Fallback: try token-only endpoint
      res = await fetch("https://dejaview-l2o0.onrender.com/journal/entries", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        router.replace("/auth");
        return;
      }

      if (!res.ok) {
        // surface backend message when available
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.message || "Failed to load entries");
      }

      data = await res.json().catch(() => ({}));
      const entries = Array.isArray(data) ? data : Array.isArray(data.entries) ? data.entries : [];
      setJournalEntries(entries);
    } catch (err) {
      setError(err?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/auth");
      return;
    }
    fetchEntries();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FF] text-[#4A4D6B]">
      {/* Sticky header with Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <Navbar />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full max-w-4xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10">
        {/* Header + CTA */}
        <div className="mb-8 lg:mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 lg:gap-6">
          <button className="px-4 py-2 lg:px-6 lg:py-3 bg-[#7E95F7] text-white rounded-xl font-bold hover:bg-opacity-90 transition text-base lg:text-lg shadow">
            + New Memory
          </button>
        </div>

        {/* Loading & Error */}
        {loading && <p className="text-[#4A4D6B] text-base lg:text-lg">Loading...</p>}
        {error && <p className="text-red-500 text-base lg:text-lg">{error}</p>}

        {/* Entries */}
        <div className="flex flex-col gap-6 lg:gap-8">
          {journalEntries.map((entry) => (
            <article
              key={entry.id ?? entry._id}
              className="bg-white rounded-2xl shadow-md border border-gray-200 p-4 lg:p-6 hover:shadow-lg transition"
            >
              <p className="text-sm lg:text-base text-gray-500">
                {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "—"}
              </p>

              <h2 className="text-xl lg:text-2xl font-bold mt-2">{entry.title || "Untitled"}</h2>

              <p className="text-base md:text-lg text-[#4A4D6B] mt-4 whitespace-pre-line">
                {entry.content || "No content"}
              </p>

              <span className="inline-block mt-4 px-3 lg:px-4 py-1 lg:py-2 text-xs lg:text-sm rounded-full bg-[#E0E4FF] text-[#black]">
                {entry.mood || "Memory"}
              </span>
            </article>
          ))}

          {!loading && journalEntries.length === 0 && (
            <p className="text-center text-gray-500 text-base lg:text-lg">No entries found.</p>
          )}
        </div>
      </main>
    </div>
  );
}
