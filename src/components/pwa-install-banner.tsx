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
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // PC表示では非表示
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(mobile);
    
    if (!mobile) {
      return;
    }

    // 既にPWAとしてインストールされている場合は非表示
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(standalone);
    
    if (standalone) {
      return;
    }

    // beforeinstallpromptイベントをリッスン（Android Chrome等で利用可能）
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // モバイルで、PWAとしてインストールされていない場合、かつ非表示にされていない場合は表示
  const isVisible = isMobile && !isStandalone && !isDismissed;

  const handleInstall = async () => {
    // beforeinstallpromptイベントが利用可能な場合（Android Chrome等）
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
      return;
    }

    // iOS Safariの場合、手動でホーム画面に追加する方法を案内
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isIOS) {
      // iOS Safariの場合は、ブラウザのメニューから「ホーム画面に追加」を案内
      alert("Safariのメニュー（共有ボタン）から「ホーム画面に追加」を選択してください。");
    } else {
      // その他のAndroidブラウザの場合
      alert("ブラウザのメニューから「ホーム画面に追加」または「アプリをインストール」を選択してください。");
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

