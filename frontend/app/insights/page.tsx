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
import { detectMood, getMoodMeta, getMoodScore, moodEmojis } from '@/lib/mood';
import { computeWordCount, formatDate } from '@/lib/utils';

function computeStreak(entries: JournalEntry[]): number {
  if (!entries.length) return 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dateSet = new Set(entries.map((e) => { const d = new Date(e.createdAt); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }));
  let streak = 0; const cursor = new Date(today);
  while (true) { const k = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`; if (dateSet.has(k)) { streak++; cursor.setDate(cursor.getDate() - 1); } else break; }
  return streak;
}

const CustomTooltip = ({ active, payload, label }: {active?: boolean; payload?: {value: number}[]; label?: string }) => {
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

export default function InsightsPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekSummary, setWeekSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
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
          const res = await chatWithAI(query, [], user.id);
          setWeekSummary(res.answer);
        } catch { setWeekSummary(''); }
      } else {
        setWeekSummary('');
      }
      setSummaryLoading(false);
    }).catch(() => { setLoading(false); setSummaryLoading(false); });
  }, [router]);

  // Stats
  const totalEntries = entries.length;
  const streak = computeStreak(entries);
  const moodCounts = entries.reduce<Record<string, number>>((acc, e) => {
    const m = e.mood ?? detectMood(e.content);
    acc[m] = (acc[m] ?? 0) + 1;
    return acc;
  }, {});
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'calm';

  // Mood chart — last 30 days
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dayEntries = entries.filter((e) => {
      const ed = new Date(e.createdAt);
      return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth() && ed.getDate() === d.getDate();
    });
    if (!dayEntries.length) return { date: formatDate(d.toISOString()), mood: null };
    const avg = dayEntries.reduce((s, e) => s + getMoodScore(e.mood ?? detectMood(e.content)), 0) / dayEntries.length;
    return { date: formatDate(d.toISOString()), mood: +avg.toFixed(2) };
  });

  const STATS = [
    { label: 'Total entries', value: totalEntries, icon: BookOpen, color: 'text-coral' },
    { label: 'Current streak', value: `${streak}d`, icon: TrendingUp, color: 'text-yellow' },
    { label: 'Top mood', value: topMood, icon: Zap, color: 'text-coral' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-beige">
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-6 sm:p-10 pb-24 md:pb-10 space-y-8">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-[28px] text-dark mb-1 font-heading">Your story, in numbers</h1>
          <p className="text-[15px] text-muted font-sans">Patterns and reflections from your journal</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Mood chart */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-surface border border-pink-light/30 rounded-[20px] p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-dark mb-4 font-sans">Mood over the last 30 days</h3>
              <div className="w-full h-48">
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

          <div className="space-y-6">
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

            {/* Mood breakdown */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="bg-surface border border-pink-light/30 rounded-[20px] p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-dark mb-4 font-sans">Mood breakdown</h3>
              {loading ? <div className="shimmer h-32 rounded-lg" /> : (
                <div className="space-y-3">
                  {Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).map(([mood, count]) => (
                    <div key={mood} className="flex items-center gap-3">
                      <span className="text-xl w-8 text-center">{moodEmojis[mood] ?? '📝'}</span>
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
