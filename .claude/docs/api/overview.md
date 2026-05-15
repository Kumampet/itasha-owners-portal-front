# API 共通

## 配置

`src/app/api/**/route.ts`（Next.js Route Handler）

## 認可

- セッション: `auth()` from `@/auth`
- 管理系: ロールをハンドラ先頭で検証（middleware だけに依存しない）
- 運用系（リマインダー check/notify）: API キー（`REMINDER_*_API_KEY`）

## エラー

- 既存ハンドラのステータスコード・JSON 形を踏襲する
- バリデーション失敗は 400、未認証 401、権限不足 403 が基本

## テスト

- `src/app/api/__tests__`（一部 skip）。変更時は可能ならモック方針を揃える

## 破壊禁止

- 公開 GET の認証要件を暗黙に追加しない
- CORS/地理ブロックと矛盾する例外を増やさない

## ドメイン別

- [events.md](./events.md)
- [groups.md](./groups.md)
- [reminders.md](./reminders.md)
- [user.md](./user.md)
- [admin.md](./admin.md)
