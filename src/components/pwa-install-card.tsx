"use client";

import { useState, useEffect } from "react";
import { Button } from "./button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallCard() {
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

    // beforeinstallpromptイベントをリッスン
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // isVisibleはdeferredPromptから計算
  const isVisible = deferredPrompt !== null;

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

  if (!isVisible) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 sm:hidden">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
            ホーム画面に追加
          </h2>
          <p className="mt-1 text-xs text-zinc-700 sm:text-sm">
            アプリのように使えます。オフライン機能も利用できます。
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          rounded="md"
          onClick={handleInstall}
          className="whitespace-nowrap shrink-0"
        >
          追加
        </Button>
      </div>
    </div>
  );
}

