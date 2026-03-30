export interface MoodMeta {
  emoji: string;
  bgColor: string;
  borderColor: string;
}

const MOOD_MAP: Record<string, MoodMeta> = {
  happy:     { emoji: '😊', bgColor: '#fffbec', borderColor: '#feb300' },
  calm:      { emoji: '😌', bgColor: '#fffbec', borderColor: '#ffaaab' },
  sad:       { emoji: '😢', bgColor: '#f5f0ff', borderColor: '#c0b0ee' },
  anxious:   { emoji: '😰', bgColor: '#fff8ec', borderColor: '#ffb870' },
  angry:     { emoji: '😤', bgColor: '#fff0f0', borderColor: '#ff5e6c' },
  grateful:  { emoji: '🙏', bgColor: '#f0fff5', borderColor: '#70c090' },
  energized: { emoji: '⚡', bgColor: '#fffff0', borderColor: '#feb300' },
};

const DEFAULT_META: MoodMeta = { emoji: '📝', bgColor: '#fffbec', borderColor: '#ffaaab' };

export function getMoodMeta(mood: string): MoodMeta {
  return MOOD_MAP[mood] ?? DEFAULT_META;
}

export function detectMood(content: string): string {
  const lower = content.toLowerCase();
  if (/grateful|thankful|blessed/.test(lower)) return 'grateful';
  if (/happy|excited|amazing|great/.test(lower)) return 'happy';
  if (/sad|cry|miss|lonely|lost/.test(lower)) return 'sad';
  if (/anxious|worried|stress|overwhelm/.test(lower)) return 'anxious';
  if (/angry|frustrated|annoyed/.test(lower)) return 'angry';
  if (/energized|motivated|pumped/.test(lower)) return 'energized';
  return 'calm';
}

// Mood score for charts
export const MOOD_SCORES: Record<string, number> = {
  happy: 5,
  calm: 4,
  grateful: 5,
  energized: 4,
  anxious: 2,
  sad: 1,
  angry: 1,
};

export function getMoodScore(mood: string): number {
  return MOOD_SCORES[mood] ?? 3;
}

// Emoji map for breakdown display
export const moodEmojis: Record<string, string> = Object.fromEntries(
  Object.entries(MOOD_MAP).map(([k, v]) => [k, v.emoji])
);
