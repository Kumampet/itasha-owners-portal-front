# ルーティングとアクセス制御

実装: `src/middleware.ts`, `src/config/site-nav.ts`

## 地理ブロック

- EU/EEA/UK 等は HTTP 451（`src/lib/gdpr-geo.ts`）
- ローカルや `DISABLE_EU_GEOBLOCK` でスキップ可
- API も matcher 対象

## 認証不要（ミドルウェアで auth を呼ばない/保護対象外）

| パス | 備考 |
| --- | --- |
| `/` | LP |
| `/events`, `/events/*` | 一覧・詳細 |
| `/about`, `/privacy`, `/term` | 静的 |
| `/app/event-submission` | 掲載依頼 |
| `/app/contact` | お問い合わせ |
| `/app/groups/[id]` | 団体詳細の閲覧（メッセージ等は API 側でログイン必須） |
| `/app/auth` | ログイン |

## ログイン必須（原則）

- `/app/mypage`, `/app/reminder`, `/app/groups`（一覧・作成・参加）, `/app/watchlist`, `/app/profile/*`, `/app/notification-settings`, `/app/organizer-application`
- 上記以外の `/app/*` もダッシュボード扱いで保護（公開例外を除く）

## リダイレクト

- `/app` → `/app/mypage`
- `/admin` → 未ログインは `/app/auth?callbackUrl=/admin/dashboard`、権限ありは `/admin/dashboard`、権限なしは `/app/mypage`
- ログイン済みが `/app/auth` → `callbackUrl` または `/app/mypage`

## 管理画面

- パス: `/admin/*`
- ミドルウェア: `ADMIN` または `ORGANIZER` のみ
- 個別 API/画面で `ADMIN` 限定の操作を分ける（ユーザー管理、承認、問い合わせ等）

## セッション取得の注意

- Edge の middleware では JWT 戦略時に `auth()` が null になり得る
- セッション Cookie がある場合はクライアント `useSession` に委譲
- 無効 Cookie は try/catch で無視し null 扱い

## グローバルナビ

`SITE_NAV_ITEMS`: イベント一覧、サービス概要、掲載依頼、お問い合わせ（公開導線のみ）

オーガナイザー向け: `SITE_NAV_ORGANIZER_ITEM`（マイページから `/admin/dashboard`）

## 破壊禁止

- 公開パスを保護パスに含めない（特に `/events` と `/app/groups/[id]`）
- `callbackUrl` は同一オリジンのみ許可（既存 middleware の挙動を維持）
