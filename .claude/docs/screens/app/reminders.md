# リマインダー

- **URL**: `/app/reminder`, `/app/reminder/new`, `/app/reminder/[id]/edit`
- **実装**: 各 `page.tsx`, `reminder-card.tsx`
- **認証**: 必須

## 機能

- 一覧・削除
- 新規/編集: 日時、イベント紐付け、通知チャネル
- カレンダー連携・iCal: `src/lib/calendar.ts`, `GET /api/reminders/[id]/ical`
- スケジュール: EventBridge（`reminder-scheduler.ts`）

## API

- `GET/POST /api/reminders`, `GET/PATCH/DELETE /api/reminders/[id]`
- 運用: `reminders/check`, `reminders/notify/[id]`（API キー）

## 破壊禁止

- 通知スケジュールと DB レコードの不整合を招く削除
- iCal URL の認可モデルを緩めない
