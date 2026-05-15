# オーガナイザー申請

- **URL**: `/app/organizer-application`
- **実装**: `src/app/(app)/app/organizer-application/page.tsx`, `layout.tsx`
- **認証**: 必須

## 機能

一般会員が主催者（`ORGANIZER`）権限を申請。管理者が `/admin/organizer-applications` で承認/却下。

## API

- `POST /api/organizer-applications`
- 管理: `GET /api/admin/organizer-applications`, approve/reject

## 破壊禁止

- 承認後のロール昇格フローを UI のみで変更しない（API と一致）
