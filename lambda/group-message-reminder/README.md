# Group Message Reminder Lambda Function

未読の団体メッセージがあるユーザーにリマインダーメールを送信するLambda関数です。

## テストイベント

AWS Lambdaコンソールでテスト実行する際に使用するテストイベントJSONです。

### テストイベントJSON

`test-event.json`は空のオブジェクトです。EventBridge Schedulerから呼び出される場合と同様の形式です。

```json
{}
```

このイベントを使用すると、Lambda関数は全ユーザーをチェックして、未読メッセージがあるユーザーにメールを送信します。

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
