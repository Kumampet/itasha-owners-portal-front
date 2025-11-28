// 通知設定チェック用のユーティリティ
// TODO: 通知設定機能を削除しました。将来的に再実装する場合は、以下の機能を実装してください：
// - 通知設定が有効かどうかをチェックする機能
// - 通知設定が必要かどうかをチェックする機能

/**
 * 通知設定が有効かどうかをチェック（サーバー側）
 * @returns 通知設定が有効かどうか
 */
export async function checkNotificationSettingsEnabled(): Promise<{ enabled: boolean; settings: { browser: boolean; email: boolean } | null }> {
  // TODO: 通知設定機能を削除しました。将来的に再実装する場合は、ここに通知設定チェックロジックを追加してください。
  return { enabled: false, settings: null };
}

/**
 * 通知設定が必要かどうかをチェック（クライアント側）
 * @returns 通知設定が必要かどうか
 */
export async function shouldRedirectToNotificationSettings(): Promise<boolean> {
  // TODO: 通知設定機能を削除しました。将来的に再実装する場合は、ここに通知設定チェックロジックを追加してください。
  return false;
}
