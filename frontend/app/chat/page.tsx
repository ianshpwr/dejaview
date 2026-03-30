'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Check, Sparkles } from 'lucide-react';
import { Sidebar, MobileTabBar } from '@/app/components/Sidebar';
import { getToken, getUser } from '@/lib/auth';
import { getEntries, chatWithAI, type JournalEntry } from '@/lib/api';
import { getMoodMeta, detectMood } from '@/lib/mood';
import { formatDate } from '@/lib/utils';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const SUGGESTED_PROMPTS = [
  'How have I been feeling lately?',
  'What have I been grateful for?',
  'What patterns do you notice in my writing?',
];

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeMemories, setActiveMemories] = useState<JournalEntry[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (!getToken()) { router.replace('/auth'); return; }
    const user = getUser();
    if (!user) { router.replace('/auth'); return; }
    getEntries(user.id).then(setEntries).catch(() => {});
  }, [mounted, router]);

  // Scroll to bottom when messages update — must be before any early return
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  if (!mounted) return null;

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;
    const user = getUser();
    if (!user) return;

    setMessages((m) => [...m, { role: 'user', content: text.trim() }]);
    setInput('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 1500);
    setIsThinking(true);

    try {
      const history = messages.map((m) => ({
        role: (m.role === 'ai' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.content,
      }));
      const res = await chatWithAI(text.trim(), history, user.id);


      // Highlight referenced memories
      const recentEntries = entries.slice(0, 5);
      const highlighted = recentEntries.filter((e) =>
        e.title.split(' ').some((w) => w.length > 3 && res.answer.toLowerCase().includes(w.toLowerCase()))
      );
      setActiveMemories(highlighted);

      setMessages((m) => [...m, { role: 'ai', content: res.answer }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      setMessages((m) => [...m, { role: 'ai', content: `Sorry, ${msg}` }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const isInitialState = messages.length === 0;
  const memoryCards = isInitialState ? entries.slice(0, 3) : (activeMemories.length ? activeMemories : entries.slice(0, 3));

  return (
    <div className="flex h-screen overflow-hidden bg-beige">
      <Sidebar />

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Memory panel (desktop) */}
        <div className="hidden md:flex w-72 lg:w-80 flex-col border-r border-pink-light/30 p-5 gap-4 overflow-y-auto flex-shrink-0 bg-beige">
          <h2 className="text-[16px] text-dark font-heading">Memories referenced</h2>

          {isInitialState && (
            <div className="flex flex-col gap-2 mt-2 mb-4">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="text-left px-4 py-2.5 rounded-[12px] bg-pink-light/20 text-coral text-[13px] font-medium hover:bg-pink-light/40 transition-colors font-sans"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {memoryCards.map((entry, i) => {
              const mood = entry.mood ?? detectMood(entry.content);
              const meta = getMoodMeta(mood);
              const isActive = activeMemories.some((a) => a.id === entry.id);
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className={[
                    'p-4 rounded-[12px] transition-all duration-300',
                    'bg-surface border-l-[3px] border-coral shadow-sm',
                    isActive ? 'glow-pulse' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-sans text-[11px] text-muted font-medium">
                      {formatDate(entry.createdAt)}
                    </span>
                    <span className="text-sm">{meta.emoji}</span>
                  </div>
                  <h4 className="text-[14px] text-dark mb-1.5 line-clamp-1 font-heading">
                    {entry.title}
                  </h4>
                  <p className="text-[12px] text-muted line-clamp-2 leading-relaxed font-serif">
                    {entry.content.slice(0, 120)}...
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: Chat */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 pb-4">
            {isInitialState && (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto min-h-[50vh]">
                <div className="w-12 h-12 rounded-full bg-pink-light/20 flex items-center justify-center mb-4">
                  <Sparkles size={24} className="text-coral" />
                </div>
                <h2 className="text-[24px] text-dark mb-2 font-heading">
                  Chat with your journal
                </h2>
                <p className="text-[15px] text-muted font-serif">
                  Ask questions about your entries, look for patterns, or just reflect on what you&apos;ve written.
                </p>
                {/* Mobile prompts */}
                <div className="md:hidden flex flex-col gap-2 mt-6 w-full max-w-sm">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      className="text-left px-4 py-2.5 rounded-[12px] bg-pink-light/20 text-coral text-[13px] font-medium hover:bg-pink-light/40 transition-colors font-sans"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <div
                  className={[
                    'max-w-[75%] px-5 py-3.5 rounded-[20px] text-[15px] leading-relaxed font-sans',
                    msg.role === 'user'
                      ? 'bg-coral text-white rounded-br-[6px]'
                      : 'bg-surface border border-pink-light/40 text-dark rounded-bl-[6px] font-serif',
                  ].join(' ')}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}

            <AnimatePresence>
              {isThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex justify-start"
                >
                  <div className="bg-surface border border-pink-light/40 rounded-[20px] rounded-bl-[6px] px-5 py-4">
                    <div className="flex gap-1.5 items-center">
                      {[0, 1, 2].map((n) => (
                        <div key={n} className="thinking-dot w-2 h-2 rounded-full" />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} className="h-4" />
          </div>

          {/* Input */}
          <div className="p-4 sm:p-6 bg-gradient-to-t from-beige to-transparent flex-shrink-0">
            <div className="max-w-3xl mx-auto flex items-center gap-3 bg-surface border border-pink-light rounded-[100px] px-5 py-3 shadow-sm focus-within:ring-4 focus-within:ring-coral/15 focus-within:border-coral transition-all">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your memories, patterns, feelings..."
                className="flex-1 bg-transparent border-none outline-none text-[15px] text-dark placeholder:text-muted/60 focus:ring-0 font-sans"
              />
              <motion.button
                onClick={() => handleSend(input)}
                disabled={!input.trim() && !submitted}
                className="w-10 h-10 bg-coral hover:bg-yellow rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all group"
                whileTap={{ scale: 0.9 }}
              >
                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div key="check" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ duration: 0.2 }}>
                      <Check size={18} className="text-white group-hover:text-dark" />
                    </motion.div>
                  ) : (
                    <motion.div key="send" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
                      <Send size={16} className="text-white group-hover:text-dark ml-0.5 group-hover:-rotate-45 transition-transform duration-300" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <MobileTabBar />
    </div>
  );
}
