import { NextResponse } from "next/server";
import { auth } from "@/auth";

// GET /api/reminders/debug
// EventBridge Schedulerの設定状況を確認（デバッグ用）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 環境変数の設定状況を確認（機密情報は含めない）
    const config = {
      APP_AWS_REGION: process.env.APP_AWS_REGION ? "設定済み" : "未設定",
      APP_AWS_ACCESS_KEY_ID: process.env.APP_AWS_ACCESS_KEY_ID ? "設定済み" : "未設定",
      APP_AWS_SECRET_ACCESS_KEY: process.env.APP_AWS_SECRET_ACCESS_KEY ? "設定済み" : "未設定",
      EVENTBRIDGE_SCHEDULER_GROUP_NAME: process.env.EVENTBRIDGE_SCHEDULER_GROUP_NAME || "未設定（デフォルト: default）",
      EVENTBRIDGE_TARGET_ARN: process.env.EVENTBRIDGE_TARGET_ARN ? "設定済み" : "未設定",
      EVENTBRIDGE_ROLE_ARN: process.env.EVENTBRIDGE_ROLE_ARN ? "設定済み" : "未設定",
      REMINDER_NOTIFY_API_KEY: process.env.REMINDER_NOTIFY_API_KEY 
        ? `設定済み（長さ: ${process.env.REMINDER_NOTIFY_API_KEY.length}文字）` 
        : "未設定",
    };

    // ARNの形式チェック（設定されている場合のみ）
    const issues: string[] = [];
    
    if (process.env.EVENTBRIDGE_TARGET_ARN) {
      if (!process.env.EVENTBRIDGE_TARGET_ARN.startsWith("arn:aws:lambda:")) {
        issues.push("EVENTBRIDGE_TARGET_ARNの形式が正しくありません（Lambda関数のARNである必要があります）");
      }
      if (!process.env.EVENTBRIDGE_TARGET_ARN.includes("ap-northeast-1")) {
        issues.push("EVENTBRIDGE_TARGET_ARNのリージョンがap-northeast-1ではありません");
      }
    }

    if (process.env.EVENTBRIDGE_ROLE_ARN) {
      if (!process.env.EVENTBRIDGE_ROLE_ARN.startsWith("arn:aws:iam::")) {
        issues.push("EVENTBRIDGE_ROLE_ARNの形式が正しくありません（IAMロールのARNである必要があります）");
      }
    }

    if (process.env.EVENTBRIDGE_SCHEDULER_GROUP_NAME && 
        process.env.EVENTBRIDGE_SCHEDULER_GROUP_NAME !== "itasha-portal-push-schedule-group") {
      issues.push(`EVENTBRIDGE_SCHEDULER_GROUP_NAMEが期待値と異なります（現在: ${process.env.EVENTBRIDGE_SCHEDULER_GROUP_NAME}、期待値: itasha-portal-push-schedule-group）`);
    }

    const allRequiredSet = 
      process.env.APP_AWS_REGION &&
      process.env.APP_AWS_ACCESS_KEY_ID &&
      process.env.APP_AWS_SECRET_ACCESS_KEY &&
      process.env.EVENTBRIDGE_SCHEDULER_GROUP_NAME &&
      process.env.EVENTBRIDGE_TARGET_ARN &&
      process.env.EVENTBRIDGE_ROLE_ARN;

    // デバッグ用エンドポイントでリアルタイム性が重要なのでキャッシュを無効にする
    return NextResponse.json(
      {
        status: allRequiredSet ? "設定済み" : "設定不備あり",
        config,
        issues: issues.length > 0 ? issues : null,
        recommendations: !allRequiredSet ? [
          "必要な環境変数がすべて設定されているか確認してください",
          "Amplifyコンソールまたは.env.localで環境変数を設定してください",
          "環境変数を設定した後、アプリケーションを再デプロイしてください"
        ] : null,
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error checking configuration:", error);
    return NextResponse.json(
      { error: "Failed to check configuration", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

