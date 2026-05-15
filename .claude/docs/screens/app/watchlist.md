# ウォッチリスト（画面）

- **URL**: `/app/watchlist`
- **実装**: `src/app/(app)/app/watchlist/page.tsx`
- **認証**: 必須

## 機能

ログインユーザーがフォロー中のイベント一覧。

## API

- `GET /api/watchlist`
- 追加/解除: `POST/DELETE /api/events/[id]/watchlist`

## 関連仕様

- [features/watchlist.md](../../features/watchlist.md)
