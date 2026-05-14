# イベント掲載依頼

- **URL**: `/app/event-submission`
- **実装**: `src/app/(app)/app/event-submission/page.tsx`
- **認証**: 不要（未ログイン送信可）

## 機能

ユーザーがイベント情報を投稿し、管理者が `/admin/submissions` で処理する。

## API

- `POST /api/event-submissions`
- 管理: `GET /api/admin/submissions`, `POST .../process`

## 通知

管理者向け Discord 等（`discord-admin-notify`）を壊さない。

## 破壊禁止

- ミドルウェアの公開例外を維持する
- 送信後の UX（完了メッセージ・バリデーション）を無言で削除しない
