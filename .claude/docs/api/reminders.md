# API: リマインダー

| パス | 用途 |
| --- | --- |
| `/api/reminders` | 一覧・作成 |
| `/api/reminders/[id]` | 取得・更新・削除 |
| `/api/reminders/[id]/schedule` | EventBridge 登録 |
| `/api/reminders/[id]/ical` | iCal |
| `/api/reminders/check` | 期限チェック（API キー） |
| `/api/reminders/notify/[id]` | 通知実行（API キー） |
| `/api/reminders/debug` | スケジューラ診断 |

`src/lib/reminder-scheduler.ts` と環境変数（EventBridge ARN 等）をセットで扱う。
