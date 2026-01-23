"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { SnackbarProvider } from "@/contexts/snackbar-context";
import { Snackbar } from "@/components/snackbar";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    // Service Workerを登録（Push通知の許可取得は通知設定ページで行う）
    // next-pwaの設定でregister: falseにしているため、手動登録が必要
    // PWA環境でもPush通知が動作するように、手動登録を行う
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[Service Worker] Registered:", registration.scope);
        })
        .catch((error) => {
          console.error("[Service Worker] Registration failed:", error);
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
      <SnackbarProvider>
        {children}
        <Snackbar />
      </SnackbarProvider>
    </SessionProvider>
  );
}

