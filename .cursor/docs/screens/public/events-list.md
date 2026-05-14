# イベント一覧

- **URL**: `/events`
- **実装**: `src/app/(app)/events/page.tsx`, `events-page-client.tsx`
- **認証**: 不要

## 機能

- 承認済み公開イベントの一覧・カレンダー表示
- フィルタ: `src/components/events-filter-panel.tsx`（地域・期間・タグ等）
- カード: `events-card-content.tsx`
- ウォッチリスト操作はログイン時のみ（`watchlist-button`）

## API

- `GET /api/events`（クエリでフィルタ・ページング）

## テスト

- `src/app/(app)/events/__tests__/page.test.tsx`

## 破壊禁止

- 未ログインでも一覧が閲覧できること
- 公開条件を一覧と LP・詳細で一致させる
