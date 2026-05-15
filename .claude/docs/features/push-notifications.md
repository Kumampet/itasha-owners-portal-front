# Push 通知

## 設定 UI

`/app/notification-settings`

## サーバー

- `src/lib/push-notification.ts`, `notification-check.ts`
- `PushSubscription` モデル
- 環境変数: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

## クライアント

- Service Worker 登録: `providers.tsx`
- 購読 API: `/api/user/push-subscription`

## 団体未読

通知設定と未読数 API（`groups/unread-count`）の組み合わせ。Lambda リマインダー（`lambda/group-message-reminder`）と役割を混同しない。

## 破壊禁止

- 通知 OFF でも Push エンドポイントだけ残す
- VAPID ローテ時に旧購読の扱いを無視する
