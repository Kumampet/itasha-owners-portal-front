# アーキテクチャ概要

## プロダクト

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
| `src/lib` | サーバー/クライアント共通ロジック |
| `src/config` | ナビ・定数 |
| `src/content` | 静的コピー（例: サービス概要） |
| `prisma` | スキーマ・シード |
| `lambda` | 団体メッセージリマインダー等 |

## レイアウトと SEO

- `(app)/layout.tsx` が `/events`, `/app/*`, `/admin/*` などに共通ヘッダー・フッターを適用する
- `/app` 配下はクライアントで `noindex, nofollow` を付与する
- 公開イベント詳細は承認済みイベント向け OGP を生成する

## 横断実装ルール

- パスエイリアス `@/` を使う
- HTML 表示は `safe-html-content` / サニタイザ経由（`dompurify`）
- 日時は `dayjs` と `src/lib/date-utils.ts` / `calendar.ts` に寄せる
- 承認済み公開イベントの取得条件は `src/lib/approved-public-events.ts` を単一の真実とする
- スナックバーは `snackbar-context`、確認は `confirm-modal` / `modal-base`
- 変更後は `npm run check`（型・lint）と関連 `__tests__` を実行する

## 関連ドキュメント

- [auth-and-roles.md](./auth-and-roles.md)
- [routing-and-access.md](./routing-and-access.md)
- [data-models.md](./data-models.md)
