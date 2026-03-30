'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { BookOpen, TrendingUp, Zap, Info } from 'lucide-react';
import { Sidebar, MobileTabBar } from '@/app/components/Sidebar';
import { HeatmapGrid } from '@/app/components/HeatmapGrid';
import { getToken, getUser } from '@/lib/auth';
import { getEntries, chatWithAI, type JournalEntry } from '@/lib/api';
import { getMoodMeta } from '@/lib/mood';
import { computeWordCount, formatDate } from '@/lib/utils';

// ── Constants ────────────────────────────────────────────────────────────────

const MOOD_SCORE: Record<string, number> = {
  happy: 5,
  grateful: 5,
  energized: 4,
  calm: 3,
  anxious: 2,
  sad: 1,
  angry: 1,
};

// ── Local helpers ─────────────────────────────────────────────────────────────

function computeStreak(entries: JournalEntry[]): number {
  if (!entries.length) return 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dateSet = new Set(entries.map((e) => {
    const d = new Date(e.createdAt);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }));
  let streak = 0;
  const cursor = new Date(today);
  while (true) {
    const k = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (dateSet.has(k)) { streak++; cursor.setDate(cursor.getDate() - 1); } else break;
  }
  return streak;
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-pink-light rounded-lg px-3 py-2 text-xs shadow-lg">
        <p className="text-muted font-sans mb-1">{label}</p>
        <p className="text-coral font-sans font-medium">Mood: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekSummary, setWeekSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (!getToken()) { router.replace('/auth'); return; }
    const user = getUser();
    if (!user) { router.replace('/auth'); return; }

    getEntries(user.id).then(async (all) => {
      setEntries(all);
      setLoading(false);

      // Weekly AI reflection
      const week = all.filter((e) => {
        const d = new Date(e.createdAt);
        const ago = new Date(); ago.setDate(ago.getDate() - 7);
        return d >= ago;
      });

      if (week.length > 0) {
        const context = week.map((e) => `Title: ${e.title}\nEntry: ${e.content}`).join('\n\n');
        const query = `Based on these recent journal entries, give me a warm 2-sentence summary of my emotional themes this week. Be specific and kind.\n\n${context}`;
        try {
          const res = await chatWithAI(query, []);
          setWeekSummary(res.reply || '');
        } catch { setWeekSummary(''); }
      } else {
        setWeekSummary('');
      }
      setSummaryLoading(false);
    }).catch(() => { setLoading(false); setSummaryLoading(false); });
  }, [mounted, router]);

  const [streak, setStreak] = useState(0);
  const [topMood, setTopMood] = useState('calm');
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    setStreak(computeStreak(entries));

    const thisMonthEntries = entries.filter((e) => {
      const d = new Date(e.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const moodFreq = thisMonthEntries.reduce<Record<string, number>>((acc, e) => {
      const m = e.mood ?? 'calm';
      acc[m] = (acc[m] ?? 0) + 1;
      return acc;
    }, {});
    setTopMood(Object.entries(moodFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'calm');

    const cd = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dateStr = date.toISOString().split('T')[0];

      const dayEntries = entries.filter((e) => e.createdAt.split('T')[0] === dateStr);
      const avgScore = dayEntries.length > 0
        ? dayEntries.reduce((sum, e) => sum + (MOOD_SCORE[e.mood ?? 'calm'] ?? 3), 0) / dayEntries.length
        : null;

      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        mood: avgScore !== null ? +avgScore.toFixed(2) : null,
      };
    });
    setChartData(cd);
  }, [entries]);

  if (!mounted) return null;

  const totalEntries = entries.length;
  const topMoodMeta = getMoodMeta(topMood);

  // Mood breakdown — each entry's stored mood, no detectMood
  const MOOD_LIST = ['happy', 'calm', 'sad', 'anxious', 'angry', 'grateful', 'energized'];
  const moodCounts = MOOD_LIST.map((mood) => ({
    mood,
    emoji: getMoodMeta(mood).emoji,
    count: entries.filter((e) => e.mood === mood).length,
  })).filter((m) => m.count > 0);

  const STATS = [
    { label: 'Total entries', value: totalEntries, icon: BookOpen, color: 'text-coral' },
    { label: 'Current streak', value: `${streak}d`, icon: TrendingUp, color: 'text-yellow' },
    { label: 'Top mood', value: `${topMoodMeta.emoji} ${topMood}`, icon: Zap, color: 'text-coral' },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-beige">
      <Sidebar />

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-10 pb-24 md:pb-10 space-y-6 md:space-y-8 w-full max-w-full">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-[24px] md:text-[28px] text-dark mb-1 font-heading">Your story, in numbers</h1>
          <p className="text-[14px] md:text-[15px] text-muted font-sans">Patterns and reflections from your journal</p>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-surface border border-pink-light/30 border-t-[3px] border-t-coral rounded-[16px] p-5 text-center shadow-sm">
                <Icon size={20} className={`${stat.color} mx-auto mb-3`} />
                <p className="text-[36px] text-coral leading-none mb-1 font-heading">
                  {loading ? '…' : stat.value}
                </p>
                <p className="text-[12px] text-muted font-sans uppercase tracking-wider font-medium">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-full">
          <div className="space-y-6 w-full max-w-full overflow-hidden">
            {/* Mood chart */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-surface border border-pink-light/30 rounded-[20px] p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-dark mb-4 font-sans">Mood over the last 30 days</h3>
              <div style={{ width: '100%', height: '300px', minHeight: '300px', minWidth: '0' }}>
                {chartData.some(d => d.mood !== null) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff5e6c" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#ff5e6c" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,170,171,0.3)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a89880' }} tickLine={false} axisLine={false} interval={5} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: '#a89880' }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="mood" stroke="#ff5e6c" strokeWidth={2} fill="url(#moodGradient)" dot={{ r: 3, fill: '#feb300' }} connectNulls={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ textAlign: 'center', color: '#a89880', paddingTop: '130px' }}>
                    No data yet
                  </p>
                )}
              </div>
            </motion.div>

            {/* Heatmap */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-surface border border-pink-light/30 rounded-[20px] p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-dark mb-4 font-sans">Writing consistency (past 12 weeks)</h3>
              {loading ? <div className="shimmer h-24 rounded-lg" /> : <HeatmapGrid entries={entries} />}
              <div className="flex items-center gap-2 mt-4 justify-end">
                <span className="text-[11px] text-muted font-sans">Less</span>
                {[0, 1, 2, 3].map((n) => (
                  <div key={n} className={`w-3 h-3 rounded-[2px] ${n === 0 ? 'bg-pink-light/20' : n === 1 ? 'bg-pink-light' : n === 2 ? 'bg-coral/70' : 'bg-coral'}`} />
                ))}
                <span className="text-[11px] text-muted font-sans">More</span>
              </div>
            </motion.div>
          </div>

          <div className="space-y-6 w-full max-w-full overflow-hidden">
            {/* Weekly AI reflection */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-surface border-l-[4px] border-coral border-y border-y-pink-light/30 border-r border-r-pink-light/30 rounded-[16px] p-5 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-pink-light/20 flex items-center justify-center flex-shrink-0">
                  <Info size={14} className="text-coral" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-dark font-sans">This week in your mind</h3>
                  <p className="text-[11px] text-muted mt-0.5 font-sans">AI-generated summary</p>
                </div>
              </div>
              {summaryLoading ? (
                <div className="space-y-2">
                  <div className="shimmer h-4 rounded-full w-full" />
                  <div className="shimmer h-4 rounded-full w-5/6" />
                </div>
              ) : weekSummary ? (
                <p className="text-[15px] text-dark leading-relaxed italic font-serif">&ldquo;{weekSummary}&rdquo;</p>
              ) : (
                <p className="text-[14px] text-muted font-serif italic">Write more this week to see your reflection.</p>
              )}
            </motion.div>

            {/* Mood breakdown — entry.mood only, no detectMood */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="bg-surface border border-pink-light/30 rounded-[20px] p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-dark mb-4 font-sans">Mood breakdown</h3>
              {loading ? <div className="shimmer h-32 rounded-lg" /> : moodCounts.length === 0 ? (
                <p className="text-[14px] text-muted font-serif italic">No mood data yet. Start writing!</p>
              ) : (
                <div className="space-y-3">
                  {moodCounts.map(({ mood, emoji, count }) => (
                    <div key={mood} className="flex items-center gap-3">
                      <span className="text-xl w-8 text-center">{emoji}</span>
                      <span className="text-[13px] text-dark capitalize w-20 font-sans font-medium">{mood}</span>
                      <div className="flex-1 bg-pink-light/20 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / totalEntries) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                          className="h-full bg-yellow rounded-full"
                        />
                      </div>
                      <span className="text-[13px] text-muted w-6 text-right font-sans">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <MobileTabBar />
    </div>
  );
}
