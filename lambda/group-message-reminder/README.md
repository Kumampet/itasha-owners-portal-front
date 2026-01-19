# Group Message Reminder Lambda Function

未読の団体メッセージがあるユーザーにリマインダーメールを送信するLambda関数です。

## テストイベント

AWS Lambdaコンソールでテスト実行する際に使用するテストイベントJSONです。

### テストイベントJSON

#### 1. シンプルな形式（推奨）

`test-event.json`は空のオブジェクトです。EventBridge Schedulerから呼び出される場合と同様の形式です。

```json
{}
```

このイベントを使用すると、Lambda関数は全ユーザーをチェックして、未読メッセージがあるユーザーにメールを送信します。

#### 2. EventBridge Scheduler形式

`test-event-eventbridge.json`は、EventBridge Schedulerから実際に呼び出される場合の形式を再現したテストイベントです。

```json
{
  "version": "0",
  "id": "test-event-id-12345",
  "detail-type": "Scheduled Event",
  "source": "aws.scheduler",
  "account": "059948105185",
  "time": "2026-01-19T20:00:00Z",
  "region": "ap-northeast-1",
  "resources": [
    "arn:aws:scheduler:ap-northeast-1:059948105185:schedule/default/staging-group-message-reminder-morning"
  ],
  "detail": {}
}
```

**注意:** handler.tsのコードでは、`event`パラメータの内容は使用されていません（ログ出力のみ）。どちらの形式でも動作は同じです。実際のメール送信には、データベースに以下の条件を満たすユーザーが必要です：

1. `deleted_at`がnull（削除されていない）
2. 団体に参加している（UserGroupテーブルにレコードがある）
3. その団体にメッセージがある（GroupMessageテーブルにレコードがある）
4. そのメッセージを未読（GroupMessageReadテーブルにレコードがない）

## AWS Lambdaコンソールでのテスト方法

1. AWS Lambdaコンソールにアクセス
2. `group-message-reminder-staging-GroupMessageReminderFunction-*` 関数を選択
3. 「テスト」タブをクリック
4. 「新しいテストイベントを作成」を選択
5. イベント名を入力（例: `test-email-send`）
6. 上記のJSONをコピー＆ペースト
7. 「作成」をクリック
8. 「テスト」ボタンをクリックして実行

## ローカルでのテスト

```bash
# Lambda関数をビルド
npm run lambda:build

# SAM CLIでローカル実行
sam local invoke GroupMessageReminderFunction \
  --event lambda/group-message-reminder/test-event.json \
  --env-vars lambda/group-message-reminder/env.json
```
