"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// We'll use lucide-react for icons.
// In a real Next.js app, you'd install this with: npm install lucide-react
import { Mail, Lock, User, Loader2 } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // Replaced 'error' state with a 'message' state for all feedback
  const [message, setMessage] = useState({ type: "", content: "" });
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Check if user is already logged in
  useEffect(() => {
    const checkExistingAuth = async () => {
      const token = localStorage.getItem("token");
      
      if (token) {
        try {
          // Validate existing token
          const res = await fetch("https://dejaview-l2o0.onrender.com/auth/verify", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          });

          if (res.ok) {
            // Valid token exists, redirect to dashboard
            router.push("/dashboard");
          } else {
            // Invalid token, remove it
            localStorage.removeItem("token");
          }
        } catch (error) {
          // Network error or invalid token
          localStorage.removeItem("token");
        }
      }
    };

    checkExistingAuth();
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", content: "" }); // Clear previous messages
    setLoading(true);

    // Prune formData based on login/signup
    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : formData;

    const endpoint = isLogin
      ? "https://dejaview-l2o0.onrender.com/auth/login"
      : "https://dejaview-l2o0.onrender.com/auth/signup";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Something went wrong");

      if (isLogin) {
        localStorage.setItem("token", data.token);
        // Set a success message before redirecting
        setMessage({ type: "success", content: "Login successful! Redirecting..." });
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000); // Give user a moment to see the message
      } else {
        // Set success message for signup
        setMessage({ type: "success", content: "Signup successful! Please log in." });
        setIsLogin(true);
        // Clear form for login
        setFormData({ name: "", email: "", password: "" }); 
      }
    } catch (err) {
      // Set a user-friendly error message
      setMessage({ type: "error", content: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#F8F9FA] text-[#2F2F2F] font-[Inter] relative overflow-hidden p-4">
      {/* Decorative watercolor blurs - enhanced */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#A7C7E7] rounded-full opacity-40 blur-[100px]"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#A8C3A0] rounded-full opacity-40 blur-[100px]"></div>
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#E6D1E1] rounded-full opacity-30 blur-[100px]"></div>

      <form
        onSubmit={handleSubmit}
        className="relative z-10 bg-white/80 backdrop-blur-lg p-8 md:p-10 rounded-2xl shadow-2xl shadow-black/10 w-full max-w-md space-y-5 border border-white/30"
      >
        <h2 className="text-3xl md:text-4xl font-[Cormorant_Garamond] text-center font-semibold text-[#3B3B3B] tracking-tight">
          {isLogin ? "Welcome Back 🌿" : "Create Account 🌸"}
        </h2>

        {!isLogin && (
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              name="name"
              placeholder="Full Name"
              onChange={handleChange}
              value={formData.name}
              className="w-full p-3 pl-10 bg-gray-50/70 border border-gray-200 rounded-lg text-[#2F2F2F] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#A8C3A0]/50 transition-all duration-300"
              required
            />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            value={formData.email}
            className="w-full p-3 pl-10 bg-gray-50/70 border border-gray-200 rounded-lg text-[#2F2F2F] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#A7C7E7]/50 transition-all duration-300"
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            value={formData.password}
            className="w-full p-3 pl-10 bg-gray-50/70 border border-gray-200 rounded-lg text-[#2F2F2F] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#A7C7E7]/50 transition-all duration-300"
            required
          />
        </div>

        {/* Improved Message/Error Display */}
        {message.content && (
          <div
            className={`w-full p-3 rounded-lg text-center text-sm font-medium ${
              message.type === 'error'
                ? 'bg-red-100 text-red-700 border border-red-200/50'
                : 'bg-green-100 text-green-700 border border-green-200/50'
            }`}
          >
            {message.content}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#A8C3A0] hover:bg-[#9BB795] p-3 rounded-lg text-white font-semibold shadow-md
                     flex items-center justify-center gap-2
                     transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98]
                     focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8C3A0]
                     disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {isLogin ? "Logging in..." : "Creating..."}
            </>
          ) : isLogin ? (
            "Login"
          ) : (
            "Sign Up"
          )}
        </button>

        <p className="text-sm text-center pt-2 text-gray-700">
          {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage({ type: "", content: "" }); // Clear messages on toggle
            }}
            className="text-[#6BA292] font-semibold hover:underline"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </form>

      {/* Subtle bottom line art */}
      <div className="absolute bottom-4 text-gray-500 text-sm font-medium">
        one thought at a time ✨
      </div>
    </div>
  );
}