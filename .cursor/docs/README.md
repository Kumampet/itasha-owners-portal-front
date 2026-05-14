# itasha-owners-portal-front ナレッジベース

本ディレクトリは、アプリケーションの現行仕様と実装の前提を整理した共通ドキュメントです。画面・機能・API・データを分離し、変更時は該当ファイルを先に更新してから実装してください。

## 読み方

1. 変更対象の画面・機能に対応するドキュメントを開く
2. [architecture/routing-and-access.md](./architecture/routing-and-access.md) で認証・公開範囲を確認する
3. API や DB を触る場合は [api/](./api/) と [architecture/data-models.md](./architecture/data-models.md) を併読する
4. 実装後、仕様が変わった箇所を同じ PR でドキュメントに反映する

## アーキテクチャ

| ドキュメント | 内容 |
| --- | --- |
| [architecture/overview.md](./architecture/overview.md) | 技術スタック・ディレクトリ構成・横断ルール |
| [architecture/auth-and-roles.md](./architecture/auth-and-roles.md) | NextAuth・ロール・セッション |
| [architecture/routing-and-access.md](./architecture/routing-and-access.md) | ミドルウェア・公開/保護パス |
| [architecture/data-models.md](./architecture/data-models.md) | Prisma モデルと関係 |

## 公開画面

| ドキュメント | パス |
| --- | --- |
| [screens/public/home.md](./screens/public/home.md) | `/` |
| [screens/public/about.md](./screens/public/about.md) | `/about` |
| [screens/public/legal.md](./screens/public/legal.md) | `/privacy`, `/term` |
| [screens/public/events-list.md](./screens/public/events-list.md) | `/events` |
| [screens/public/event-detail.md](./screens/public/event-detail.md) | `/events/[slug]` |
| [screens/public/event-submission.md](./screens/public/event-submission.md) | `/app/event-submission` |
| [screens/public/contact.md](./screens/public/contact.md) | `/app/contact` |

## 認証

| ドキュメント | パス |
| --- | --- |
| [screens/auth/sign-in.md](./screens/auth/sign-in.md) | `/app/auth` |

## 会員アプリ

| ドキュメント | パス |
| --- | --- |
| [screens/app/mypage.md](./screens/app/mypage.md) | `/app/mypage` |
| [screens/app/watchlist.md](./screens/app/watchlist.md) | `/app/watchlist` |
| [screens/app/reminders.md](./screens/app/reminders.md) | `/app/reminder/*` |
| [screens/app/groups.md](./screens/app/groups.md) | `/app/groups/*` |
| [screens/app/profile.md](./screens/app/profile.md) | `/app/profile/edit` |
| [screens/app/notification-settings.md](./screens/app/notification-settings.md) | `/app/notification-settings` |
| [screens/app/organizer-application.md](./screens/app/organizer-application.md) | `/app/organizer-application` |

## 管理画面

| ドキュメント | パス |
| --- | --- |
| [screens/admin/dashboard.md](./screens/admin/dashboard.md) | `/admin/dashboard` |
| [screens/admin/events.md](./screens/admin/events.md) | `/admin/events/*` |
| [screens/admin/users.md](./screens/admin/users.md) | `/admin/users` |
| [screens/admin/submissions.md](./screens/admin/submissions.md) | `/admin/submissions` |
| [screens/admin/contacts.md](./screens/admin/contacts.md) | `/admin/contacts` |
| [screens/admin/groups.md](./screens/admin/groups.md) | `/admin/groups` |
| [screens/admin/organizer-applications.md](./screens/admin/organizer-applications.md) | `/admin/organizer-applications` |

## 横断機能

| ドキュメント | 内容 |
| --- | --- |
| [features/watchlist.md](./features/watchlist.md) | ウォッチリスト |
| [features/push-notifications.md](./features/push-notifications.md) | Web Push・通知設定 |
| [features/event-images.md](./features/event-images.md) | イベント画像・S3 |
| [features/seo-sitemap.md](./features/seo-sitemap.md) | メタデータ・サイトマップ |
| [features/gdpr-geo.md](./features/gdpr-geo.md) | 地理ブロック |

## API

| ドキュメント | 内容 |
| --- | --- |
| [api/overview.md](./api/overview.md) | 共通規約・認可の考え方 |
| [api/events.md](./api/events.md) | イベント・掲載依頼・ウォッチリスト |
| [api/groups.md](./api/groups.md) | 団体・メッセージ |
| [api/reminders.md](./api/reminders.md) | リマインダー・スケジューラ |
| [api/user.md](./api/user.md) | ユーザー設定 |
| [api/admin.md](./api/admin.md) | 管理 API |

## Cursor 実装ガイド

エージェント向けの必読ルールは [.cursor/rules/](../rules/) を参照してください。
