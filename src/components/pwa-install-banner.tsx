"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallBanner() {
  // ローカルストレージで非表示状態を初期値として設定
  const [isDismissed, setIsDismissedState] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("pwa-banner-dismissed") === "true";
  });
  
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // PC表示では非表示
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
      return;
    }

    // 既にPWAとしてインストールされている場合は非表示
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    // 既に非表示にされている場合は何もしない
    if (isDismissed) {
      return;
    }

    // beforeinstallpromptイベントをリッスン
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [isDismissed]);

  // isVisibleはdeferredPromptとisDismissedから計算
  const isVisible = deferredPrompt !== null && !isDismissed;

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissedState(true);
    localStorage.setItem("pwa-banner-dismissed", "true");
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200 shadow-lg sm:hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-900">
            ホーム画面に追加
          </p>
          <p className="text-xs text-zinc-600 mt-0.5">
            アプリのように使えます
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800"
          >
            追加
          </button>
          <button
            onClick={handleDismiss}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 transition"
            aria-label="閉じる"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

