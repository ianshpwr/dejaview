import { motion, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { Feather, Brain, PenLine, BarChart2 } from "lucide-react";

export function LandingMarketing() {
  const router = useRouter();

  const handleAuth = () => {
    router.push("/auth");
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[#fff5d7] selection:bg-[#ffaaab]/30 selection:text-[#1f1a14] overflow-x-hidden font-sans">
      {/* ── Top Nav ── */}
      <nav className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#ffaaab]/30 border border-[#ff5e6c]/20 flex items-center justify-center">
            <Feather size={20} className="text-[#ff5e6c]" />
          </div>
          <span className="text-[22px] font-medium text-[#1f1a14]"
            style={{ fontFamily: "var(--font-playfair), Playfair Display, serif" }}>
            Dejaview
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleAuth}
            className="px-5 py-2.5 rounded-full border border-[#ff5e6c] text-[#ff5e6c] text-[14px] font-medium hover:bg-[#ff5e6c]/5 transition-colors"
            style={{ fontFamily: "var(--font-dm), DM Sans, sans-serif" }}>
            Log in
          </button>
          <button onClick={handleAuth}
            className="px-5 py-2.5 rounded-full bg-[#ff5e6c] text-white text-[14px] font-medium hover:bg-[#feb300] hover:text-[#1f1a14] transition-colors"
            style={{ fontFamily: "var(--font-dm), DM Sans, sans-serif" }}>
            Get started
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-12 text-center">
        <motion.div variants={staggerContainer} initial="hidden" animate="show"
          className="max-w-2xl mx-auto flex flex-col items-center">
          <motion.div variants={fadeUp}
            className="mb-8 px-4 py-1.5 rounded-full bg-[#ffaaab]/30 text-[#ff5e6c] text-[13px] font-medium"
            style={{ fontFamily: "var(--font-dm), DM Sans, sans-serif" }}>
            ✨ AI-powered journaling
          </motion.div>
          <motion.h1 variants={fadeUp}
            className="text-[40px] md:text-[64px] text-[#1f1a14] leading-[1.15] mb-6 max-w-[600px] tracking-tight"
            style={{ fontFamily: "var(--font-playfair), Playfair Display, serif" }}>
            Your thoughts,<br />remembered gently.
          </motion.h1>
          <motion.p variants={fadeUp}
            className="text-[17px] text-[#a89880] mb-10 max-w-[480px] leading-relaxed"
            style={{ fontFamily: "var(--font-lora), Lora, serif" }}>
            Dejaview is an AI journaling companion that remembers your past entries,
            tracks your moods, and helps you understand yourself — one thought at a time.
          </motion.p>
          <motion.div variants={fadeUp}
            className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button onClick={handleAuth}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#ff5e6c] text-white text-[15px] font-medium hover:bg-[#feb300] hover:text-[#1f1a14] transition-colors shadow-sm"
              style={{ fontFamily: "var(--font-dm), DM Sans, sans-serif" }}>
              Start journaling free
            </button>
            <button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-[#ffaaab] text-[#a89880] text-[15px] font-medium hover:border-[#ff5e6c] hover:text-[#ff5e6c] transition-colors"
              style={{ fontFamily: "var(--font-dm), DM Sans, sans-serif" }}>
              See how it works
            </button>
          </motion.div>
          <motion.p variants={fadeUp}
            className="mt-5 text-[12px] text-[#a89880]/70"
            style={{ fontFamily: "var(--font-dm), DM Sans, sans-serif" }}>
            No account needed to explore
          </motion.p>
        </motion.div>

        {/* Scroll cue line */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 w-px h-12 bg-gradient-to-b from-[#ff5e6c]/50 to-transparent" />
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-32 px-6 bg-[#fff5d7]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }}
            className="text-center mb-16">
            <h2 className="text-[36px] text-[#1f1a14] mb-4"
              style={{ fontFamily: "var(--font-playfair), Playfair Display, serif" }}>
              Everything you need to reflect
            </h2>
            <p className="text-[16px] text-[#a89880]" style={{ fontFamily: "var(--font-lora), Lora, serif" }}>
              Simple tools for a richer inner life.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Brain,    color: "#ff5e6c", bg: "rgba(255,94,108,0.1)",   title: "AI That Remembers",   desc: "Chat with an AI that recalls your past thoughts, emotions, and milestones — as if it was there." },
              { icon: PenLine,  color: "#feb300", bg: "rgba(254,179,0,0.15)",   title: "Write Freely",        desc: "A distraction-free editor with mood tracking, writing prompts, and gentle auto-save." },
              { icon: BarChart2,color: "#ffaaab", bg: "rgba(255,170,171,0.2)",  title: "Understand Yourself", desc: "Visual mood charts and writing heatmaps reveal patterns you didn't know were there." },
            ].map((f, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4, boxShadow: "4px 8px 0px rgba(254,179,0,0.2)" }}
                className="bg-[#fffbec] rounded-[20px] p-8 border border-[#ff5e6c]/10 transition-all">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-6"
                  style={{ backgroundColor: f.bg, color: f.color }}>
                  <f.icon size={20} />
                </div>
                <h3 className="text-[20px] text-[#1f1a14] mb-3"
                  style={{ fontFamily: "var(--font-playfair), Playfair Display, serif" }}>{f.title}</h3>
                <p className="text-[14px] text-[#a89880] leading-[1.6]"
                  style={{ fontFamily: "var(--font-dm), DM Sans, sans-serif" }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Experience / Quote ── */}
      <section className="py-32 px-6 bg-[#fffbec] border-y border-[#ffaaab]/20 relative overflow-hidden">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ duration: 1 }}
          className="max-w-4xl mx-auto text-center relative z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[60%] text-[120px] leading-none text-[#ff5e6c] opacity-15 select-none pointer-events-none"
            style={{ fontFamily: "var(--font-playfair), Playfair Display, serif" }}>"</div>
          <h2 className="text-[28px] sm:text-[32px] text-[#1f1a14] italic mb-8 max-w-[600px] mx-auto leading-[1.3]"
            style={{ fontFamily: "var(--font-playfair), Playfair Display, serif" }}>
            Most apps store your data.<br />Dejaview remembers your story.
          </h2>
          <p className="text-[16px] text-[#a89880] mb-12 max-w-[500px] mx-auto leading-[1.7]"
            style={{ fontFamily: "var(--font-lora), Lora, serif" }}>
            It's not a productivity tool. It's a companion for your inner world.
            Write today, rediscover it tomorrow — with context, empathy, and memory.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="px-4 py-2 rounded-full bg-[#feb300]/15 text-[#1f1a14] text-[13px] font-medium"
              style={{ fontFamily: "var(--font-dm), DM Sans, sans-serif" }}>🔥 7-day streak feature</span>
            <span className="px-4 py-2 rounded-full bg-[#ffaaab]/30 text-[#1f1a14] text-[13px] font-medium"
              style={{ fontFamily: "var(--font-dm), DM Sans, sans-serif" }}>🌙 Mood insights daily</span>
          </div>
        </motion.div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-6 bg-[#fff5d7] text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="max-w-2xl mx-auto flex flex-col items-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff5e6c"
            strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 mb-8">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
          <h2 className="text-[40px] text-[#1f1a14] mb-4"
            style={{ fontFamily: "var(--font-playfair), Playfair Display, serif" }}>
            Start your journey inward
          </h2>
          <p className="text-[16px] text-[#a89880] mb-10" style={{ fontFamily: "var(--font-lora), Lora, serif" }}>
            Join thousands reflecting, growing, and remembering.
          </p>
          <button onClick={handleAuth}
            className="px-8 py-4 rounded-[100px] bg-[#ff5e6c] text-white text-[17px] hover:bg-[#feb300] hover:text-[#1f1a14] transition-all shadow-sm mb-4"
            style={{ fontFamily: "var(--font-playfair), Playfair Display, serif" }}>
            Create your journal
          </button>
          <p className="text-[12px] text-[#a89880]" style={{ fontFamily: "var(--font-dm), DM Sans, sans-serif" }}>
            Free forever for personal use • No credit card
          </p>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#ffaaab]/30 bg-[#fff5d7] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[18px] text-[#1f1a14] font-medium"
            style={{ fontFamily: "var(--font-playfair), Playfair Display, serif" }}>Dejaview</div>
          <div className="text-[13px] text-[#a89880]"
            style={{ fontFamily: "var(--font-dm), DM Sans, sans-serif" }}>© 2025 Dejaview. Made with love.</div>
          <div className="flex gap-6 text-[12px] text-[#a89880]"
            style={{ fontFamily: "var(--font-dm), DM Sans, sans-serif" }}>
            <a href="#" className="hover:text-[#ff5e6c] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#ff5e6c] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#ff5e6c] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
