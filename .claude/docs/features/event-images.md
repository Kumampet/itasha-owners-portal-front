# イベント画像

## アップロード

- `POST /api/upload/image`
- 保存: `src/lib/event-image-storage.ts`（S3 またはローカルバンドル `USE_LOCAL_BUNDLED_STORAGE`）

## 配信

- `GET /api/images/[...path]` が S3 プロキシ
- イベント `image_url` に保存されるパス形式を変える場合は管理フォーム・詳細表示・既存データを一括考慮

## 破壊禁止

- 公開 URL を認可なしで別ユーザーのプライベート画像に使わない（イベント画像の公開範囲はイベント公開方針に従う）
