'use client';

import { type ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth-client';
import { ToastProvider } from '@/components/Toast';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  );
}
