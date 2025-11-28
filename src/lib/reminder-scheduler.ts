// TODO: EventBridge Scheduler機能を削除しました。将来的に再実装する場合は、以下の機能を実装してください：
// - createReminderSchedule: リマインダーの通知スケジュールを作成
// - updateReminderSchedule: リマインダーの通知スケジュールを更新
// - deleteReminderSchedule: リマインダーの通知スケジュールを削除
// - scheduleExists: スケジュールの存在確認

/**
 * リマインダーの通知スケジュールを作成
 * EventBridge Scheduler機能が削除されたため、常に成功を返します
 */
export async function createReminderSchedule(
  reminderId: string,
  scheduledTime: Date
): Promise<{ success: boolean; scheduleArn?: string; error?: string }> {
  // TODO: EventBridge Scheduler機能を削除しました。将来的に再実装する場合は、ここにスケジュール作成ロジックを追加してください。
  console.log(`[Reminder Scheduler] Schedule creation skipped for reminder ${reminderId} (EventBridge Scheduler disabled)`);
  return { success: true };
}

/**
 * リマインダーの通知スケジュールを更新
 * EventBridge Scheduler機能が削除されたため、常に成功を返します
 */
export async function updateReminderSchedule(
  reminderId: string,
  scheduledTime: Date
): Promise<{ success: boolean; scheduleArn?: string; error?: string }> {
  // TODO: EventBridge Scheduler機能を削除しました。将来的に再実装する場合は、ここにスケジュール更新ロジックを追加してください。
  console.log(`[Reminder Scheduler] Schedule update skipped for reminder ${reminderId} (EventBridge Scheduler disabled)`);
  return { success: true };
}

/**
 * リマインダーの通知スケジュールを削除
 * EventBridge Scheduler機能が削除されたため、常に成功を返します
 */
export async function deleteReminderSchedule(
  reminderId: string
): Promise<{ success: boolean; error?: string }> {
  // TODO: EventBridge Scheduler機能を削除しました。将来的に再実装する場合は、ここにスケジュール削除ロジックを追加してください。
  console.log(`[Reminder Scheduler] Schedule deletion skipped for reminder ${reminderId} (EventBridge Scheduler disabled)`);
  return { success: true };
}

/**
 * スケジュールの存在確認
 * EventBridge Scheduler機能が削除されたため、常にfalseを返します
 */
export async function scheduleExists(reminderId: string): Promise<boolean> {
  // TODO: EventBridge Scheduler機能を削除しました。将来的に再実装する場合は、ここにスケジュール存在確認ロジックを追加してください。
  return false;
}
