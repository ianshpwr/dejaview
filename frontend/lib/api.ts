import { getToken, clearToken } from './auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok || res.headers.get('content-type')?.includes('text/html')) {
    const text = await res.text().catch(() => '');
    throw new Error(
      text.includes('<!DOCTYPE')
        ? `Server error: ${res.status} ${res.statusText}`
        : text || `HTTP ${res.status}`
    );
  }

  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JournalEntry {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  userId: number;
  faissId?: number | null;
  mood?: string | null;
  wordCount?: number | null;
  tags?: string[];
}

export interface ChatMessage {
  role: 'user' | 'ai' | 'assistant';
  content: string;
}

export interface ChatResponse {
  answer: string;
  memories: JournalEntry[];
}

// ─── API Functions ─────────────────────────────────────────────────────────────

export async function getEntries(userId?: number): Promise<JournalEntry[]> {
  return request<JournalEntry[]>('/journal/entries');
}

export async function createEntry(
  title: string, 
  content: string, 
  mood: string
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/journal/entries`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ title, content, mood })
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function updateEntry(
  id: number,
  title: string,
  content: string,
  mood: string
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/journal/entries/${id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ title, content, mood })
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function deleteEntry(id: number): Promise<void> {
  return request<void>(`/journal/entries/${id}`, { method: 'DELETE' });
}

export async function chatWithAI(
  query: string,
  history: ChatMessage[],
  userId: number
): Promise<ChatResponse> {
  return request<ChatResponse>('/journal/entries/chat', {
    method: 'POST',
    body: JSON.stringify({ query, history, userId }),
  });
}
