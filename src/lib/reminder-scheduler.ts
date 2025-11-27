import { SchedulerClient, CreateScheduleCommand, UpdateScheduleCommand, DeleteScheduleCommand, GetScheduleCommand } from "@aws-sdk/client-scheduler";

// AWS EventBridge Schedulerクライアントの初期化
const schedulerClient = new SchedulerClient({
  region: process.env.AWS_REGION || "ap-northeast-1",
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

// スケジュール名の生成（リマインダーIDから）
function getScheduleName(reminderId: string): string {
  return `reminder-${reminderId}`;
}

// スケジュールグループ名（環境変数から取得、デフォルトは "default"）
const SCHEDULE_GROUP_NAME = process.env.EVENTBRIDGE_SCHEDULER_GROUP_NAME || "default";

/**
 * リマインダーの通知スケジュールを作成
 * EventBridge SchedulerのターゲットとしてLambda関数を使用
 */
export async function createReminderSchedule(
  reminderId: string,
  scheduledTime: Date
): Promise<{ success: boolean; scheduleArn?: string; error?: string }> {
  try {
    // スケジュール名
    const scheduleName = getScheduleName(reminderId);

    // スケジュール時刻が過去の場合は作成しない
    if (scheduledTime < new Date()) {
      console.warn(`[Reminder Scheduler] Skipping schedule creation for past reminder: ${reminderId}`);
      return { success: false, error: "Scheduled time is in the past" };
    }

    // Lambda関数のARNとIAMロールARNが必要
    const lambdaArn = process.env.EVENTBRIDGE_TARGET_ARN;
    const roleArn = process.env.EVENTBRIDGE_ROLE_ARN;

    if (!lambdaArn || !roleArn) {
      console.warn(`[Reminder Scheduler] EVENTBRIDGE_TARGET_ARN or EVENTBRIDGE_ROLE_ARN is not set. Skipping schedule creation.`);
      return { success: false, error: "EventBridge configuration is missing" };
    }

    // スケジュールを作成
    const command = new CreateScheduleCommand({
      Name: scheduleName,
      GroupName: SCHEDULE_GROUP_NAME,
      ScheduleExpression: `at(${scheduledTime.toISOString()})`,
      Target: {
        Arn: lambdaArn, // Lambda関数のARN
        RoleArn: roleArn, // EventBridgeがLambdaを呼び出すためのIAMロールARN
        Input: JSON.stringify({
          reminderId: reminderId,
        }),
        RetryPolicy: {
          MaximumRetryAttempts: 3,
          MaximumEventAgeInSeconds: 3600, // 1時間
        },
      },
      FlexibleTimeWindow: {
        Mode: "OFF", // 厳密な時刻指定
      },
      Description: `Reminder notification for reminder ${reminderId}`,
      State: "ENABLED",
    });

    const response = await schedulerClient.send(command);

    console.log(`[Reminder Scheduler] Created schedule for reminder ${reminderId}: ${response.ScheduleArn}`);

    return {
      success: true,
      scheduleArn: response.ScheduleArn,
    };
  } catch (error) {
    console.error(`[Reminder Scheduler] Failed to create schedule for reminder ${reminderId}:`, error);
    
    // スケジュールが既に存在する場合は更新を試みる
    if (error instanceof Error && error.message.includes("ConflictException")) {
      console.log(`[Reminder Scheduler] Schedule already exists, attempting to update: ${reminderId}`);
      return updateReminderSchedule(reminderId, scheduledTime);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * リマインダーの通知スケジュールを更新
 */
export async function updateReminderSchedule(
  reminderId: string,
  scheduledTime: Date
): Promise<{ success: boolean; scheduleArn?: string; error?: string }> {
  try {
    const scheduleName = getScheduleName(reminderId);

    // スケジュール時刻が過去の場合は削除
    if (scheduledTime < new Date()) {
      console.warn(`[Reminder Scheduler] Deleting schedule for past reminder: ${reminderId}`);
      return deleteReminderSchedule(reminderId);
    }

    const lambdaArn = process.env.EVENTBRIDGE_TARGET_ARN;
    const roleArn = process.env.EVENTBRIDGE_ROLE_ARN;

    if (!lambdaArn || !roleArn) {
      console.warn(`[Reminder Scheduler] EVENTBRIDGE_TARGET_ARN or EVENTBRIDGE_ROLE_ARN is not set. Skipping schedule update.`);
      return { success: false, error: "EventBridge configuration is missing" };
    }

    const command = new UpdateScheduleCommand({
      Name: scheduleName,
      GroupName: SCHEDULE_GROUP_NAME,
      ScheduleExpression: `at(${scheduledTime.toISOString()})`,
      Target: {
        Arn: lambdaArn,
        RoleArn: roleArn,
        Input: JSON.stringify({
          reminderId: reminderId,
        }),
        RetryPolicy: {
          MaximumRetryAttempts: 3,
          MaximumEventAgeInSeconds: 3600,
        },
      },
      FlexibleTimeWindow: {
        Mode: "OFF",
      },
      Description: `Reminder notification for reminder ${reminderId}`,
      State: "ENABLED",
    });

    const response = await schedulerClient.send(command);

    console.log(`[Reminder Scheduler] Updated schedule for reminder ${reminderId}: ${response.ScheduleArn}`);

    return {
      success: true,
      scheduleArn: response.ScheduleArn,
    };
  } catch (error) {
    console.error(`[Reminder Scheduler] Failed to update schedule for reminder ${reminderId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * リマインダーの通知スケジュールを削除
 */
export async function deleteReminderSchedule(
  reminderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const scheduleName = getScheduleName(reminderId);

    const command = new DeleteScheduleCommand({
      Name: scheduleName,
      GroupName: SCHEDULE_GROUP_NAME,
    });

    await schedulerClient.send(command);

    console.log(`[Reminder Scheduler] Deleted schedule for reminder ${reminderId}`);

    return { success: true };
  } catch (error) {
    // スケジュールが存在しない場合は成功として扱う
    if (error instanceof Error && (error.message.includes("ResourceNotFoundException") || error.message.includes("NotFoundException"))) {
      console.log(`[Reminder Scheduler] Schedule not found (already deleted): ${reminderId}`);
      return { success: true };
    }

    console.error(`[Reminder Scheduler] Failed to delete schedule for reminder ${reminderId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * スケジュールの存在確認
 */
export async function scheduleExists(reminderId: string): Promise<boolean> {
  try {
    const scheduleName = getScheduleName(reminderId);

    const command = new GetScheduleCommand({
      Name: scheduleName,
      GroupName: SCHEDULE_GROUP_NAME,
    });

    await schedulerClient.send(command);
    return true;
  } catch {
    return false;
  }
}

