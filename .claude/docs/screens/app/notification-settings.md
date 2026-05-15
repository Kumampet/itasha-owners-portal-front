# 通知設定

- **URL**: `/app/notification-settings`
- **実装**: `src/app/(app)/app/notification-settings/page.tsx`
- **認証**: 必須

## 機能

- ブラウザ通知（Web Push）の ON/OFF と購読登録
- メール通知、団体未読メッセージ通知などチャネル別設定
- `GET/PATCH /api/user/notification-settings`
- `POST/DELETE /api/user/push-subscription`

## 関連

- [features/push-notifications.md](../../features/push-notifications.md)
- Service Worker: `providers.tsx`

## 破壊禁止

- VAPID 鍵とクライアント公開鍵の不一致
- 通知オフ時に Push だけ残す等の不整合
