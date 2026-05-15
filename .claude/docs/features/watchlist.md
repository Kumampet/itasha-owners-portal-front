# ウォッチリスト機能

## データ

- `EventFollow`（ユーザー × イベント）

## エントリポイント

- イベント一覧・詳細の `watchlist-button`
- `/app/watchlist`
- `GET /api/watchlist`, `POST/DELETE /api/events/[id]/watchlist`

## ルール

- 未ログインはトグル不可（ログイン導線）
- 公開イベントのみ対象（承認済み条件と一致）

## 破壊禁止

- フォロー状態の二重定義（クライアントだけで保持しない）
