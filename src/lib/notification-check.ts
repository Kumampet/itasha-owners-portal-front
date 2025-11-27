// 通知設定チェック用のユーティリティ

/**
 * ブラウザの通知許可状態をチェック
 * @returns 通知が許可されているかどうか
 */
export function isNotificationPermissionGranted(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  if (!("Notification" in window)) {
    return false;
  }

  return Notification.permission === "granted";
}

/**
 * 通知設定が有効かどうかをチェック（サーバー側）
 * @returns 通知設定が有効かどうか
 */
export async function checkNotificationSettingsEnabled(): Promise<{ enabled: boolean; settings: { browser: boolean; email: boolean } | null }> {
  try {
    const res = await fetch("/api/user/notification-settings");
    if (!res.ok) {
      return { enabled: false, settings: null };
    }

    const settings = await res.json();
    const browserEnabled = settings.browser_notification_enabled ?? false;
    const emailEnabled = settings.email_notification_enabled ?? false;

    return {
      enabled: browserEnabled || emailEnabled,
      settings: {
        browser: browserEnabled,
        email: emailEnabled,
      },
    };
  } catch (error) {
    console.error("Error checking notification settings:", error);
    return { enabled: false, settings: null };
  }
}

/**
 * 通知設定が必要かどうかをチェック（クライアント側）
 * @returns 通知設定が必要かどうか
 */
export async function shouldRedirectToNotificationSettings(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  // ブラウザの通知許可状態をチェック
  const isPermissionGranted = isNotificationPermissionGranted();

  // 通知が許可されていない場合は、通知設定ページにリダイレクト
  if (!isPermissionGranted) {
    return true;
  }

  // 通知設定が有効かどうかをチェック（サーバー側）
  try {
    const res = await fetch("/api/user/notification-settings");
    if (!res.ok) {
      return false;
    }

    const settings = await res.json();
    const browserEnabled = settings.browser_notification_enabled ?? false;
    const emailEnabled = settings.email_notification_enabled ?? false;

    // どちらも無効な場合は、通知設定ページにリダイレクト
    return !browserEnabled && !emailEnabled;
  } catch (error) {
    console.error("Error checking notification settings:", error);
    return false;
  }
}

