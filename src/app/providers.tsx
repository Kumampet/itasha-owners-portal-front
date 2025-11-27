"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import type { ReactNode } from "react";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    // Service Workerを登録（Push通知の許可取得は通知設定ページで行う）
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

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

