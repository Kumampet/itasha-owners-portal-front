# イベント詳細

- **URL**: `/events/[slug]`（`slug` はイベント ID）
- **実装**: `src/app/(app)/events/[slug]/page.tsx` ほか
- **認証**: 不要（閲覧）

## 表示

- サムネイル、タグ、説明（サニタイズ HTML）、開催情報、公式 URL
- エントリー枠・日程表示は `EventEntry` と日時ユーティリティに従う
- OGP: `src/lib/metadata.ts`（承認済み公開向け）

## 操作

- ウォッチリスト: ログイン時 `event-detail-actions` / API `events/[id]/watchlist`
- 団体作成・参加への導線はログイン後 `/app/groups/*`

## 破壊禁止

- 未承認イベントを公開 URL で露出しない
- `slug` を数値連番前提にしない（UUID）
