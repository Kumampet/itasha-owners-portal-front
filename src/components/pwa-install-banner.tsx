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
  const [showInstructions, setShowInstructions] = useState(false);

  // モバイル判定とPWAインストール状態を初期値として設定
  const [isMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  });

  // ブラウザ判定（初期値として設定）
  const [browserType] = useState<"safari" | "chrome" | "other">(() => {
    if (typeof window === "undefined") return "other";

    const userAgent = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    const isAndroid = /Android/i.test(userAgent);
    
    // iOSの場合は基本的にSafariとして扱う（iOS ChromeもSafariの手順を表示）
    if (isIOS) {
      return "safari";
    }
    
    // Safari系の判定（Chromeが含まれていないSafari、macOS Safari等）
    const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent);
    
    // Chrome系の判定（Edgeは除外）
    const isChrome = /Chrome/i.test(userAgent) && !/Edg/i.test(userAgent);
    
    if (isSafari) {
      return "safari";
    } else if (isChrome || isAndroid) {
      return "chrome";
    } else {
      return "other";
    }
  });

  const [isStandalone] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(display-mode: standalone)").matches;
  });

  useEffect(() => {
    // PC表示では非表示
    if (!isMobile) {
      return;
    }

    // 既にPWAとしてインストールされている場合は非表示
    if (isStandalone) {
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
  }, [isMobile, isStandalone]);

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

    // beforeinstallpromptが利用できない場合、手動インストール手順を表示
    setShowInstructions(true);
  };

  const handleDismiss = () => {
    setIsDismissedState(true);
    localStorage.setItem("pwa-banner-dismissed", "true");
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <>
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

      {/* ブラウザ別のインストール手順モーダル */}
      {showInstructions && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-zinc-900">
                {browserType === "safari"
                  ? "ホーム画面に追加する方法 (Safari)"
                  : browserType === "chrome"
                  ? "アプリをインストールする方法 (Chrome)"
                  : "ホーム画面に追加する方法"}
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                アプリのように使うには、以下の手順でホーム画面に追加してください。
              </p>
            </div>

            {browserType === "safari" ? (
              // Safari系の手順
              <ol className="space-y-3 text-sm text-zinc-700">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                    1
                  </span>
                  <span className="pt-0.5">
                    画面下部の<strong className="font-semibold">共有ボタン（<span className="inline-block align-middle"><svg className="h-4 w-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684z" /></svg></span>）</strong>をタップ
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                    2
                  </span>
                  <span className="pt-0.5">
                    メニューから<strong className="font-semibold">「ホーム画面に追加」</strong>を選択
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                    3
                  </span>
                  <span className="pt-0.5">
                    右上の<strong className="font-semibold">「追加」</strong>をタップ
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                    4
                  </span>
                  <span className="pt-0.5">
                    ホーム画面からアプリを開いて、通知設定ページでPush通知を有効にできます。
                  </span>
                </li>
              </ol>
            ) : browserType === "chrome" ? (
              // Chrome系の手順
              <ol className="space-y-3 text-sm text-zinc-700">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                    1
                  </span>
                  <span className="pt-0.5">
                    画面右上の<strong className="font-semibold">メニューボタン（<span className="inline-block align-middle"><svg className="h-4 w-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg></span>）</strong>をタップ
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                    2
                  </span>
                  <span className="pt-0.5">
                    メニューから<strong className="font-semibold">「アプリをインストール」</strong>または<strong className="font-semibold">「ホーム画面に追加」</strong>を選択
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                    3
                  </span>
                  <span className="pt-0.5">
                    確認ダイアログで<strong className="font-semibold">「インストール」</strong>または<strong className="font-semibold">「追加」</strong>をタップ
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                    4
                  </span>
                  <span className="pt-0.5">
                    ホーム画面からアプリを開いて、通知設定ページでPush通知を有効にできます。
                  </span>
                </li>
              </ol>
            ) : (
              // その他のブラウザの手順
              <ol className="space-y-3 text-sm text-zinc-700">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-500 text-xs font-bold text-white">
                    1
                  </span>
                  <span className="pt-0.5">
                    ブラウザのメニューを開く
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-500 text-xs font-bold text-white">
                    2
                  </span>
                  <span className="pt-0.5">
                    <strong className="font-semibold">「ホーム画面に追加」</strong>または<strong className="font-semibold">「アプリをインストール」</strong>を選択
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-500 text-xs font-bold text-white">
                    3
                  </span>
                  <span className="pt-0.5">
                    確認ダイアログで<strong className="font-semibold">「追加」</strong>または<strong className="font-semibold">「インストール」</strong>をタップ
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-500 text-xs font-bold text-white">
                    4
                  </span>
                  <span className="pt-0.5">
                    ホーム画面からアプリを開いて、通知設定ページでPush通知を有効にできます。
                  </span>
                </li>
              </ol>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowInstructions(false)}
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

