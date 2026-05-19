# トップ（LP）

- **URL**: `/`
- **実装**: `src/app/page.tsx`
- **認証**: 不要

## 目的

未ログイン向けのランディング。サービス紹介と今後の承認済みイベントへの導線。

## データ

- 承認済みかつ「まだ終了していない」イベントを DB から取得（`buildApprovedFutureEventWhere` で JST 当日開始を基準に判定）
- 開催当日のイベントも含む（`startOfTodayJST` を基準にすることで終日表示）
- ホーム用イベントカラム: `src/components/home/home-top-event-columns.tsx`（「本日開催」「あとN日」バッジ付き、`event-day-badge.tsx` 使用）

## UI

- グローバルナビ（`site-nav`）から公開導線へ
- イベント一覧・詳細へ遷移

## 変更時

- 公開イベントの定義を変える場合はイベント一覧・詳細ドキュメントと `approved-public-events.ts` を同時に見直す
