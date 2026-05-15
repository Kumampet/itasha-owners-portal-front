# 団体

- **一覧**: `/app/groups` — `groups/page.tsx`
- **作成**: `/app/groups/new` — イベント選択後に作成
- **参加**: `/app/groups/join` — 8 桁コード
- **詳細**: `/app/groups/[id]` — 閲覧は未ログイン可、チャット等はログイン必須

## 認証

- 一覧・作成・参加: ログイン必須
- 詳細閲覧: 公開（middleware 例外）
- メッセージ・リアクション・既読: API でメンバー/ログイン検証

## 主要コンポーネント

- `groups/_components/`: `group-contents`, `group-message`, `member-list-card`, `join-group-button`, `owner-badge`
- 共有: `group-description-card`, `group-owner-note-card`, `message-bubble`, `message-reactions`, `transfer-ownership-modal`, `group-join-warning-modal`

## API（概要）

- 作成 `POST /api/groups/create`, 参加 `POST /api/groups/join`
- 詳細・解散 `GET/DELETE /api/groups/[id]`
- メッセージ `GET/POST .../messages`, 既読・リアクション各種
- リーダー譲渡 `POST .../transfer`, 退会 `POST .../leave`
- 未読数 `GET /api/groups/unread-count`

## 制約

- 団体はイベントに紐づく
- 同一イベント内で団体名ユニーク
- `group_code` は 8 桁ユニーク

## 管理

- `/admin/groups` — モデレーション（別ドキュメント）

## 破壊禁止

- 公開詳細 URL をログイン必須にしない
- メンバーでないユーザーへのメッセージ閲覧を許可しない
