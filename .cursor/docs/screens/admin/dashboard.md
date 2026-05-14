# 管理ダッシュボード

- **URL**: `/admin`, `/admin/dashboard`
- **実装**: `admin/page.tsx`, `dashboard/page.tsx`, `admin-layout-client.tsx`
- **認証**: `ADMIN` または `ORGANIZER`

## 機能

各管理画面へのハブ（カードナビ）。`/admin` は権限チェック後ダッシュボードへ。

## レイアウト

管理専用クライアントレイアウト。公開サイトナビとは分離。

## 破壊禁止

- `USER` ロールの `/admin` アクセス（middleware + ページ双方）
