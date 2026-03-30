'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Flame, Plus, Search, Feather } from 'lucide-react';
import { Sidebar, MobileTabBar } from '@/app/components/Sidebar';
import { JournalCard, JournalCardSkeleton } from '@/app/components/JournalCard';
import { getEntries, deleteEntry, getJournalSummary, type JournalEntry } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';
import { computeStreak, getGreeting } from '@/lib/utils';
import { LandingMarketing } from '@/app/components/LandingMarketing';

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);
  const [greeting, setGreeting] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Good morning');
    else if (hour >= 12 && hour < 17) setGreeting('Good afternoon');
    else if (hour >= 17 && hour < 21) setGreeting('Good evening');
    else setGreeting('Good night');
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const token = getToken();
    if (!token) { setNeedsAuth(true); return; }
    const u = getUser();
    if (!u) { setNeedsAuth(true); return; }
    setUser(u as { id: number; name: string });

    getEntries(u.id)
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [mounted, router]);

  if (!mounted) return null;
  if (needsAuth) return <LandingMarketing />;

  const handleDelete = async (id: number) => {
    try {
      await deleteEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete entry. Please try again.');
    }
  };

  const handleGetSummary = async () => {
    setSummaryLoading(true);
    setShowSummary(true);
    try {
      const data = await getJournalSummary();
      setSummary(data.summary);
    } catch {
      setSummary('Failed to generate summary. Please try again.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const streak = computeStreak(entries);
  const filtered = entries.filter((e) =>
    !search ||
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-beige">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-x-hidden w-full max-w-full">
        {/* Top bar */}
        <div className="px-4 sm:px-10 pt-6 sm:pt-8 pb-4 sm:pb-6 flex-shrink-0 w-full max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div>
              {/* Mobile logo */}
              <div className="flex items-center gap-2 mb-2 md:hidden">
                <Feather size={16} className="text-coral" />
                <span className="font-heading text-lg font-medium text-dark">Dejaview</span>
              </div>
              <h1 className="text-[24px] md:text-[28px] text-dark mb-1 font-heading">
                {greeting}{user?.name ? `, ${user.name}` : ''} ☀️
              </h1>
              <p className="text-[15px] text-muted font-serif">
                {streak > 0
                  ? `You've written ${streak} day${streak > 1 ? 's' : ''} in a row. Keep it up!`
                  : 'Start writing to build your streak.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {streak > 0 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-1.5 bg-yellow/20 rounded-full px-4 py-2"
                >
                  <Flame size={16} className="text-coral" />
                  <span className="text-[13px] font-medium text-dark font-sans">
                    {streak} day streak
                  </span>
                </motion.div>
              )}

              <button
                onClick={handleGetSummary}
                style={{
                  background: '#fffbec',
                  border: '1px solid #ffaaab',
                  borderRadius: '100px',
                  padding: '10px 20px',
                  color: '#1f1a14',
                  fontFamily: 'var(--font-dm)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}
              >
                ✨ My Summary
              </button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/write')}
                className="flex items-center gap-2 bg-coral text-white text-[14px] font-medium px-5 py-2.5 rounded-[100px] shadow-sm hover:bg-yellow hover:text-dark transition-colors font-sans"
              >
                <Plus size={18} />
                New Entry
              </motion.button>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              placeholder="Search your memories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface border border-pink-light focus:border-coral focus:ring-4 focus:ring-coral/15 rounded-[100px] pl-10 pr-5 py-3 text-[14px] text-dark placeholder:text-muted/60 transition-all outline-none font-sans shadow-sm"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-10 pb-24 md:pb-10 w-full max-w-full">
          {error && (
            <p className="text-coral text-sm font-sans mb-4">{error}</p>
          )}

          {/* Summary panel */}
          {showSummary && (
            <div className="bg-[#fffbec] border border-[#ffaaab] rounded-[20px] p-5 sm:p-7 mb-8 relative w-full max-w-full">
              <button
                onClick={() => setShowSummary(false)}
                className="absolute top-4 right-4 bg-transparent border-none cursor-pointer text-[#a89880] text-[20px] p-2"
              >
                ×
              </button>
              <h3 className="font-heading text-[18px] sm:text-[20px] text-[#1f1a14] mb-4">
                ✨ Your Journal Story
              </h3>
              {summaryLoading ? (
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  alignItems: 'center',
                  color: '#a89880',
                  fontFamily: 'var(--font-dm)',
                  fontSize: '14px',
                }}>
                  <span>Reflecting on your journals</span>
                  <span style={{ animation: 'pulse 1s infinite' }}>...</span>
                </div>
              ) : (
                <p style={{
                  fontFamily: 'var(--font-lora)',
                  fontSize: '16px',
                  color: '#1f1a14',
                  lineHeight: '1.8',
                  margin: 0,
                }}>
                  {summary}
                </p>
              )}
              <p style={{
                fontFamily: 'var(--font-dm)',
                fontSize: '11px',
                color: '#a89880',
                marginTop: '16px',
                marginBottom: 0,
              }}>
                Generated from your journal entries by Dejaview AI
              </p>
            </div>
          )}

          {loading ? (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="break-inside-avoid mb-6">
                  <JournalCardSkeleton />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            /* Empty state */
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ffaaab" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-6">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
              <h3 className="text-[24px] text-dark mb-2 font-heading">
                Your story starts here
              </h3>
              <p className="text-[15px] text-muted mb-8 max-w-sm font-serif">
                Write your first journal entry. No rules, no structure — just your thoughts on the page.
              </p>
              <button
                onClick={() => router.push('/write')}
                className="bg-coral text-white text-[15px] font-medium px-6 py-3 rounded-[100px] hover:bg-yellow hover:text-dark transition-colors font-sans shadow-sm"
              >
                Write your first entry
              </button>
            </motion.div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-[15px] text-muted font-sans">
                No entries found for &ldquo;{search}&rdquo;
              </p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
              {filtered.map((entry, i) => (
                <div key={entry.id} className="break-inside-avoid mb-6">
                  <JournalCard entry={entry} index={i} onDelete={handleDelete} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <MobileTabBar />
    </div>
  );
}
