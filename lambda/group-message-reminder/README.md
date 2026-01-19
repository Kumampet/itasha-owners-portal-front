# Group Message Reminder Lambda Function

未読の団体メッセージがあるユーザーにリマインダーメールを送信するLambda関数です。

## テストイベント

### テストモード用のテストイベント

AWS Lambdaコンソールでテスト実行する際に使用するテストイベントJSONです。

#### テストメール送信用

`test-event.json`を使用すると、指定したメールアドレスにテストメールを送信できます。

```json
{
  "testMode": true,
  "testEmail": "itashaownersnavi@gmail.com",
  "displayName": "いたなび！管理者",
  "groupName": "テスト団体"
}
```

**パラメータ説明:**
- `testMode`: `true`に設定するとテストモードが有効になります
- `testEmail`: テストメールを送信するメールアドレス
- `displayName`: メール本文に表示されるユーザー名（デフォルト: "ユーザー"）
- `groupName`: メール本文に表示される団体名（デフォルト: "テスト団体"）

#### 通常実行用（全ユーザーをチェック）

`test-event-empty.json`を使用すると、通常の実行モード（全ユーザーをチェックして未読メッセージがあるユーザーにメール送信）になります。

```json
{}
```

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
