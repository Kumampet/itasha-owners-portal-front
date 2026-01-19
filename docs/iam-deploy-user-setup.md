# Lambda関数デプロイ用IAMユーザー作成ガイド

## 概要

このガイドでは、ローカル環境からLambda関数をデプロイするためのIAMユーザーとポリシーを作成する手順を説明します。

## 前提条件

- AWSアカウントへの管理者アクセス権限があること
- AWS CLIがインストールされていること
- IAMコンソールへのアクセス権限があること

## 手順

### 1. IAMポリシーの作成

#### 方法1: AWS CLIを使用（推奨）

```bash
# STG環境用のポリシーを作成
aws iam create-policy \
  --policy-name GroupMessageReminderDeployPolicy \
  --policy-document file://infrastructure/iam-deploy-policy.json \
  --description "Policy for deploying Group Message Reminder Lambda function from local environment"

# 出力されたARNをメモしておく（例: arn:aws:iam::123456789012:policy/GroupMessageReminderDeployPolicy）
```

#### 方法2: AWSコンソールを使用

1. [IAMコンソール](https://console.aws.amazon.com/iam/)にアクセス
2. 左メニューから「**Policies**」を選択
3. 「**Create policy**」をクリック
4. 「**JSON**」タブを選択
5. `infrastructure/iam-deploy-policy.json`の内容をコピー＆ペースト
6. 「**Next**」をクリック
7. ポリシー名: `GroupMessageReminderDeployPolicy`
8. 説明: `Policy for deploying Group Message Reminder Lambda function from local environment`
9. 「**Create policy**」をクリック

### 2. IAMユーザーの作成

#### 方法1: AWS CLIを使用（推奨）

```bash
# STG環境用のユーザーを作成
aws iam create-user \
  --user-name group-message-reminder-deploy-user \
  --tags Key=Purpose,Value=LambdaDeploy Key=Environment,Value=Staging

# ポリシーをアタッチ（POLICY_ARNは上記で作成したポリシーのARNに置き換える）
aws iam attach-user-policy \
  --user-name group-message-reminder-deploy-user \
  --policy-arn arn:aws:iam::123456789012:policy/GroupMessageReminderDeployPolicy

# アクセスキーを作成
aws iam create-access-key \
  --user-name group-message-reminder-deploy-user

# 出力されたAccessKeyIdとSecretAccessKeyを安全に保存
```

#### 方法2: AWSコンソールを使用

1. [IAMコンソール](https://console.aws.amazon.com/iam/)にアクセス
2. 左メニューから「**Users**」を選択
3. 「**Create user**」をクリック
4. ユーザー名: `group-message-reminder-deploy-user`
5. 「**Next**」をクリック
6. 「**Attach policies directly**」を選択
7. `GroupMessageReminderDeployPolicy`を検索して選択
8. 「**Next**」をクリック
9. 「**Create user**」をクリック
10. 作成したユーザーを選択
11. 「**Security credentials**」タブを開く
12. 「**Create access key**」をクリック
13. 「**Command Line Interface (CLI)**」を選択
14. 「**Next**」をクリック
15. 「**Create access key**」をクリック
16. **Access Key ID**と**Secret Access Key**を安全に保存（Secret Access Keyは後で表示できません）

### 3. アクセスキーの設定

#### AWS CLIで設定

```bash
aws configure --profile group-message-reminder-deploy
```

以下の情報を入力：
- AWS Access Key ID: 上記で取得したAccess Key ID
- AWS Secret Access Key: 上記で取得したSecret Access Key
- Default region name: `ap-northeast-1`
- Default output format: `json`

#### 環境変数で設定

```bash
export AWS_ACCESS_KEY_ID=your-access-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-access-key
export AWS_REGION=ap-northeast-1
```

Windows PowerShellの場合：

```powershell
$env:AWS_ACCESS_KEY_ID = "your-access-key-id"
$env:AWS_SECRET_ACCESS_KEY = "your-secret-access-key"
$env:AWS_REGION = "ap-northeast-1"
```

### 4. 認証情報の確認

```bash
# プロファイルを使用する場合
aws sts get-caller-identity --profile group-message-reminder-deploy

# 環境変数を使用する場合
aws sts get-caller-identity
```

正しく設定されていれば、ユーザー名とアカウントIDが表示されます。

## 環境ごとのIAMユーザー作成

### STG環境用と本番環境用を分ける場合

本番環境とSTG環境で異なるIAMユーザーを作成することを推奨します。

#### STG環境用ユーザー

```bash
# STG環境用のユーザーを作成
aws iam create-user \
  --user-name group-message-reminder-deploy-user-staging \
  --tags Key=Purpose,Value=LambdaDeploy Key=Environment,Value=Staging

# ポリシーをアタッチ
aws iam attach-user-policy \
  --user-name group-message-reminder-deploy-user-staging \
  --policy-arn arn:aws:iam::123456789012:policy/GroupMessageReminderDeployPolicy

# アクセスキーを作成
aws iam create-access-key \
  --user-name group-message-reminder-deploy-user-staging
```

#### 本番環境用ユーザー

```bash
# 本番環境用のユーザーを作成
aws iam create-user \
  --user-name group-message-reminder-deploy-user-prod \
  --tags Key=Purpose,Value=LambdaDeploy Key=Environment,Value=Production

# ポリシーをアタッチ
aws iam attach-user-policy \
  --user-name group-message-reminder-deploy-user-prod \
  --policy-arn arn:aws:iam::123456789012:policy/GroupMessageReminderDeployPolicy

# アクセスキーを作成
aws iam create-access-key \
  --user-name group-message-reminder-deploy-user-prod
```

## IAMポリシーの権限詳細

作成されるIAMポリシーには以下の権限が含まれます：

### CloudFormation権限
- スタックの作成・更新・削除
- スタックの状態確認
- 変更セットの作成・実行

### Lambda権限
- Lambda関数の作成・更新・削除
- 関数設定の取得
- 関数への権限追加・削除

### EventBridge Scheduler権限
- スケジュールの作成・更新・削除
- スケジュールの取得・一覧表示

### IAM権限
- ロールの作成・更新・削除
- ロールポリシーの管理
- PassRole権限（EventBridge SchedulerがLambda関数を呼び出すために必要）

### S3権限
- SAM CLIが使用するS3バケットの作成・管理
- Lambda関数コードのアップロード

### CloudWatch Logs権限
- Lambda関数のロググループの作成・削除

### STS権限
- 認証情報の確認（`aws sts get-caller-identity`）

## セキュリティのベストプラクティス

1. **最小権限の原則**: 必要最小限の権限のみを付与
2. **アクセスキーのローテーション**: 定期的にアクセスキーをローテーション（推奨: 90日ごと）
3. **MFAの有効化**: 可能な場合はMFAを有効化
4. **環境の分離**: STG環境と本番環境で異なるIAMユーザーを使用
5. **アクセスキーの保護**: アクセスキーをGitにコミットしない、環境変数やAWS CLIの認証情報ファイルに保存

## トラブルシューティング

### アクセス拒否エラーが発生する場合

1. IAMポリシーが正しくアタッチされているか確認
2. アクセスキーが正しく設定されているか確認
3. リソース名がポリシーのリソースARNと一致しているか確認

### 権限不足エラーが発生する場合

1. 必要な権限がポリシーに含まれているか確認
2. リソースARNが正しいか確認（アカウントID、リージョンなど）
3. IAMポリシーの制限事項を確認

## 関連ドキュメント

- [AWS IAM ユーザーガイド](https://docs.aws.amazon.com/iam/)
- [AWS SAM CLI デプロイメントガイド](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-deploying.html)
- [Lambda関数デプロイメントガイド](./group-message-reminder-deployment.md)
