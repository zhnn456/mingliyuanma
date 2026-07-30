'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';

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
  signIn: (email: string, password: string) => Promise<{ error?: string; user?: User }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({}),
  signOut: async () => {},
  refreshUser: async () => null,
});

export function useAuth() {
  return useContext(AuthContext);
}

// 模块级变量，用于在 React 状态更新前临时存储用户数据
let _pendingUser: User | null = null;

// 供外部检查当前是否有已登录但状态未更新的用户
export function getPendingUser(): User | null {
  return _pendingUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => _pendingUser);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  // 从服务端获取用户信息（仅首次）
  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          // 只有当没有 pendingUser 或当前 user 为 null 时才更新
          // 避免覆盖刚登录设置的用户状态
          if (!_pendingUser || !user) {
            setUser(data.user);
          }
          return data.user as User;
        }
      }
      // 只有当没有 pendingUser 时才清除用户状态
      if (!_pendingUser) {
        setUser(null);
      }
      return null;
    } catch {
      if (!_pendingUser) {
        setUser(null);
      }
      return null;
    }
  }, [user]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    fetchUser().finally(() => setLoading(false));
  }, [fetchUser]);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error?: string; user?: User }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || '登录失败' };
      }
      // 直接设置用户状态（同步更新）
      const userData = data.user as User;
      _pendingUser = userData;
      setUser(userData);
      // 标记已初始化，防止 fetchUser 覆盖登录状态
      initialized.current = true;
      setLoading(false);
      return { user: userData };
    } catch {
      return { error: '网络错误，请重试' };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    _pendingUser = null;
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}
