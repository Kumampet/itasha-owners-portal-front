# Group Message Reminder Lambda Function

## 概要

未読のグループメッセージがあるユーザーにリマインダーメールを送信するLambda関数です。

## テストイベント

AWS Lambdaコンソールでテストする際に使用できるテストイベントファイルです。

### EventBridge Scheduler形式のテストイベント

`test-event.json` - EventBridge Schedulerから送られてくる形式のイベント

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

### 空のJSONオブジェクト（SAMテンプレートのInput設定に合わせた形式）

`test-event-empty.json` - SAMテンプレートで`Input: '{}'`が設定されている場合の形式

```json
{}
```

## AWS Lambdaコンソールでのテスト方法

1. [AWS Lambdaコンソール](https://console.aws.amazon.com/lambda/)にアクセス
2. 関数 `staging-group-message-reminder` を選択
3. 「テスト」タブをクリック
4. 「新しいイベントを作成」をクリック
5. イベント名を入力（例: `test-eventbridge-scheduler`）
6. 上記のJSONのいずれかをコピー＆ペースト
7. 「保存」をクリック
8. 「テスト」ボタンをクリックして実行

## ローカルでのテスト方法

```bash
# SAM CLIを使用してローカルでテスト
sam local invoke GroupMessageReminderFunction \
  --event lambda/group-message-reminder/test-event.json \
  --env-vars lambda/group-message-reminder/env.json
```

## 環境変数

以下の環境変数が必要です：

- `DATABASE_URL`: データベース接続文字列
- `SES_FROM_EMAIL`: SES送信元メールアドレス
- `DATABASE_POOL_SIZE`: データベース接続プールサイズ（デフォルト: 5）

## 実行結果

成功時のレスポンス：

```json
{
  "statusCode": 200,
  "body": "{\"checked\":10,\"emailsSent\":5,\"emailsFailed\":0,\"timestamp\":\"2026-01-19T20:00:00.000Z\"}"
}
```

失敗時のレスポンス：

```json
{
  "statusCode": 500,
  "body": "{\"error\":\"Failed to check unread messages\",\"details\":\"...\"}"
}
```
