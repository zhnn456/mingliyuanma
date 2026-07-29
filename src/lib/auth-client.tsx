'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  memberLevel: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({}),
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

/** 从 cookie 中读取并解码 token（客户端本地，不调 API） */
function decodeTokenFromCookie(): User | null {
  try {
    const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
    if (!match) return null;
    const token = decodeURIComponent(match[1]);
    const binary = atob(token);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (data.exp && data.exp < Date.now()) return null;
    return { id: data.sub, email: data.email, name: data.name, role: data.role, memberLevel: data.memberLevel };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化时从 cookie 解码用户信息
  useEffect(() => {
    const u = decodeTokenFromCookie();
    setUser(u);
    setLoading(false);
  }, []);

  // 监听 cookie 变化（登录/登出跨标签同步）
  useEffect(() => {
    let lastCookie = document.cookie;
    const timer = setInterval(() => {
      if (document.cookie !== lastCookie) {
        lastCookie = document.cookie;
        setUser(decodeTokenFromCookie());
      }
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || '登录失败' };
      setUser(data.user);
      return {};
    } catch {
      return { error: '网络错误，请重试' };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    document.cookie = 'token=; Path=/; Max-Age=0';
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
