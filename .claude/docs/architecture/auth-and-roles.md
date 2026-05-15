# 認証とロール

## 認証方式

- 実装: `src/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`
- プロバイダ: Google, X（Twitter）
- `DATABASE_URL` あり: Prisma Adapter + DB セッション
- `DATABASE_URL` なし: JWT（開発用。本番は DB 必須想定）

## セッションに載る主な情報

- `user.id`, `email`, `name`, `image`
- `role`: `USER` | `ADMIN` | `ORGANIZER`
- `displayName`, `isBanned`

型拡張: `src/types/next-auth.d.ts`

## 既存ユーザー保護

Adapter カスタムで次を守る。

- 同一メールの再 OAuth で新規 User を増やさない
- 既存ユーザーの `role` を OAuth 更新で上書きしない（`USER` 以外は保持）

## ロールの意味

| ロール | 用途 |
| --- | --- |
| `USER` | 一般会員機能 |
| `ORGANIZER` | `/admin` 入場可。自分が作成したイベントの編集・一部運用 |
| `ADMIN` | 全管理機能（ユーザー BAN、掲載依頼処理、団体モデレーション等） |

## BAN

- `is_banned` のユーザーは API/画面で操作を拒否する（各 Route Handler で確認）
- 管理画面から BAN/解除

## クライアント

- `src/app/providers.tsx`: `SessionProvider`（5 分 refetch）、Service Worker、PWA バナー
- 表示名未設定: `(app)/layout.tsx` が `DisplayNameModal` を出す（`display_name_later` Cookie で延期可）
- 管理画面では表示名モーダルを出さない

## 破壊禁止

- ミドルウェアと API のロール判定をずらさない（`ADMIN` のみの API に `ORGANIZER` を通さない等、既存実装に合わせる）
- セッション項目名を変える場合は `auth.ts` と全消費箇所を同時更新する
