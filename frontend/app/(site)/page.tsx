'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Flame, Plus, Search, Feather } from 'lucide-react';
import { Sidebar, MobileTabBar } from '@/app/components/Sidebar';
import { JournalCard, JournalCardSkeleton } from '@/app/components/JournalCard';
import { getEntries, type JournalEntry } from '@/lib/api';
import { getToken, getUser } from '@/lib/auth';
import { computeStreak, getGreeting } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace('/auth'); return; }
    const user = getUser();
    if (!user) { router.replace('/auth'); return; }

    getEntries(user.id)
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  const user = getUser();
  const streak = computeStreak(entries);
  const filtered = entries.filter((e) =>
    !search ||
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-beige">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="px-6 sm:px-10 pt-8 pb-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
            <div>
              {/* Mobile logo */}
              <div className="flex items-center gap-2 mb-2 md:hidden">
                <Feather size={16} className="text-coral" />
                <span className="font-heading text-lg font-medium text-dark">Dejaview</span>
              </div>
              <h1 className="text-[28px] text-dark mb-1 font-heading">
                {getGreeting(user?.name)} ☀️
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
        <div className="flex-1 overflow-y-auto px-6 sm:px-10 pb-24 md:pb-10">
          {error && (
            <p className="text-coral text-sm font-sans mb-4">{error}</p>
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
                  <JournalCard entry={entry} index={i} />
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
