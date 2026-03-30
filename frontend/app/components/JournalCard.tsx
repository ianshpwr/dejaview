'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import type { JournalEntry } from '@/lib/api';
import { getMoodMeta, detectMood } from '@/lib/mood';
import { computeWordCount, formatDate } from '@/lib/utils';

interface JournalCardProps {
  entry: JournalEntry;
  index: number;
}

export function JournalCard({ entry, index }: JournalCardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const mood = entry.mood ?? detectMood(entry.content);
  const meta = getMoodMeta(mood);
  const wordCount = entry.wordCount ?? computeWordCount(entry.content);
  const preview = entry.content.slice(0, 120).trim();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientY - rect.top) / rect.height - 0.5;
    const y = (e.clientX - rect.left) / rect.width - 0.5;
    setTilt({ x: x * 12, y: y * 12 });
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setIsHovered(false); }}
      onClick={() => router.push(`/write?id=${entry.id}`)}
      className="relative p-5 cursor-pointer rounded-[20px] border transition-all"
      style={{
        backgroundColor: meta.bgColor,
        borderColor: isHovered ? meta.borderColor : `${meta.borderColor}60`,
        transform: isHovered
          ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-3px)`
          : 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        boxShadow: isHovered
          ? '4px 8px 0px rgba(254,179,0,0.25)'
          : '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <span className="font-sans text-[12px] text-muted">
          {formatDate(entry.createdAt)}
        </span>
        <span className="text-2xl leading-none drop-shadow-sm" title={mood}>
          {meta.emoji}
        </span>
      </div>

      {/* Title */}
      <h3
        className="text-[18px] text-dark mb-2 line-clamp-2 leading-snug"
        style={{ fontFamily: 'var(--font-playfair), serif' }}
      >
        {entry.title || 'Untitled'}
      </h3>

      {/* Preview */}
      <p
        className="text-[14px] text-muted leading-relaxed line-clamp-3"
        style={{ fontFamily: 'var(--font-lora), Georgia, serif' }}
      >
        {preview}…
      </p>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-pink-light/30">
        <span className="font-sans text-[12px] text-muted">{wordCount} words</span>
      </div>
    </motion.div>
  );
}

export function JournalCardSkeleton() {
  return (
    <div className="p-5 rounded-[20px] border border-pink-light/30 bg-surface space-y-3">
      <div className="flex justify-between">
        <div className="shimmer h-3 w-16 rounded-full" />
        <div className="shimmer h-6 w-6 rounded-full" />
      </div>
      <div className="shimmer h-5 w-3/4 rounded-full" />
      <div className="space-y-2">
        <div className="shimmer h-3 w-full rounded-full" />
        <div className="shimmer h-3 w-5/6 rounded-full" />
        <div className="shimmer h-3 w-4/6 rounded-full" />
      </div>
      <div className="shimmer h-3 w-16 rounded-full mt-4 pt-3" />
    </div>
  );
}
