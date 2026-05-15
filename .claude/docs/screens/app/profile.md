# プロフィール編集

- **URL**: `/app/profile/edit`
- **実装**: `src/app/(app)/app/profile/edit/page.tsx`
- **認証**: 必須

## 機能

- 表示名の変更（`PATCH /api/user/display-name`）
- メールアドレスの登録・更新（`PATCH /api/user/email`）
- 表示名は団体チャット等で利用

## 関連

- 初回表示名: `(app)/layout` + `DisplayNameModal`
- 管理側表示名変更: `/admin/users` + admin API

## テスト

- `profile/edit/__tests__/page.test.tsx`
