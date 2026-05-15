# API: 管理

プレフィックス `/api/admin/*`。原則 `ADMIN`。イベント CRUD は `ORGANIZER` も可（自分のイベント）。

| ドメイン | パス例 |
| --- | --- |
| イベント | `events`, `events/[id]`, `approve`, `reject` |
| ユーザー | `users`, `users/[id]/role`, `ban`, `delete`, `restore`, `permanent-delete`, `display-name`, `organizer` |
| 掲載依頼 | `submissions`, `submissions/[id]/process` |
| 問い合わせ | `contacts`, `contacts/[id]` |
| 団体 | `groups`, `groups/[id]`, `leader`, `members`, `messages` |
| オーガナイザー申請 | `organizer-applications`, approve/reject |

UI 権限と API 権限を必ず一致させる。
