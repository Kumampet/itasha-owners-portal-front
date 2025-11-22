"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider
      // セッションの再取得間隔を設定（5分）
      refetchInterval={5 * 60}
      // フォーカス時にセッションを再取得
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}

