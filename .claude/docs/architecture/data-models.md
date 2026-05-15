# データモデル

スキーマ: `prisma/schema.prisma`（MySQL）

## User 系

- **User**: ロール、BAN、表示名、論理削除（`deleted_at`）、プロフィール公開設定
- **Account / Session / VerificationToken**: NextAuth
- **UserNotificationSettings**, **PushSubscription**: 通知チャネル設定

## イベント系

- **Event**: 名称、説明、開催日、複数日、住所、画像、承認状態（`approval_status`）、作成者、タグ、公式 URL、支払方法、定員・抽選方式
- **EventEntry**: エントリー枠（開始/締切/支払期限。公開用日時フィールドあり）
- **EventTag** / **Tag**: タグ
- **EventFollow**: ウォッチリスト
- **EventSubmission**: ユーザーからの掲載依頼
- **UserEvent**: ユーザーとイベントの関係（団体紐付け、ステータス）

## 団体系

- **Group**: イベントに紐づく団体。8 桁 `group_code`、リーダー、定員、説明、オーナーメモ
- **UserGroup**: メンバーシップ
- **GroupMessage**: 本文、お知らせフラグ
- **GroupMessageRead**, **GroupMessageReaction**: 既読・リアクション

制約: 同一 `event_id` 内で団体名はユニーク

## リマインダー

- **Reminder**: ユーザー別。JSON ペイロード、通知済みフラグ。EventBridge 連携

## お問い合わせ・申請

- **ContactSubmission**
- **OrganizerApplication**

## 承認状態（Event）

画面・API で使う文字列は実装と DB を一致させる。公開一覧は `approved-public-events.ts` の条件に従う。

## 破壊禁止

- 外部キー・ユニーク制約を UI だけで回避しない
- マイグレーションなしのカラム意味変更をしない（Prisma と API を同時に更新）
