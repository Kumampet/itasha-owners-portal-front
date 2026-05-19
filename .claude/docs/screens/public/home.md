# トップ（LP）

- **URL**: `/`
- **実装**: `src/app/page.tsx`
- **認証**: 不要

## 目的

未ログイン向けのランディング。サービス紹介と今後の承認済みイベントへの導線。

## キャッシュ

- `export const revalidate = 60`（60秒 ISR）でページをキャッシュし、最大1分ごとに DB から再取得する

## データ

- 承認済みかつ「まだ終了していない」イベントを DB から取得（`buildApprovedFutureEventWhere` で JST 当日開始を基準に判定）
- 開催当日のイベントも含む（`startOfTodayJST` を基準にすることで終日表示）
- ホーム用イベントカラム: `src/components/home/home-top-event-columns.tsx`（「本日開催」「あとN日」「開催中」バッジ付き、`event-day-badge.tsx` 使用）
- 会期中の複数日イベントも含む（`event_end_date >= startOfTodayJST` で終了日まで表示し続ける）

## UI

- グローバルナビ（`site-nav`）から公開導線へ
- イベント一覧・詳細へ遷移

## 変更時

- 公開イベントの定義を変える場合はイベント一覧・詳細ドキュメントと `approved-public-events.ts` を同時に見直す
