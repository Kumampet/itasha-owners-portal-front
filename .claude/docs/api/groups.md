# API: 団体

| 領域 | パス例 |
| --- | --- |
| 一覧 | `GET /api/groups` |
| 作成 | `POST /api/groups/create` |
| 参加 | `POST /api/groups/join` |
| 未読 | `GET /api/groups/unread-count` |
| 詳細・解散 | `GET/DELETE /api/groups/[id]` |
| 説明・メモ | `PATCH .../description`, `.../owner-note` |
| メンバー | `DELETE .../members/[userId]`, `POST .../leave`, `POST .../transfer` |
| メッセージ | `GET/POST .../messages`, 既読・リアクション |

メッセージ本文はサニタイズ（`message-utils`, `server-html-sanitizer`）。

管理 API は [admin.md](./admin.md)。
