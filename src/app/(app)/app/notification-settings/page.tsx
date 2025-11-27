"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "@/lib/push-client";

// ArrayBufferをBase64URLエンコードに変換
function arrayBufferToBase64URL(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

type NotificationSettings = {
  id: string;
  browser_notification_enabled: boolean;
  email_notification_enabled: boolean;
};

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/user/notification-settings");
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data = await res.json();
        setSettings(data);
      } catch (error) {
        console.error("Failed to fetch notification settings:", error);
      } finally {
        setLoading(false);
      }
    };

    // Push通知のサポート状況を確認
    const checkPushSupport = async () => {
      if (
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
      ) {
        setPushSupported(true);
        
        // Service Workerが登録されているか確認
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setPushSubscribed(!!subscription);
        } catch (error) {
          console.error("Failed to check push subscription:", error);
        }
      }
    };

    fetchSettings();
    checkPushSupport();
  }, []);

  const handleToggle = async (field: "browser_notification_enabled" | "email_notification_enabled") => {
    if (!settings || saving) return;

    // ブラウザ通知を有効にする場合、Push通知の許可を取得
    if (field === "browser_notification_enabled" && !settings.browser_notification_enabled) {
      if (!pushSupported) {
        alert("このブラウザはPush通知をサポートしていません");
        return;
      }

      try {
        // VAPID公開キーが設定されているか確認
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey || vapidPublicKey.trim() === "") {
          alert(
            "Push通知の設定が完了していません。管理者にお問い合わせください。\n" +
            "（VAPID公開キーが設定されていません）"
          );
          return;
        }

        // 通知許可を取得
        const permission = await requestNotificationPermission();
        if (permission !== "granted") {
          alert("通知の許可が必要です。ブラウザの設定から通知を許可してください。");
          return;
        }

        // Service Workerを登録
        const registration = await registerServiceWorker();
        
        // Push通知にサブスクライブ
        const subscription = await subscribeToPushNotifications(registration);
        
        if (subscription) {
          // サブスクリプションをサーバーに送信
          const p256dhKey = subscription.getKey("p256dh");
          const authKey = subscription.getKey("auth");
          
          if (!p256dhKey || !authKey) {
            throw new Error("Failed to get subscription keys");
          }

          // Base64URLエンコード（web-pushライブラリが期待する形式）
          const p256dh = arrayBufferToBase64URL(p256dhKey);
          const auth = arrayBufferToBase64URL(authKey);

          const res = await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              endpoint: subscription.endpoint,
              keys: {
                p256dh,
                auth,
              },
            }),
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(
              errorData.error || `Failed to subscribe to push notifications (${res.status})`
            );
          }

          setPushSubscribed(true);
        }
      } catch (error) {
        console.error("Failed to enable push notifications:", error);
        alert(
          error instanceof Error
            ? error.message
            : "Push通知の有効化に失敗しました"
        );
        return;
      }
    }

    // ブラウザ通知を無効にする場合、Push通知のサブスクリプションを解除
    if (field === "browser_notification_enabled" && settings.browser_notification_enabled) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await unsubscribeFromPushNotifications(registration);
        
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              endpoint: subscription.endpoint,
            }),
          });
        }
        
        setPushSubscribed(false);
      } catch (error) {
        console.error("Failed to unsubscribe from push notifications:", error);
        // エラーが発生しても設定の更新は続行
      }
    }

    setSaving(true);
    try {
      const newSettings = {
        ...settings,
        [field]: !settings[field],
      };

      const res = await fetch("/api/user/notification-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });

      if (!res.ok) throw new Error("Failed to update settings");

      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error("Failed to update notification settings:", error);
      alert("設定の更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1">
        <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900"></div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
        <header className="space-y-2">
          <Link
            href="/app/mypage"
            className="text-xs font-semibold uppercase tracking-wide text-emerald-600"
          >
            ← マイページへ戻る
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              通知設定
            </h1>
            <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
              リマインダーの通知方法を設定します。ブラウザ通知とメール通知を個別に有効/無効にできます。
            </p>
          </div>
        </header>

        {settings && (
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
                  ブラウザ通知
                </h2>
                <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
                  ブラウザの通知機能を使用してリマインダーをお知らせします。
                </p>
                {!pushSupported && (
                  <p className="mt-1 text-xs text-red-600">
                    このブラウザはPush通知をサポートしていません
                  </p>
                )}
                {pushSupported && pushSubscribed && (
                  <p className="mt-1 text-xs text-emerald-600">
                    Push通知が有効になっています
                  </p>
                )}
              </div>
              <button
                onClick={() => handleToggle("browser_notification_enabled")}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  settings.browser_notification_enabled
                    ? "bg-emerald-600"
                    : "bg-zinc-200"
                } ${saving ? "opacity-50" : ""}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.browser_notification_enabled
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 sm:text-base">
                  メール通知
                </h2>
                <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
                  メールでリマインダーをお知らせします。
                </p>
              </div>
              <button
                onClick={() => handleToggle("email_notification_enabled")}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  settings.email_notification_enabled
                    ? "bg-emerald-600"
                    : "bg-zinc-200"
                } ${saving ? "opacity-50" : ""}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.email_notification_enabled
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

