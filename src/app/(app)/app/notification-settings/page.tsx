"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Card, CardTitle, CardContent } from "@/components/card";
import { Button } from "@/components/button";

interface NotificationSettings {
  id: string;
  user_id: string;
  browser_notification_enabled: boolean;
  email_notification_enabled: boolean;
  group_message_unread_notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

function NotificationSettingsPageContent() {
  const router = useRouter();
  const { status } = useSession();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/app/mypage");
      return;
    }

    if (status === "authenticated") {
      fetchSettings();
    }
  }, [status, router]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/user/notification-settings");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Error fetching notification settings:", {
          status: res.status,
          statusText: res.statusText,
          error: errorData,
        });
        throw new Error(
          errorData.details || errorData.error || "Failed to fetch notification settings"
        );
      }
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      const errorMessage =
        error instanceof Error ? error.message : "通知設定の取得に失敗しました";
      alert(`通知設定の取得に失敗しました: ${errorMessage}`);
    } finally {
      setLoading(false);
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

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Error updating notification settings:", {
          status: res.status,
          statusText: res.statusText,
          error: errorData,
        });
        throw new Error(
          errorData.details || errorData.error || "Failed to update notification settings"
        );
      }

      const updatedSettings = await res.json();
      setSettings(updatedSettings);
    } catch (error) {
      console.error("Error updating notification settings:", error);
      const errorMessage =
        error instanceof Error ? error.message : "通知設定の更新に失敗しました";
      alert(`通知設定の更新に失敗しました: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEmailNotificationToggle = (enabled: boolean) => {
    updateSettings({ email_notification_enabled: enabled });
  };

  const handleGroupMessageUnreadNotificationToggle = (enabled: boolean) => {
    updateSettings({
      group_message_unread_notification_enabled: enabled,
    });
  };

  if (loading || !settings) {
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
        <div className="mb-4">
          <Button
            variant="secondary"
            size="sm"
            rounded="md"
            onClick={() => router.back()}
          >
            ← 戻る
          </Button>
        </div>

        <Card>
          <CardTitle className="mb-4">通知設定</CardTitle>
          <CardContent className="space-y-6">
            {/* メール通知の許可 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">
                    メール通知の許可
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    メール通知を有効にするかどうかを設定します。OFFの場合は、すべてのメール通知が無効になります。
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email_notification_enabled}
                    onChange={(e) =>
                      handleEmailNotificationToggle(e.target.checked)
                    }
                    disabled={saving}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-zinc-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
                </label>
              </div>
            </div>

            {/* 団体メッセージ未読通知 */}
            <div className="space-y-2 border-t border-zinc-200 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">
                    団体メッセージ未読通知
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    団体の未読メッセージがある場合にメール通知を送信します。
                    {!settings.email_notification_enabled && (
                      <span className="block mt-1 text-zinc-400">
                        ※メール通知の許可がOFFの場合は送信されません。
                      </span>
                    )}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      settings.email_notification_enabled &&
                      settings.group_message_unread_notification_enabled
                    }
                    onChange={(e) =>
                      handleGroupMessageUnreadNotificationToggle(
                        e.target.checked
                      )
                    }
                    disabled={saving || !settings.email_notification_enabled}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-zinc-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
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
