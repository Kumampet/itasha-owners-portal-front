# SESメール送信の確認方法

`noreply-staging@itasha-owners-navi.link`から送信されたメールを確認する方法を説明します。

## 1. CloudWatch LogsでLambda関数のログを確認

Lambda関数の実行ログには、メール送信の成功/失敗が記録されます。

### AWSコンソールでの確認方法

1. AWSコンソールにログイン
2. CloudWatch → Log groups に移動
3. `/aws/lambda/staging-group-message-reminder` を選択
4. 最新のログストリームを確認

### AWS CLIでの確認方法

```bash
# 最新のログイベントを確認
aws logs tail /aws/lambda/staging-group-message-reminder \
  --profile Itanavi-Lambda-Deploy-local \
  --region ap-northeast-1 \
  --follow

# 特定の時間範囲のログを確認
aws logs filter-log-events \
  --log-group-name /aws/lambda/staging-group-message-reminder \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --profile Itanavi-Lambda-Deploy-local \
  --region ap-northeast-1 \
  --query 'events[*].message' \
  --output text
```

### ログに記録される情報

- メール送信成功: `[Group Message Reminder] Email sent successfully to {email}`
- メール送信失敗: `[Group Message Reminder] Failed to send email to {email}: {error}`
- 処理結果のサマリー: `[Group Message Reminder] Completed: checked {users} users, sent {emailsSent} emails, failed {emailsFailed}`

## 2. SESの送信統計を確認

### AWSコンソールでの確認方法

1. AWSコンソールにログイン
2. Amazon SES → Sending statistics に移動
3. 送信統計を確認：
   - **Sent**: 送信されたメール数
   - **Delivery**: 配信されたメール数
   - **Bounce**: バウンスしたメール数
   - **Complaint**: スパム報告されたメール数

### AWS CLIでの確認方法

```bash
# 送信統計を取得
aws ses get-send-statistics \
  --profile Itanavi-Lambda-Deploy-local \
  --region ap-northeast-1 \
  --output table
```

## 3. SESのメール送信履歴を確認

### CloudWatch Metricsでの確認

1. AWSコンソールにログイン
2. CloudWatch → Metrics → SES に移動
3. 以下のメトリクスを確認：
   - **Send**: 送信されたメール数
   - **Delivery**: 配信されたメール数
   - **Bounce**: バウンスしたメール数
   - **Complaint**: スパム報告されたメール数
   - **Reject**: 拒否されたメール数

## 4. Lambda関数のレスポンスを確認

Lambda関数は実行結果をレスポンスとして返します。EventBridge Schedulerの実行履歴で確認できます。

### AWSコンソールでの確認方法

1. AWSコンソールにログイン
2. EventBridge → Schedules に移動
3. `staging-group-message-reminder-morning`（または他のスケジュール）を選択
4. **Run history** タブで実行履歴を確認
5. 各実行の詳細を確認（レスポンスボディにメール送信結果が含まれます）

## 5. 実際の受信者のメールボックスを確認

テスト用のメールアドレスを登録して、実際にメールが届くか確認します。

### Lambda関数を手動実行する方法

```bash
# テストイベントでLambda関数を実行
aws lambda invoke \
  --function-name staging-group-message-reminder \
  --payload '{}' \
  --profile Itanavi-Lambda-Deploy-local \
  --region ap-northeast-1 \
  response.json

# レスポンスを確認
cat response.json | jq .
```

## トラブルシューティング

### メールが送信されない場合

1. **SESのサンドボックス環境**: SESがサンドボックス環境の場合、認証済みのメールアドレスにのみ送信できます
   - 確認方法: AWSコンソール → SES → Account dashboard で確認
   - 解決方法: SESのサンドボックス解除を申請するか、受信者のメールアドレスを認証済みアドレスに追加

2. **IAM権限**: Lambda関数にSESの送信権限があるか確認
   - 確認方法: Lambda関数のIAMロールを確認

3. **メールアドレスの形式**: 送信先のメールアドレスが正しい形式か確認
   - ログで確認: CloudWatch Logsでエラーメッセージを確認

### メールが届かない場合

1. **スパムフォルダを確認**: メールがスパムフォルダに振り分けられている可能性があります
2. **メールサーバーの設定**: メールサーバーがメールを拒否している可能性があります
3. **バウンスの確認**: SESのバウンス統計を確認
