# itasha-owners-portal-front

## 必読ルール

### コミット
コミットメッセージは **日本語** で生成する。

### 実装前の手順
1. 対象の `.claude/docs/screens` または `features` / `api` を読む
2. `.claude/docs/architecture/routing-and-access.md` で認証・公開範囲を確認する
3. 既存コンポーネント・`src/lib` を再利用し、同パターンで変更する
4. 対象画面・機能の `__tests__` を新規作成または更新する
5. 関連 `__tests__` と `npm run check` を実行する

### テスト
- アプリ側の画面・機能を追加・変更したら、対象 `page.tsx` 直下の `__tests__/page.test.tsx` を同じ変更で新規作成または更新する。完了条件に含め、テスト未整備のまま完了とみなさない
- 既存の Jest + Testing Library パターン（`next/navigation`・`next-auth/react`・`fetch` のモック、`@/test-utils`）に合わせる
- サーバーコンポーネントは `prisma` 等をモックし、非同期 `page` は `await` してから `render` する
- 管理画面は依頼がない限り必須にしない
- 実装完了前に `npm run test:app`（管理画面を除く）または変更範囲に合わせた `npm test` を実行する

### 禁止事項
- 公開パス（`/events`, `/app/groups/[id]` 閲覧, 掲載依頼, 問い合わせ）をログイン必須にしない
- `ADMIN` 専用 API を `ORGANIZER` に開放しない（既存と異なる場合は仕様更新が先）
- 承認前イベントを公開一覧・サイトマップに出さない
- HTML をサニタイズせず描画しない
- 団体メッセージを非メンバーに見せない
- 地理ブロック（451）を API だけ回避させない
- 依頼外のリファクタ・無関係ファイルの編集をしない

### ロール・セッション
`auth.ts` と middleware の判定をずらさない。セッション項目変更は型定義と全利用箇所を同時更新。

### 仕様ドキュメントの更新
仕様が変わったらコードと同じ変更で `.claude/docs` を更新する。ドキュメント未更新の仕様変更は完了とみなさない。

ドキュメントとコードが食い違うときはコードを正とし、差分をドキュメントに反映するかユーザーに確認する。

---

## プロダクト概要

痛車オーナー向けポータル。イベント情報の閲覧、ウォッチリスト、リマインダー、イベント単位の団体チャット、主催者向け管理機能を提供する。

## 技術スタック

| 領域 | 採用 |
| --- | --- |
| フレームワーク | Next.js 16 App Router |
| UI | React 19, Tailwind CSS 4 |
| 認証 | NextAuth v5（Google / X） |
| DB | MySQL + Prisma 7 |
| 画像 | S3（ローカルはバンドルストレージ可） |
| 通知 | Web Push, SES, EventBridge（リマインダー） |
| PWA | next-pwa, Service Worker |

## 主要ディレクトリ

| パス | 役割 |
| --- | --- |
| `src/app` | ページ・Route Handler |
| `src/app/(app)` | 共通シェル付きルート（URL には出ない） |
| `src/components` | 共有 UI |
| `src/components/icons` | 公開ナビ・管理サイド等で共通利用する 24px アウトライン SVG |
| `src/lib` | サーバー/クライアント共通ロジック |
| `src/config` | ナビ・定数 |
| `src/content` | 静的コピー（例: サービス概要） |
| `prisma` | スキーマ・シード |
| `lambda` | 団体メッセージリマインダー等 |

## 横断実装ルール

- パスエイリアス `@/` を使う
- HTML 表示は `safe-html-content` / サニタイザ経由（`dompurify`）
- 日時は `dayjs` と `src/lib/date-utils.ts` / `calendar.ts` に寄せる（DB は UTC 保存、表示は JST。`fromDateLocal` / `fromDateTimeLocal` でユーザー入力を UTC 変換）
- 承認済み公開イベントの取得条件は `src/lib/approved-public-events.ts` を単一の真実とする
- スナックバーは `snackbar-context`、確認は `confirm-modal` / `modal-base`
- 変更後は `npm run check`（型・lint）と関連 `__tests__` を実行する

---

## ドキュメント一覧

詳細は `.claude/docs/` を参照。

