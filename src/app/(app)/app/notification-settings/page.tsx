"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Button } from "@/components/button";

type NotificationSettings = {
  id: string;
  browser_notification_enabled: boolean;
  email_notification_enabled: boolean;
};

function NotificationSettingsPageContent() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<"checking" | "subscribed" | "not_subscribed" | "not_supported">("checking");
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
    checkSubscriptionStatus();
    // VAPID公開キーを取得
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (publicKey) {
      setVapidPublicKey(publicKey);
    }
  }, []);

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

  const checkSubscriptionStatus = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSubscriptionStatus("not_supported");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setSubscriptionStatus(subscription ? "subscribed" : "not_subscribed");
    } catch (error) {
      console.error("Error checking subscription status:", error);
      setSubscriptionStatus("not_subscribed");
    }
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("このブラウザは通知をサポートしていません");
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  };

  const subscribeToPush = async () => {
    if (!vapidPublicKey) {
      alert("VAPID公開キーが設定されていません");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // 通知許可をリクエスト
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        alert("通知の許可が必要です");
        return;
      }

      // プッシュサブスクリプションを作成
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      // サーバーにサブスクリプションを登録
      const res = await fetch("/api/user/push-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey("p256dh")!),
            auth: arrayBufferToBase64(subscription.getKey("auth")!),
          },
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to register subscription");
      }

      setSubscriptionStatus("subscribed");
      alert("プッシュ通知の登録が完了しました");
    } catch (error) {
      console.error("Error subscribing to push:", error);
      alert(`プッシュ通知の登録に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // サーバーからサブスクリプションを削除
        await fetch("/api/user/push-subscription", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        });

        // ブラウザからも削除
        await subscription.unsubscribe();
      }

      setSubscriptionStatus("not_subscribed");
      alert("プッシュ通知の登録を解除しました");
    } catch (error) {
      console.error("Error unsubscribing from push:", error);
      alert(`プッシュ通知の解除に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const updateSettings = async (updates: Partial<NotificationSettings>) => {
    if (!settings) return;

    setSaving(true);
    try {
      const res = await fetch("/api/user/notification-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...settings,
          ...updates,
        }),
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

  // VAPIDキーをUint8Arrayに変換するヘルパー関数
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray as Uint8Array;
  };

  // ArrayBufferをBase64に変換するヘルパー関数
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  if (loading) {
    return (
      <main className="flex-1">
        <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
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
              プッシュ通知やメール通知の設定を行えます。
            </p>
          </div>
        </header>

        <div className="space-y-6">
          {/* プッシュ通知設定 */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-zinc-900 sm:text-base mb-4">
              プッシュ通知
            </h2>

            {subscriptionStatus === "not_supported" ? (
              <p className="text-xs text-zinc-600 sm:text-sm">
                このブラウザはプッシュ通知をサポートしていません。
              </p>
            ) : subscriptionStatus === "checking" ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span className="text-xs text-zinc-600 sm:text-sm">確認中...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      プッシュ通知を有効にする
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">
                      {subscriptionStatus === "subscribed"
                        ? "プッシュ通知が登録されています"
                        : "プッシュ通知を登録すると、新しいメッセージが届いたときに通知を受け取れます"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {subscriptionStatus === "subscribed" ? (
                      <Button
                        onClick={unsubscribeFromPush}
                        variant="secondary"
                        size="sm"
                      >
                        解除
                      </Button>
                    ) : (
                      <Button
                        onClick={subscribeToPush}
                        variant="primary"
                        size="sm"
                        disabled={!vapidPublicKey}
                      >
                        登録
                      </Button>
                    )}
                  </div>
                </div>

                {settings && (
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        ブラウザ通知の設定
                      </p>
                      <p className="text-xs text-zinc-600 mt-1">
                        プッシュ通知を受け取るかどうかを設定します
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.browser_notification_enabled}
                        onChange={(e) =>
                          updateSettings({
                            browser_notification_enabled: e.target.checked,
                          })
                        }
                        disabled={saving || subscriptionStatus !== "subscribed"}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* メール通知設定（将来の実装用に残す） */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-zinc-900 sm:text-base mb-4">
              メール通知
            </h2>
            <p className="text-xs text-zinc-600 sm:text-sm">
              メール通知機能は現在実装中です。
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}

export default function NotificationSettingsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1">
          <section className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-20 pt-6 sm:pb-10 sm:pt-8">
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          </section>
        </main>
      }
    >
      <NotificationSettingsPageContent />
    </Suspense>
  );
}
