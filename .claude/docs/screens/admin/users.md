# 管理: ユーザー

- **URL**: `/admin/users`
- **認証**: `ADMIN` のみ（API 側で厳格に確認）

## 機能

- ユーザー一覧
- ロール変更、オーガナイザー切替
- BAN / 解除
- 表示名変更
- 論理削除・復元・完全削除

## UI

`user-action-menu` と各種モーダル（ban, role, delete, restore, permanent-delete, display-name）

## API

`/api/admin/users` 配下

## 破壊禁止

- `ORGANIZER` にユーザー管理を開放しない
- 完全削除の確認フローを省略しない
