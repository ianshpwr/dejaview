"use client";

import { useState, useEffect } from "react"; // Added useEffect
import { useRouter } from "next/navigation";
import Navbar from "./../navbar";

// Lucide Icons
import { Smile, Frown, AlertCircle, Heart, Meh, Sparkles, Loader2 } from "lucide-react";

export default function NewJournalEntry() {
  const router = useRouter();
  
  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  
  // User State
  const [userId, setUserId] = useState(null); // Initialize as null
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const moods = [
    { name: "Happy", icon: Smile },
    { name: "Sad", icon: Frown },
    { name: "Anxious", icon: AlertCircle },
    { name: "Grateful", icon: Heart },
    { name: "Neutral", icon: Meh },
  ];

  // ---------------------------------------------------------
  // NEW: Extract userId from LocalStorage Token on Mount
  // ---------------------------------------------------------
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("You are not logged in.");
      // Optional: router.push("/login");
      return;
    }

    try {
      // 1. Split the token to get the payload (2nd part)
      const base64Url = token.split('.')[1];
      
      // 2. Convert Base64Url to Base64
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      
      // 3. Decode Base64 to string
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      // 4. Parse JSON
      const decoded = JSON.parse(jsonPayload);

      // 5. Extract ID (Checks for common keys: userId, _id, id, or sub)
      const extractedId = decoded.userId || decoded._id || decoded.id || decoded.sub;

      if (extractedId) {
        setUserId(extractedId);
      } else {
        console.error("User ID not found in token payload");
        setError("Invalid session data.");
      }

    } catch (err) {
      console.error("Failed to decode token:", err);
      setError("Session error. Please login again.");
    }
  }, []);

  const handleSave = async () => {
    // Validation: content + ensuring we have a userId
    if (!title.trim() || !content.trim()) {
      setError("Please fill out both title and content.");
      return;
    }

    if (!userId) {
      setError("User ID missing. Please try logging in again.");
      return;
    }
    
    setError(""); 
    setIsLoading(true);

    try {
      // Retrieve token again for the Authorization header (Best Practice)
      const token = localStorage.getItem("token"); 

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/journal/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Ideally, you should also send the token in headers for security:
          // "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          title,
          content,
          mood, // Don't forget to send the mood if the API supports it!
          userId // Using the state variable we extracted
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save entry");
      }

      const data = await response.json();
      console.log("Success:", data);
      
      router.push("/dashboard");
      
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FF] text-[#4A4D6B]">
      {/* Sticky Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <Navbar />
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 w-full lg:w-[70vw] mx-auto px-4 sm:px-6 lg:px-10 py-10 flex justify-center">
        <div className="w-full flex flex-col gap-8">
          {/* Page Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-extrabold text-gray-900">New Journal Entry</h1>
            <p className="text-gray-600 text-base">Let your thoughts flow onto the page.</p>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 sm:p-8 md:p-10 flex flex-col gap-8">
            
            {/* Error Message Display */}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Title + Content */}
            <div className="flex flex-col gap-6">
              <input
                type="text"
                placeholder="A new memory..."
                value={title}
                disabled={isLoading}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-2xl sm:text-3xl font-bold text-gray-900 bg-transparent border-b border-gray-300 
                focus:border-[#7E95F7] focus:outline-none placeholder-gray-400 p-0 disabled:opacity-50"
              />

              <textarea
                placeholder="Start writing here. Let your thoughts flow..."
                value={content}
                disabled={isLoading}
                onChange={(e) => setContent(e.target.value)}
                className="w-full rounded-xl text-base text-[#4A4D6B] bg-white border border-gray-200 
                focus:outline-none focus:border-[#7E95F7] p-4 min-h-[16rem] resize-none placeholder-gray-400 disabled:bg-gray-50"
              />
            </div>

            {/* Mood Selection */}
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-semibold text-gray-900">Select your mood</h3>

              <div className="flex flex-wrap gap-3">
                {moods.map((m) => (
                  <button
                    key={m.name}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setMood(m.name)}
                    className={`flex items-center gap-2 h-10 px-4 rounded-full transition-colors font-medium disabled:opacity-50
                      ${
                        mood === m.name
                          ? "bg-[#7E95F7] text-white shadow-sm"
                          : "bg-[#E0E4FF] text-[#4A4D6B] hover:bg-[#7E95F7]/20 hover:text-[#7E95F7]"
                      }`}
                  >
                    <m.icon className="w-5 h-5" />
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-200 pt-6 flex flex-wrap items-center justify-between gap-4">
              <button 
                disabled={isLoading}
                className="flex items-center gap-2 text-gray-500 hover:text-[#7E95F7] transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-5 h-5" />
                AI Suggestions
              </button>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="h-11 px-6 rounded-lg bg-transparent text-gray-600 text-sm font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  disabled={isLoading || !userId} // Disable if we couldn't load user ID
                  className="h-11 px-6 rounded-lg bg-[#7E95F7] text-white text-sm font-bold hover:bg-[#6E85E6] transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Entry"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}