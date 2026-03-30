'use client';

import type { JournalEntry } from '@/lib/api';
import { computeWordCount } from '@/lib/utils';

interface HeatmapGridProps {
  entries: JournalEntry[];
}

const DAYS = 84; // 12 weeks × 7

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function HeatmapGrid({ entries }: HeatmapGridProps) {
  const today = new Date();

  // Build 84-day window, oldest first
  const days = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (DAYS - 1 - i));
    return d;
  });

  // Map date → total word count
  const wordsByDay = new Map<string, number>();
  for (const entry of entries) {
    const d = new Date(entry.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const wc = entry.wordCount ?? computeWordCount(entry.content);
    wordsByDay.set(key, (wordsByDay.get(key) ?? 0) + wc);
  }

  function getCellColor(day: Date): string {
    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
    const wc = wordsByDay.get(key);
    if (!wc) return 'rgba(255, 170, 171, 0.2)';
    const opacity = Math.min(wc / 300, 1) * 0.4 + 0.6;
    return `rgba(255, 94, 108, ${opacity})`;
  }

  function getTooltip(day: Date): string {
    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
    const wc = wordsByDay.get(key);
    const label = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return wc ? `${label}: ${wc} words` : label;
  }

  // Group into weeks (columns)
  const weeks: Date[][] = [];
  for (let i = 0; i < DAYS; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px] min-w-max">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) => (
              <div
                key={di}
                title={getTooltip(day)}
                className="w-[14px] h-[14px] rounded-[3px] cursor-default hover:ring-2 hover:ring-coral/50 transition-all"
                style={{ backgroundColor: getCellColor(day) }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
