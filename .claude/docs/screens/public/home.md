# トップ（LP）

- **URL**: `/`
- **実装**: `src/app/page.tsx`
- **認証**: 不要

## 目的

未ログイン向けのランディング。サービス紹介と今後の承認済みイベントへの導線。

## データ

- 承認済みかつ将来開催のイベントを DB から取得（`approved-public-events` 系ロジックと整合）
- ホーム用イベントカラム: `src/components/home/home-top-event-columns.tsx`

## UI

- グローバルナビ（`site-nav`）から公開導線へ
- イベント一覧・詳細へ遷移

## 変更時

- 公開イベントの定義を変える場合はイベント一覧・詳細ドキュメントと `approved-public-events.ts` を同時に見直す
