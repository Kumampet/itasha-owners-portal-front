# 団体メッセージ未読リマインド機能 デプロイメントガイド

## 概要

このガイドでは、AWS EventBridge SchedulerとLambda関数を使用して団体メッセージの未読リマインドメールを送信する機能のデプロイ方法を説明します。

**重要**: 本番環境（prod）とステージング環境（staging）は完全に分離されており、それぞれ独立したLambda関数とEventBridge Schedulerを持ちます。

## アーキテクチャ

- **EventBridge Scheduler**: 1日4回（朝9時、昼12時、夕方18時、夜21時）Lambda関数を呼び出す
- **Lambda関数**: 未読メッセージがあるユーザーをチェックし、AWS SESでメール送信
- **環境分離**: 本番環境とステージング環境で独立したリソースを管理

## 前提条件

- AWS CLIがインストールされていること（[IAMユーザー作成ガイド](./iam-deploy-user-setup.md#aws-cliのインストール)を参照）
- AWS SAM CLIがインストールされていること（[インストールガイド](./sam-cli-installation.md)を参照）
- AWS認証情報が設定されていること（`aws configure`、[IAMユーザー作成ガイド](./iam-deploy-user-setup.md#3-アクセスキーの設定)を参照）
- Node.jsとnpmがインストールされていること
- Prisma CLIがインストールされていること（`npm install -g prisma`）

## 環境変数の設定

### STG環境用の環境変数

STG環境にデプロイする前に、以下の環境変数を設定してください：

```bash
export AWS_REGION=ap-northeast-1
export DATABASE_URL="mysql://admin:dass0707@itasha-staging-mysql-db.cbi8k2qwwj02.ap-northeast-1.rds.amazonaws.com:3306/itashadb"
export SES_FROM_EMAIL="noreply-staging@itasha-owners-navi.link"
```

Windows PowerShellの場合：

```powershell
$env:AWS_REGION = "ap-northeast-1"
$env:DATABASE_URL = "mysql://admin:dass0707@itasha-staging-mysql-db.cbi8k2qwwj02.ap-northeast-1.rds.amazonaws.com:3306/itashadb"
$env:SES_FROM_EMAIL = "noreply-staging@itasha-owners-navi.link"
```

### 本番環境用の環境変数

本番環境にデプロイする前に、以下の環境変数を設定してください：

```bash
export AWS_REGION=ap-northeast-1
export DATABASE_URL="mysql://admin:dass0707@itasha-portal-mysql-db.cbi8k2qwwj02.ap-northeast-1.rds.amazonaws.com:3306/itashadb"
export SES_FROM_EMAIL="noreply@itasha-owners-navi.link"
```

Windows PowerShellの場合：

```powershell
$env:AWS_REGION = "ap-northeast-1"
$env:DATABASE_URL = "mysql://admin:dass0707@itasha-portal-mysql-db.cbi8k2qwwj02.ap-northeast-1.rds.amazonaws.com:3306/itashadb"
$env:SES_FROM_EMAIL = "noreply@itasha-owners-navi.link"
```

## デプロイ手順

### 1. Lambda関数のビルド

```bash
npm run lambda:build
```

または手動で：

```bash
cd lambda/group-message-reminder
bash build.sh
```

### 2. STG環境へのデプロイ

#### Linux/Mac

```bash
npm run lambda:deploy:staging
```

または手動で：

```bash
bash scripts/deploy-group-message-reminder-staging.sh
```

#### Windows PowerShell

```powershell
npm run lambda:deploy:staging:win
```

または手動で：

```powershell
.\scripts\deploy-group-message-reminder-staging.ps1
```

### 3. 本番環境へのデプロイ

**警告**: 本番環境へのデプロイは慎重に行ってください。

#### Linux/Mac

```bash
npm run lambda:deploy:prod
```

または手動で：

```bash
bash scripts/deploy-group-message-reminder-prod.sh
```

#### Windows PowerShell

```powershell
npm run lambda:deploy:prod:win
```

または手動で：

```powershell
.\scripts\deploy-group-message-reminder-prod.ps1
```

**注意**: 本番環境へのデプロイ時は確認プロンプトが表示されます。

### 4. デプロイ後の確認

デプロイが完了すると、以下の情報が表示されます：

- Lambda関数のARN
- EventBridge SchedulerのARN（4つ）

CloudWatch LogsでLambda関数の実行ログを確認できます：

```bash
aws logs tail /aws/lambda/dev-group-message-reminder --follow --region ap-northeast-1
```

## EventBridge Schedulerのスケジュール

各環境で以下の4つのスケジュールが作成されます：

### STG環境

1. **朝9時（JST）**: `staging-group-message-reminder-morning` (UTC 0時)
2. **昼12時（JST）**: `staging-group-message-reminder-noon` (UTC 3時)
3. **夕方18時（JST）**: `staging-group-message-reminder-evening` (UTC 9時)
4. **夜21時（JST）**: `staging-group-message-reminder-night` (UTC 12時)

### 本番環境

1. **朝9時（JST）**: `prod-group-message-reminder-morning` (UTC 0時)
2. **昼12時（JST）**: `prod-group-message-reminder-noon` (UTC 3時)
3. **夕方18時（JST）**: `prod-group-message-reminder-evening` (UTC 9時)
4. **夜21時（JST）**: `prod-group-message-reminder-night` (UTC 12時)

## AWS SESの設定

### 1. STG環境用SESの設定

STG環境用のSESで送信元メールアドレスまたはドメインを検証する必要があります。

1. [AWS SESコンソール](https://console.aws.amazon.com/ses/)にアクセス
2. STG環境用のAWSアカウントまたはリージョンを選択
3. 「Verified identities」→「Create identity」をクリック
4. 「Email address」を選択し、STG環境用のメールアドレス（例: `noreply-staging@itasha-owners-navi.link`）を入力
5. 「Create identity」をクリック
6. 送信された確認メールのリンクをクリックして検証を完了

### 2. 本番環境用SESの設定

本番環境用のSESで送信元メールアドレスまたはドメインを検証する必要があります。

1. [AWS SESコンソール](https://console.aws.amazon.com/ses/)にアクセス
2. 本番環境用のAWSアカウントまたはリージョンを選択
3. 「Verified identities」→「Create identity」をクリック
4. 「Email address」を選択し、本番環境用のメールアドレス（例: `noreply@itasha-owners-navi.link`）を入力
5. 「Create identity」をクリック
6. 送信された確認メールのリンクをクリックして検証を完了

### 3. サンドボックス環境の場合

サンドボックス環境では、検証済みのメールアドレスにのみ送信できます。本番環境で使用する場合は、サンドボックス解除のリクエストが必要です。

**重要**: STG環境と本番環境で異なるSES設定を使用することを推奨します。

## トラブルシューティング

### Lambda関数がタイムアウトする

- タイムアウト時間を増やす（SAMテンプレートの`Timeout`を変更）
- メモリサイズを増やす（`MemorySize`を変更）

### データベース接続エラー

- RDSのセキュリティグループでLambda関数からの接続を許可する
- VPC設定が必要な場合は、SAMテンプレートの`VpcConfig`を設定する

### SES送信エラー

- SESでメールアドレスまたはドメインが検証されているか確認
- IAMロールにSES送信権限があるか確認

### EventBridge Schedulerが実行されない

- EventBridge Schedulerの状態が`ENABLED`になっているか確認
- IAMロールにLambda関数を呼び出す権限があるか確認

## ローカル環境からSTG環境を参照する設定

ローカル開発環境からSTG環境のLambda関数を参照する場合は、以下の環境変数を設定してください：

### .env.local ファイルの作成

プロジェクトルートに `.env.local` ファイルを作成し、以下の内容を設定：

```env
# STG環境のデータベース接続文字列（ローカル開発時はSTG環境を参照）
DATABASE_URL=mysql://admin:dass0707@itasha-staging-mysql-db.cbi8k2qwwj02.ap-northeast-1.rds.amazonaws.com:3306/itashadb

# STG環境のSES送信元メールアドレス
SES_FROM_EMAIL=noreply-staging@itasha-owners-navi.link

# AWS認証情報（STG環境用）
AWS_REGION=ap-northeast-1
APP_AWS_ACCESS_KEY_ID=your-staging-access-key-id
APP_AWS_SECRET_ACCESS_KEY=your-staging-secret-access-key

# Lambda関数のARN（STG環境、ローカル開発時の参照用）
# デプロイ後にCloudFormationの出力から取得して設定
GROUP_MESSAGE_REMINDER_LAMBDA_ARN=arn:aws:lambda:ap-northeast-1:123456789012:function:staging-group-message-reminder
```

**注意**: `.env.local` ファイルは `.gitignore` に含まれているため、Gitにコミットされません。

## スタックの削除

### STG環境のスタックを削除

```bash
aws cloudformation delete-stack \
  --stack-name group-message-reminder-staging \
  --region ap-northeast-1
```

### 本番環境のスタックを削除

**警告**: 本番環境のスタックを削除する場合は、十分に注意してください。

```bash
aws cloudformation delete-stack \
  --stack-name group-message-reminder-prod \
  --region ap-northeast-1
```

## CI/CDでのデプロイ

GitHub ActionsなどのCI/CDパイプラインで自動デプロイする場合は、以下のようなワークフローを作成します：

### STG環境への自動デプロイ

```yaml
name: Deploy Group Message Reminder (STG)

on:
  push:
    branches:
      - staging

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Build Lambda function
        run: npm run lambda:build
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_STAGING }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_STAGING }}
          aws-region: ap-northeast-1
      - name: Deploy to STG
        run: |
          sam build --template-file infrastructure/group-message-reminder.yaml
          sam deploy \
            --stack-name group-message-reminder-staging \
            --capabilities CAPABILITY_IAM \
            --parameter-overrides \
              Environment=staging \
              DatabaseUrl=${{ secrets.DATABASE_URL_STAGING }} \
              SesFromEmail=${{ secrets.SES_FROM_EMAIL_STAGING }} \
            --no-confirm-changeset \
            --no-fail-on-empty-changeset
```

### 本番環境への自動デプロイ

```yaml
name: Deploy Group Message Reminder (PROD)

on:
  push:
    branches:
      - main
  workflow_dispatch:  # 手動実行も可能にする

jobs:
  deploy-prod:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Build Lambda function
        run: npm run lambda:build
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_PROD }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_PROD }}
          aws-region: ap-northeast-1
      - name: Deploy to PROD
        run: |
          sam build --template-file infrastructure/group-message-reminder.yaml
          sam deploy \
            --stack-name group-message-reminder-prod \
            --capabilities CAPABILITY_IAM \
            --parameter-overrides \
              Environment=prod \
              DatabaseUrl=${{ secrets.DATABASE_URL_PROD }} \
              SesFromEmail=${{ secrets.SES_FROM_EMAIL_PROD }}
```

**重要**: 
- STG環境と本番環境で異なるAWS認証情報を使用してください
- 本番環境へのデプロイは手動承認を推奨します（`workflow_dispatch`を使用）
