"use client";

import Navbar from "../navbar";
import { useState, useEffect } from "react";

function decodeJWT(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export default function JournalPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const decoded = decodeJWT(token);
    if (decoded?.userId) setUserId(decoded.userId);
  }, []);

  const searchEntries = async () => {
    if (!query.trim() || !userId) return;

    const userMessage = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);  // ⬅️ append, not prepend

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/journal/entries/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query, userId }),
      });

      const data = await res.json();

      const aiMessage = {
        role: "assistant",
        content: data.answer || "No response received.",
      };
      setMessages((prev) => [...prev, aiMessage]);

    } finally {
      setLoading(false);
      setQuery("");
    }
  };

  return (
    <div className="min-h-screen bg-[#white] flex flex-col text-gray-200">
      <Navbar />

      {/* CHAT WRAPPER */}
      <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 flex flex-col overflow-y-auto">

        {/* MESSAGES */}
        <div className="flex flex-col gap-4 pb-28">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[75%] px-4 py-3 rounded-2xl text-md whitespace-pre-wrap shadow
                ${
                  msg.role === "user"
                    ? "self-end bg-[#2563eb] text-white rounded-br-sm"
                    : "self-start bg-[#1f2933] text-gray-200 rounded-bl-sm"
                }
              `}
            >
              <p>{msg.content}</p>

              {msg.memories && (
                <div className="mt-3 space-y-3">

                </div>
              )}
            </div>
          ))}

          {loading && (
            <p className="self-start text-gray-400 text-sm">Thinking…</p>
          )}
        </div>

        {/* INPUT BAR */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#white] border-t border-gray-800 py-3">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center bg-[#0a0a1a] rounded-2xl border border-gray-700 px-4 py-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchEntries()}
                placeholder="Ask or search anything…"
                className="flex-1 bg-transparent text-gray-200 outline-none px-2 py-1"
              />

              <button
                onClick={searchEntries}
                className="ml-2 px-4 py-2 rounded-xl bg-green-500 text-black font-medium hover:brightness-110"
              >
                Send
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
