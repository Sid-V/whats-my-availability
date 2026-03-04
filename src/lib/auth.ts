const AUTH_KEY = "wma_auth";
const EMAIL_KEY = "wma_email";

interface StoredAuth {
  accessToken: string;
  expiresAt: number;
  userName: string;
  email: string;
}

export function saveAuth(
  accessToken: string,
  expiresIn: number,
  userName: string,
  email: string
): void {
  const data: StoredAuth = {
    accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
    userName,
    email,
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
  if (email) localStorage.setItem(EMAIL_KEY, email);
}

export function loadAuth(): {
  accessToken: string;
  userName: string;
  email: string;
} | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const data: StoredAuth = JSON.parse(raw);
    // 60s buffer before expiry
    if (Date.now() >= data.expiresAt - 60_000) {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
    return {
      accessToken: data.accessToken,
      userName: data.userName,
      email: data.email,
    };
  } catch {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function updateAuthUserName(name: string, email: string): void {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return;
    const data: StoredAuth = JSON.parse(raw);
    data.userName = name;
    data.email = email;
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
    if (email) localStorage.setItem(EMAIL_KEY, email);
  } catch {
    // ignore
  }
}

export function getSavedEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY);
}
