# 管理: 掲載依頼

- **URL**: `/admin/submissions`
- **認証**: `ADMIN`

## 機能

`EventSubmission` の確認と処理。

- 一覧: ステータス（PENDING / PROCESSED / REJECTED）フィルタ、ソート、検索
- 詳細モーダル: イベント名・開催日・会場・URL・備考・提出者を表示
- アクション: 「イベント作成画面へ」（`/admin/events/new` へパラメータ付き遷移）/ 「却下」
- 開催日は日付のみ表示（時刻なし: `formatDate` を使用）

## API

- `GET /api/admin/submissions`
- `POST /api/admin/submissions/[id]/process`

## 関連画面

- 公開フォーム: [event-submission.md](../public/event-submission.md)
