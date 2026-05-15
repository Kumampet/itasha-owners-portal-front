# お問い合わせ

- **URL**: `/app/contact`
- **実装**: `src/app/(app)/app/contact/page.tsx`, `layout.tsx`
- **認証**: 不要

## 機能

問い合わせフォーム送信。管理者は `/admin/contacts` で一覧・対応。

## API

- `POST /api/contact`
- 管理: `GET/PATCH /api/admin/contacts`, `contacts/[id]`

## 破壊禁止

- 公開フォームのまま維持（ログイン必須にしない）
- 個人情報フィールドの扱いを軽視しない
