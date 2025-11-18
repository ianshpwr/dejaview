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
      const res = await fetch(
        "https://dejaview-l2o0.onrender.com/auth/verify",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) return null;
      const data = await res.json();
      return data.user || data; // tolerate different backend shapes
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

      const res = await fetch(
        `https://dejaview-l2o0.onrender.com/journal/entries/${user.id}`
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || "Failed to load entries");

      // Normalize entries whether backend returns { entries: [...] } or [...]
      const entries = Array.isArray(data)
        ? data
        : Array.isArray(data.entries)
        ? data.entries
        : [];

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
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-[#111118] dark:text-white/90">
      {/* Sticky header with Navbar */}
      <header className="sticky top-0 z-30 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Navbar />
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-4xl font-black">All Entries</h1>
          <button className="px-4 py-2 bg-primary text-white rounded-lg font-bold">
            + New Memory
          </button>
        </div>

        {loading && <p className="text-gray-600">Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}

        <div className="flex flex-col gap-6">
          {journalEntries.map((entry) => (
            <article
              key={entry.id ?? entry._id}
              className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 border dark:border-gray-800"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {entry.createdAt
                  ? new Date(entry.createdAt).toLocaleDateString()
                  : "—"}
              </p>

              <h2 className="text-lg font-bold mt-1">
                {entry.title || "Untitled"}
              </h2>

              <p className="text-gray-600 dark:text-gray-300 mt-2 whitespace-pre-line">
                {entry.content || "No content"}
              </p>

              <span className="inline-block mt-3 px-3 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                {entry.mood || "Memory"}
              </span>
            </article>
          ))}

          {!loading && journalEntries.length === 0 && (
            <p className="text-center text-gray-500">No entries found.</p>
          )}
        </div>
      </main>
    </div>
  );
}
