# Reminder Notify Lambda Function

EventBridge Schedulerから呼び出されるLambda関数。リマインダー通知を送信するHTTPエンドポイントを呼び出します。

## ローカル環境でのテスト

### 1. 依存関係のインストール

```bash
cd lambda/reminder-notify
npm install
```

### 2. 環境変数の設定

プロジェクトルートの `.env.local` ファイルに以下の環境変数を追加してください：

```env
# 通知APIのURL（ローカル環境の場合は http://localhost:3000 を使用）
# 未設定の場合は自動的に http://localhost:3000/api/reminders/notify が使用されます
NOTIFY_API_URL=http://localhost:3000/api/reminders/notify

# 認証キー（アプリケーション側の .env.local と同じ値を使用）
# 必須: この値がないと認証エラー（401）が発生します
REMINDER_NOTIFY_API_KEY=your-api-key-here
```

**重要**: 
- `REMINDER_NOTIFY_API_KEY` は、アプリケーション側（`.env.local`）と同じ値を使用してください
- `NOTIFY_API_URL` を設定しない場合、デフォルトで `http://localhost:3000/api/reminders/notify` が使用されます

### 3. ローカルサーバーの起動

別のターミナルで、アプリケーションのローカルサーバーを起動してください：

```bash
npm run dev
```

### 4. Lambda関数のテスト実行

**基本的なテスト（テスト用のリマインダーIDを使用）:**
```bash
npm run test
```

**実際のリマインダーIDを指定してテスト:**
```bash
npm run test <実際のリマインダーID>
```

例:
```bash
npm run test clx1234567890abcdef
```

**注意**: 
- テスト用のリマインダーID（`test-reminder-id-local`）を使用すると、404エラーが発生しますが、これは正常です
- 認証が成功している場合（401エラーが発生していない場合）、Lambda関数は正常に動作しています
- 実際のリマインダーIDを指定する場合は、データベースに存在するリマインダーIDを使用してください

## AWS Lambdaへのデプロイ

1. Lambda関数のコンソールで、コードエディタに `index.js` の内容を貼り付け
2. 環境変数を設定：
   - `NOTIFY_API_URL`: 本番環境のURL（例: `https://main.da1pjhpif1fug.amplifyapp.com/api/reminders/notify`）
   - `REMINDER_NOTIFY_API_KEY`: アプリケーション側と同じ値
3. 「Deploy」をクリック

