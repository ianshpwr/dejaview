"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "./../navbar";

export default function Dashboard() {
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const router = useRouter();

  const getUserFromToken = async () => {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const res = await fetch("https://dejaview-l2o0.onrender.com/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return null;
      const data = await res.json();
      return data.user || data;
    } catch {
      return null;
    }
  };

  const fetchEntries = async () => {
    try {
      const user = await getUserFromToken();
      if (!user) {
        router.push("/");
        return;
      }

      const res = await fetch(`https://dejaview-l2o0.onrender.com/journal/entries/${user.id}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || "Failed to load entries");

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
      router.push("/");
      return;
    }
    fetchEntries();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      {/* Sticky header with Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <Navbar />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full max-w-4xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10">
        {/* Header + CTA */}
        <div className="mb-8 lg:mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 lg:gap-6">

          <button className="px-4 py-2 lg:px-6 lg:py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition text-base lg:text-lg">
            + New Memory
          </button>
        </div>

        {/* Loading & Error */}
        {loading && <p className="text-gray-700 text-base lg:text-lg">Loading...</p>}
        {error && <p className="text-red-500 text-base lg:text-lg">{error}</p>}

        {/* Entries */}
        <div className="flex flex-col gap-6 lg:gap-8">
          {journalEntries.map((entry) => (
            <article
              key={entry.id ?? entry._id}
              className="bg-white rounded-xl lg:rounded-2xl shadow-md border border-gray-200 p-4 lg:p-8 hover:shadow-lg transition"
            >
              <p className="text-sm lg:text-base text-gray-500">
                {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "—"}
              </p>

              <h2 className="text-xl lg:text-2xl font-semibold mt-2 text-black">{entry.title || "Untitled"}</h2>

              <p className="text-base lg:text-lg text-gray-700 mt-4 whitespace-pre-line">{entry.content || "No content"}</p>

              <span className="inline-block mt-4 px-3 lg:px-4 py-1 lg:py-2 text-xs lg:text-sm rounded-full bg-gray-100 text-gray-800">
                {entry.mood || "Memory"}
              </span>
            </article>
          ))}

          {!loading && journalEntries.length === 0 && (
            <p className="text-center text-gray-600 text-base lg:text-lg">No entries found.</p>
          )}
        </div>
      </main>
    </div>
  );
}
