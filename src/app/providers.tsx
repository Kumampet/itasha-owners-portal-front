"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import type { ReactNode } from "react";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  // next-pwaが自動的にService Workerを登録するため、手動登録は不要
  // 既存のPush通知機能は、next-pwaの生成するService Workerに統合される

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

