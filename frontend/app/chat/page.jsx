"use client";

import Navbar from "../navbar";
import { useState, useEffect } from "react";

// Decode JWT payload safely
function decodeJWT(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch (err) {
    console.error("Invalid JWT:", err);
    return null;
  }
}

export default function JournalPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  // Load userId from localStorage token
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      const decoded = decodeJWT(token);
      if (decoded?.userId) {
        setUserId(decoded.userId);
      } else {
        console.warn("userId not found inside JWT payload");
      }
    }
  }, []);

  // 🔥 POST API CALL
  const searchEntries = async () => {
    if (!query.trim()) return;

    if (!userId) {
      console.error("User ID missing from decoded JWT");
      return;
    }

    // Add user message immediately
    const userMessage = { role: "user", content: query };
    setMessages((prev) => [userMessage, ...prev]);

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/journal/entries/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 🔥 Token added
        },
        body: JSON.stringify({
          query,
          userId, // 🔥 Send extracted userId
        }),
      });

      const data = await res.json();
      console.log(data)
      // 1️⃣ Add AI answer
      const aiMessage = {
        role: "assistant",
        content: data.answer || "No response received.",
      };
      setMessages((prev) => [aiMessage, ...prev]);

      // 2️⃣ Add related memories (correct key)
      if (data.memories && data.memories.length > 0) {
        const memoryMessage = {
          role: "assistant",
          content: `Found ${data.memories.length} related memories:`,
          memories: data.memories,
        };
        setMessages((prev) => [memoryMessage, ...prev]);
      }
    } catch (error) {
      console.error("Post request error:", error);
    } finally {
      setLoading(false);
      setQuery(""); // clear input
    }
  };

  return (
    <div className="min-h-screen bg-bg-off-white flex flex-col">
      <Navbar />

      {/* Chat Container */}
      <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 flex flex-col-reverse gap-4 overflow-y-auto">

        {/* Input always at bottom */}
        <div className="sticky bottom-0 bg-bg-off-white pb-4">
          <div className="w-full h-16 px-4 py-3 shadow-lg shadow-accent/10">
            <div className="flex w-full items-center bg-white/80 rounded-xl h-full">
              <div className="text-accent pl-5">
                <span className="material-symbols-outlined text-2xl">
                  search
                </span>
              </div>

              <input
                className="flex-1 bg-transparent border-none text-lg px-4 focus:outline-0"
                placeholder="Ask or search anything…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchEntries()}
              />

              <button
                onClick={searchEntries}
                className="mr-4 px-4 py-2 rounded-lg bg-primary text-white font-medium"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Messages appear TOP → DOWN */}
        <div className="flex flex-col gap-4 pb-24">
          {loading && (
            <p className="text-center text-accent font-medium">Thinking…</p>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl shadow-md ${
                msg.role === "user"
                  ? "bg-primary/20 border border-primary/40 text-primary"
                  : "bg-white/70 border border-accent/10 text-text-charcoal"
              }`}
            >
              <p className="text-base whitespace-pre-wrap">{msg.content}</p>

              {/* Memory cards */}
              {msg.memories && (
                <div className="mt-3 space-y-3">
                  {msg.memories.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-lg bg-white border border-accent/20"
                    >
                      <p className="font-semibold text-accent">{m.title}</p>
                      <p className="text-sm mt-1">{m.content}</p>
                      <p className="text-xs text-text-charcoal/50 mt-2">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
