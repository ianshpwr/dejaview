export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('dv_token');
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('dv_token', token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('dv_token');
}

export interface UserPayload {
  id: number;
  name: string;
  email: string;
}

export function getUser(): UserPayload | null {
  if (typeof window === 'undefined') return null;
  const token = getToken();
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return {
      id: payload.id ?? payload.userId ?? payload.sub,
      name: payload.name ?? '',
      email: payload.email ?? '',
    };
  } catch {
    return null;
  }
}
