# Group Message Reminder Lambda Function

団体メッセージの未読リマインドメールを送信するLambda関数です。

## 機能

- 全ユーザーの未読メッセージをチェック
- 未読メッセージがあるユーザーにリマインドメールを送信
- AWS SESを使用してメール送信

## ビルド方法

```bash
# プロジェクトルートから実行
./lambda/group-message-reminder/build.sh
```

または手動で：

```bash
cd lambda/group-message-reminder

# Prismaクライアントを生成
npx prisma generate --schema=./schema.prisma

# 依存関係をインストール
npm install

# TypeScriptをビルド
npm run build

# Prismaクライアントをdistにコピー
cp -r node_modules/.prisma dist/
cp -r node_modules/@prisma dist/
```

## デプロイ方法

### STG環境へのデプロイ

#### Linux/Mac

```bash
npm run lambda:deploy:staging
```

#### Windows PowerShell

```powershell
npm run lambda:deploy:staging:win
```

### 本番環境へのデプロイ

#### Linux/Mac

```bash
npm run lambda:deploy:prod
```

#### Windows PowerShell

```powershell
npm run lambda:deploy:prod:win
```

**注意**: 本番環境へのデプロイ時は確認プロンプトが表示されます。

### 手動デプロイ

詳細は [デプロイメントガイド](../../docs/group-message-reminder-deployment.md) を参照してください。

## 環境変数

- `DATABASE_URL`: データベース接続文字列（必須）
- `DATABASE_POOL_SIZE`: データベース接続プールサイズ（デフォルト: 5）
- `AWS_REGION`: AWSリージョン（デフォルト: ap-northeast-1）
- `SES_FROM_EMAIL`: SES送信元メールアドレス（必須）

## EventBridge Scheduler

このLambda関数はEventBridge Schedulerから1日4回呼び出されます：

- 朝9時（JST = UTC 0時）
- 昼12時（JST = UTC 3時）
- 夕方18時（JST = UTC 9時）
- 夜21時（JST = UTC 12時）
