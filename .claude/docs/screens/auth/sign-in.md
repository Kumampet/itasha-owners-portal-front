# ログイン

- **URL**: `/app/auth`
- **実装**: `src/app/app/auth/page.tsx`
- **認証**: ログイン画面自体は未ログイン向け

## 機能

- Google / X でサインイン
- `callbackUrl` クエリでログイン後遷移（同一オリジンのみ）
- ログイン済みアクセスは middleware がマイページ等へリダイレクト

## 関連

- `src/auth.ts`, `api/auth/[...nextauth]`

## 破壊禁止

- OAuth コールバック URL と環境変数（`NEXTAUTH_URL` 等）の整合
- BAN ユーザーの扱い（auth コールバック側）
