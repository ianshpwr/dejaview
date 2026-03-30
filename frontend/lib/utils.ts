export function computeStreak(entries: { createdAt: string }[]): number {
  if (!entries.length) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build a set of date strings in 'YYYY-MM-DD' format
  const dateSet = new Set(
    entries.map((e) => {
      const d = new Date(e.createdAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  let streak = 0;
  const cursor = new Date(today);

  while (true) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (dateSet.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function computeWordCount(content: string): number {
  return content.split(' ').filter(Boolean).length;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  let time = 'morning';
  if (hour >= 12 && hour < 17) time = 'afternoon';
  else if (hour >= 17) time = 'evening';
  return `Good ${time}${name ? `, ${name}` : ''}`;
}
