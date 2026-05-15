# マイページ

- **URL**: `/app/mypage`（`/app` はここへリダイレクト）
- **実装**: `src/app/(app)/app/mypage/page.tsx`, `layout.tsx`, `my-page-menu-panel.tsx`
- **認証**: 必須

## 機能

- ユーザー情報サマリ
- リマインダー要約: `my-page-reminder-panel.tsx`
- 各機能へのメニューカード: `my-page-menu-card.tsx`。カード内アイコンは `@/components/icons`（`outline-24.tsx`）の共通 SVG を使用する
- オーガナイザー/管理者向けに `SITE_NAV_ORGANIZER_ITEM` 導線
- メール未設定時バナー: `email-required-banner`, `my-page-email-required-modal`

## テスト

- `mypage` 配下 `__tests__` があれば維持

## 破壊禁止

- 会員のホームとして `/app` → `/app/mypage` リダイレクトを維持
- 表示名モーダルは `(app)/layout` と連動（管理画面では出さない）
