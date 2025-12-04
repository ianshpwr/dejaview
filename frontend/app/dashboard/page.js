"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../navbar";
import Link from "next/link";

export default function Dashboard() {
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState("latest"); // ⭐ NEW STATE

  const router = useRouter();

  const decodeTokenPayload = (token) => {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      return payload || null;
    } catch {
      return null;
    }
  };

  const getUserFromToken = async () => {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("token");
    if (!token) return null;

    const payload = decodeTokenPayload(token);
    if (
      payload &&
      ((payload.exp &&
        payload.exp > Math.floor(Date.now() / 1000)) ||
        !payload.exp)
    ) {
      return {
        id: payload.id || payload.sub || payload.userId,
        name: payload.name || null,
        email: payload.email || null,
      };
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/verify`, {
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
        localStorage.removeItem("token");
        router.replace("/auth");
        return;
      }

      const token = localStorage.getItem("token");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/journal/entries/${user.id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.message || "Failed to load entries");
      }

      const data = await res.json();
      const entries = Array.isArray(data.entries)
        ? data.entries
        : Array.isArray(data)
        ? data
        : [];

      // ⭐ SORT IMMEDIATELY AFTER FETCH
      const sorted = sortEntries(entries, sortOrder);
      setJournalEntries(sorted);

    } catch (err) {
      setError(err?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // ⭐ SORT FUNCTION
  const sortEntries = (entries, order) => {
    return [...entries].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return order === "latest" ? dateB - dateA : dateA - dateB;
    });
  };

  // ⭐ HANDLE SORT CHANGE
  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSortOrder(newSort);
    setJournalEntries(sortEntries(journalEntries, newSort));
  };

  // ⭐ DELETE FUNCTION
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this memory?")) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/journal/entries/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to delete entry");

      setJournalEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      alert("Error deleting entry: " + err.message);
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
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <Navbar />
        </div>
      </header>

      <main className="flex-1 w-full lg:w-[70vw] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10">

        {/* Header Section */}
        <div className="mb-8 lg:mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">

          {/* New Memory */}
          <div className="px-4 py-2 bg-[#7E95F7] text-white rounded-xl font-bold shadow hover:bg-opacity-90">
            <Link href="/write">+ New Memory</Link>
          </div>

          {/* ⭐ SORT DROPDOWN */}
          <select
            value={sortOrder}
            onChange={handleSortChange}
            className="px-4 py-2 rounded-xl bg-white border border-gray-300 shadow-sm text-[#4A4D6B] hover:border-[#7E95F7] focus:outline-none focus:ring-2 focus:ring-[#7E95F7]"
          >
            <option value="latest">📅 Latest First</option>
            <option value="oldest">🕒 Oldest First</option>
          </select>

        </div>

        {loading && <p className="text-lg">Loading...</p>}
        {error && <p className="text-red-500 text-lg">{error}</p>}

        {/* Entries */}
        <div className="flex flex-col gap-6 lg:gap-8">
          {journalEntries.map((entry) => (
            <article
              key={entry.id}
              className="bg-white rounded-2xl shadow-md border p-4 lg:p-6 hover:shadow-lg transition"
            >
              <p className="text-sm text-gray-500">
                {entry.createdAt
                  ? new Date(entry.createdAt).toLocaleDateString()
                  : "—"}
              </p>

              <h2 className="text-xl lg:text-2xl font-bold mt-2">
                {entry.title || "Untitled"}
              </h2>

              <p className="text-base text-[#4A4D6B] mt-4 whitespace-pre-line">
                {entry.content || "No content"}
              </p>

              <span className="inline-block mt-4 px-4 py-2 text-xs rounded-full bg-[#E0E4FF]">
                {entry.mood || "Memory"}
              </span>

              <button
                onClick={() => handleDelete(entry.id)}
                className="mt-4 ml-3 px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Delete
              </button>
            </article>
          ))}

          {!loading && journalEntries.length === 0 && (
            <p className="text-center text-gray-500 text-lg">
              No entries found.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
