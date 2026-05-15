# API: イベント

| メソッド | パス | 概要 |
| --- | --- | --- |
| GET | `/api/events` | 公開一覧（フィルタ・ページング） |
| GET | `/api/events/[id]` | 公開詳細 |
| GET/POST/DELETE | `/api/events/[id]/watchlist` | ウォッチリスト |
| GET | `/api/watchlist` | ログインユーザー一覧 |
| POST | `/api/event-submissions` | 掲載依頼 |

サイトマップ: `/api/events-sitemap.xml`

公開条件は `approved-public-events.ts` と一致させる。