### アーキテクチャ

| ドキュメント | 内容 |
| --- | --- |
| [architecture/overview.md](./docs/architecture/overview.md) | 技術スタック・ディレクトリ構成・横断ルール |
| [architecture/auth-and-roles.md](./docs/architecture/auth-and-roles.md) | NextAuth・ロール・セッション |
| [architecture/routing-and-access.md](./docs/architecture/routing-and-access.md) | ミドルウェア・公開/保護パス |
| [architecture/data-models.md](./docs/architecture/data-models.md) | Prisma モデルと関係 |

### 公開画面

| ドキュメント | パス |
| --- | --- |
| [screens/public/home.md](./docs/screens/public/home.md) | `/` |
| [screens/public/about.md](./docs/screens/public/about.md) | `/about` |
| [screens/public/legal.md](./docs/screens/public/legal.md) | `/privacy`, `/term` |
| [screens/public/events-list.md](./docs/screens/public/events-list.md) | `/events` |
| [screens/public/event-detail.md](./docs/screens/public/event-detail.md) | `/events/[slug]` |
| [screens/public/event-submission.md](./docs/screens/public/event-submission.md) | `/app/event-submission` |
| [screens/public/contact.md](./docs/screens/public/contact.md) | `/app/contact` |

### 認証

| ドキュメント | パス |
| --- | --- |
| [screens/auth/sign-in.md](./docs/screens/auth/sign-in.md) | `/app/auth` |

### 会員アプリ

| ドキュメント | パス |
| --- | --- |
| [screens/app/mypage.md](./docs/screens/app/mypage.md) | `/app/mypage` |
| [screens/app/watchlist.md](./docs/screens/app/watchlist.md) | `/app/watchlist` |
| [screens/app/reminders.md](./docs/screens/app/reminders.md) | `/app/reminder/*` |
| [screens/app/groups.md](./docs/screens/app/groups.md) | `/app/groups/*` |
| [screens/app/profile.md](./docs/screens/app/profile.md) | `/app/profile/edit` |
| [screens/app/notification-settings.md](./docs/screens/app/notification-settings.md) | `/app/notification-settings` |
| [screens/app/organizer-application.md](./docs/screens/app/organizer-application.md) | `/app/organizer-application` |

### 管理画面

| ドキュメント | パス |
| --- | --- |
| [screens/admin/dashboard.md](./docs/screens/admin/dashboard.md) | `/admin/dashboard` |
| [screens/admin/events.md](./docs/screens/admin/events.md) | `/admin/events/*` |
| [screens/admin/users.md](./docs/screens/admin/users.md) | `/admin/users` |
| [screens/admin/submissions.md](./docs/screens/admin/submissions.md) | `/admin/submissions` |
| [screens/admin/contacts.md](./docs/screens/admin/contacts.md) | `/admin/contacts` |
| [screens/admin/groups.md](./docs/screens/admin/groups.md) | `/admin/groups` |
| [screens/admin/organizer-applications.md](./docs/screens/admin/organizer-applications.md) | `/admin/organizer-applications` |

### 横断機能

| ドキュメント | 内容 |
| --- | --- |
| [features/watchlist.md](./docs/features/watchlist.md) | ウォッチリスト |
| [features/push-notifications.md](./docs/features/push-notifications.md) | Web Push・通知設定 |
| [features/event-images.md](./docs/features/event-images.md) | イベント画像・S3 |
| [features/seo-sitemap.md](./docs/features/seo-sitemap.md) | メタデータ・サイトマップ |
| [features/gdpr-geo.md](./docs/features/gdpr-geo.md) | 地理ブロック |

### API

| ドキュメント | 内容 |
| --- | --- |
| [api/overview.md](./docs/api/overview.md) | 共通規約・認可の考え方 |
| [api/events.md](./docs/api/events.md) | イベント・掲載依頼・ウォッチリスト |
| [api/groups.md](./docs/api/groups.md) | 団体・メッセージ |
| [api/reminders.md](./docs/api/reminders.md) | リマインダー・スケジューラ |
| [api/user.md](./docs/api/user.md) | ユーザー設定 |
| [api/admin.md](./docs/api/admin.md) | 管理 API |
