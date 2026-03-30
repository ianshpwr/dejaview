'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Check, Sparkles } from 'lucide-react';
import { Sidebar, MobileTabBar } from '@/app/components/Sidebar';
import { getToken, getUser } from '@/lib/auth';
import { getEntries, chatWithAI, type JournalEntry } from '@/lib/api';
import { getMoodMeta, detectMood } from '@/lib/mood';

const SUGGESTED_PROMPTS = [
  'How have I been feeling lately?',
  'What have I been grateful for?',
  'What patterns do you notice in my writing?',
];

export default function ChatPage() {
  const router = useRouter();
  
  const [messages, setMessages] = useState<{
    role: 'user' | 'ai'
    content: string
    timestamp: number
  }[]>([]);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  
  const [referencedEntries, setReferencedEntries] = useState<{
    id: number
    title: string
    mood: string
    createdAt: string
    excerpt: string
  }[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved chat from localStorage
    try {
      const saved = localStorage.getItem('dv_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch (e) {
      localStorage.removeItem('dv_chat_history');
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      try {
        // Keep only last 50 messages in storage
        const toSave = messages.slice(-50);
        localStorage.setItem(
          'dv_chat_history', 
          JSON.stringify(toSave)
        );
      } catch (e) {
        console.error('Could not save chat history');
      }
    }
  }, [messages]);

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
  }, [messages, loading]);

  const handleSend = useCallback(async (forcedText?: string) => {
    const textToSend = forcedText ?? input;
    if (!textToSend.trim() || loading) return;

    const userMessage = { 
      role: 'user' as const, 
      content: textToSend.trim(),
      timestamp: Date.now()
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 1500);
    setLoading(true);

    try {
      // Send full history so AI has full context
      const history = updatedMessages.slice(-12).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await chatWithAI(textToSend.trim(), history);

      const aiMessage = {
        role: 'ai' as const,
        content: response.reply || '',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update memory panel with referenced entries
      if (response.referencedEntries?.length > 0) {
        setReferencedEntries(response.referencedEntries);
      }

    } catch (err) {
      console.error('[Chat error]', err);
      setMessages(prev => [...prev, {
        role: 'ai' as const,
        content: 'Sorry, I had trouble connecting. Please try again.',
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleClearChat = () => {
    if (confirm('Clear this conversation? Your journals are safe.')) {
      setMessages([]);
      setReferencedEntries([]);
      localStorage.removeItem('dv_chat_history');
    }
  };

  if (!mounted) return null;

  const isInitialState = messages.length === 0;

  return (
    <div className="flex h-screen overflow-hidden bg-beige">
      <Sidebar />

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Memory panel (desktop) */}
        <div className="hidden md:flex w-72 lg:w-80 flex-col border-r border-pink-light/30 p-5 gap-4 overflow-y-auto flex-shrink-0 bg-beige">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[16px] text-dark font-heading">Memories referenced</h2>
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                style={{
                  background: 'transparent',
                  border: '1px solid #ffaaab',
                  borderRadius: '100px',
                  padding: '6px 14px',
                  color: '#a89880',
                  fontFamily: 'var(--font-dm)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#ff5e6c';
                  e.currentTarget.style.color = '#ff5e6c';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#ffaaab';
                  e.currentTarget.style.color = '#a89880';
                }}
              >
                Clear chat
              </button>
            )}
          </div>

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
            {referencedEntries.length === 0 ? (
              <p style={{
                fontFamily: 'var(--font-lora)',
                fontSize: '14px',
                color: '#a89880',
                fontStyle: 'italic',
                padding: '16px'
              }}>
                Ask me anything — I will find what matters
              </p>
            ) : (
              referencedEntries.map(entry => (
                <div key={entry.id} style={{
                  background: '#fff5d7',
                  borderLeft: '3px solid #ff5e6c',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '8px'
                }}>
                  <p style={{
                    fontFamily: 'var(--font-dm)',
                    fontSize: '11px',
                    color: '#a89880',
                    margin: '0 0 4px 0'
                  }}>
                    {new Date(entry.createdAt).toLocaleDateString(
                      'en-US', { month: 'short', day: 'numeric' }
                    )}
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-dm)',
                    fontSize: '13px',
                    color: '#1f1a14',
                    fontWeight: '500',
                    margin: '0 0 4px 0'
                  }}>
                    {entry.title}
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-lora)',
                    fontSize: '12px',
                    color: '#a89880',
                    margin: 0
                  }}>
                    {entry.excerpt}...
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Chat */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Mobile Clear Button (visible on small screens) */}
          {messages.length > 0 && (
            <div className="md:hidden absolute top-4 right-4 z-10">
              <button
                onClick={handleClearChat}
                style={{
                  background: '#fffbec',
                  border: '1px solid #ffaaab',
                  borderRadius: '100px',
                  padding: '6px 14px',
                  color: '#a89880',
                  fontFamily: 'var(--font-dm)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                Clear
              </button>
            </div>
          )}

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
                      : 'bg-surface border border-pink-light/40 text-dark rounded-bl-[6px] font-serif whitespace-pre-wrap',
                  ].join(' ')}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}

            <AnimatePresence>
              {loading && (
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
