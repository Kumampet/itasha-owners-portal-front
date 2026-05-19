# イベント一覧

- **URL**: `/events`
- **実装**: `src/app/(app)/events/page.tsx`, `events-page-client.tsx`
- **認証**: 不要

## 機能

- 承認済み公開イベントの一覧・カレンダー表示
- フィルタ: `src/components/events-filter-panel.tsx`（地域・期間・タグ等）。キーワード・各プルダウン・表示順・表示件数の変更は **「検索」ボタン** で確定するまで `GET /api/events` を呼ばない（ページネーションは確定済み条件で API を呼ぶ）
- カード: `events-card-content.tsx`（「本日開催」「あとN日」バッジ付き）
- バッジ: `src/components/event-day-badge.tsx`（`daysUntilEventJST` を使用）
- ウォッチリスト操作はログイン時のみ（`watchlist-button`）

## API

- `GET /api/events`（クエリでフィルタ・ページング）

## テスト

- `src/app/(app)/events/__tests__/page.test.tsx`

## 破壊禁止

- 未ログインでも一覧が閲覧できること
- 公開条件を一覧と LP・詳細で一致させる
- 開催当日のイベントが終日表示されること（JST 当日 00:00 を基準にした `startOfTodayJST` で判定）
