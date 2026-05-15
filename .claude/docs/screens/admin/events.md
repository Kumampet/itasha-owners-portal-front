# 管理: イベント

- **URL**: `/admin/events`, `/admin/events/new`, `/admin/events/[id]`
- **認証**: `ADMIN` または `ORGANIZER`（後者は自分作成イベントのみ）

## 機能

- 一覧・承認状態フィルタ
- 新規作成・編集（`event-form.tsx`, WYSIWYG）
- 承認/却下: `approve` / `reject` API
- 画像アップロード連携

## API

- `GET/POST /api/admin/events`, `GET/PATCH /api/admin/events/[id]`
- `POST .../approve`, `POST .../reject`

## 破壊禁止

- `ORGANIZER` に他人のイベント編集を許可しない
- 承認前イベントが公開一覧に出ないよう公開 API と整合
