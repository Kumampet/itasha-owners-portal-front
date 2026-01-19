# Lambda関数デプロイ用IAMユーザー作成ガイド

## 概要

このガイドでは、ローカル環境からLambda関数をデプロイするためのIAMユーザーとポリシーを作成する手順を説明します。

## 前提条件

- AWSアカウントへの管理者アクセス権限があること
- AWS CLIがインストールされていること（[インストール手順](#aws-cliのインストール)を参照）
- IAMコンソールへのアクセス権限があること

## AWS CLIのインストール

### Windows環境

#### 方法1: MSIインストーラーを使用（推奨）

1. [AWS CLIのダウンロードページ](https://aws.amazon.com/cli/)にアクセス
2. 「**Download the AWS CLI MSI installer for Windows (64-bit)**」をクリック
3. ダウンロードした`.msi`ファイルを実行
4. インストールウィザードに従ってインストール
5. コマンドプロンプトまたはPowerShellを再起動
6. インストール確認：

```powershell
aws --version
```

#### 方法2: Chocolateyを使用

```powershell
# Chocolateyがインストールされている場合
choco install awscli

# インストール確認
aws --version
```

#### 方法3: PowerShellスクリプトを使用

```powershell
# PowerShellを管理者として実行
Invoke-WebRequest -Uri "https://awscli.amazonaws.com/AWSCLIV2.msi" -OutFile "$env:TEMP\AWSCLIV2.msi"
Start-Process msiexec.exe -ArgumentList "/i $env:TEMP\AWSCLIV2.msi /quiet" -Wait
```

### Mac環境

#### 方法1: Homebrewを使用（推奨）

```bash
brew install awscli

# インストール確認
aws --version
```

#### 方法2: インストーラーを使用

1. [AWS CLIのダウンロードページ](https://aws.amazon.com/cli/)にアクセス
2. 「**Download the AWS CLI PKG installer for macOS**」をクリック
3. ダウンロードした`.pkg`ファイルを実行
4. インストールウィザードに従ってインストール
5. インストール確認：

```bash
aws --version
```

### Linux環境

#### 方法1: パッケージマネージャーを使用

**Ubuntu/Debian**:
```bash
sudo apt-get update
sudo apt-get install awscli

# インストール確認
aws --version
```

**Amazon Linux/RHEL/CentOS**:
```bash
sudo yum install aws-cli

# または（新しいバージョン）
sudo dnf install awscli

# インストール確認
aws --version
```

**Fedora**:
```bash
sudo dnf install awscli

# インストール確認
aws --version
```

#### 方法2: バンドルインストーラーを使用

```bash
# インストーラーをダウンロード
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"

# 解凍
unzip awscliv2.zip

# インストール
sudo ./aws/install

# インストール確認
aws --version

# クリーンアップ
rm -rf aws awscliv2.zip
```

### インストール確認

インストールが完了したら、以下のコマンドで確認：

```bash
aws --version
```

期待される出力例：

```
aws-cli/2.x.x Python/3.x.x Windows/10 exe/AMD64
```

または

```
aws-cli/2.x.x Python/3.x.x Linux/x.x.x
```

### トラブルシューティング

#### AWS CLIが見つからないエラー

**Windows**:
- コマンドプロンプトまたはPowerShellを再起動
- 環境変数PATHに`C:\Program Files\Amazon\AWSCLIV2`が含まれているか確認

**Linux/Mac**:
- シェルを再起動（`source ~/.bashrc` または `source ~/.zshrc`）
- パスが正しく設定されているか確認：`which aws`

#### バージョンが古い場合

AWS CLI v2を使用することを推奨します。古いバージョンがインストールされている場合は、上記の手順でアップグレードしてください。

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

#### 方法1: AWS CLIで設定（推奨）

##### デフォルトプロファイルとして設定

```bash
aws configure
```

以下の情報を順番に入力します：

1. **AWS Access Key ID**: 上記で取得したAccess Key IDを入力
2. **AWS Secret Access Key**: 上記で取得したSecret Access Keyを入力
3. **Default region name**: `ap-northeast-1` を入力
4. **Default output format**: `json` を入力（Enterキーでデフォルトのjsonを選択）

##### 名前付きプロファイルとして設定

複数のAWSアカウントや環境を使い分ける場合は、名前付きプロファイルを使用します：

```bash
aws configure --profile group-message-reminder-deploy
```

同じ情報を入力します。使用する場合は、`--profile`オプションを追加：

```bash
aws sts get-caller-identity --profile group-message-reminder-deploy
```

##### 設定ファイルの確認

設定は以下のファイルに保存されます：

- **Linux/Mac**: `~/.aws/credentials` と `~/.aws/config`
- **Windows**: `C:\Users\ユーザー名\.aws\credentials` と `C:\Users\ユーザー名\.aws\config`

**credentialsファイルの例**:
```ini
[default]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

[group-message-reminder-deploy]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**configファイルの例**:
```ini
[default]
region = ap-northeast-1
output = json

[profile group-message-reminder-deploy]
region = ap-northeast-1
output = json
```

#### 方法2: 環境変数で設定

##### Linux/Mac (bash)

```bash
export AWS_ACCESS_KEY_ID=your-access-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-access-key
export AWS_REGION=ap-northeast-1
export AWS_DEFAULT_REGION=ap-northeast-1
```

##### Windows PowerShell

```powershell
$env:AWS_ACCESS_KEY_ID = "your-access-key-id"
$env:AWS_SECRET_ACCESS_KEY = "your-secret-access-key"
$env:AWS_REGION = "ap-northeast-1"
$env:AWS_DEFAULT_REGION = "ap-northeast-1"
```

##### Windows Command Prompt (cmd)

```cmd
set AWS_ACCESS_KEY_ID=your-access-key-id
set AWS_SECRET_ACCESS_KEY=your-secret-access-key
set AWS_REGION=ap-northeast-1
set AWS_DEFAULT_REGION=ap-northeast-1
```

**注意**: 環境変数は現在のセッションでのみ有効です。永続的に設定する場合は、システムの環境変数設定を使用するか、`.bashrc`や`.zshrc`に追加してください。

#### 方法3: 設定ファイルを直接編集

設定ファイルを直接編集することもできます：

**Linux/Mac**:
```bash
# credentialsファイルを編集
nano ~/.aws/credentials

# configファイルを編集
nano ~/.aws/config
```

**Windows**:
```powershell
# credentialsファイルを編集
notepad $env:USERPROFILE\.aws\credentials

# configファイルを編集
notepad $env:USERPROFILE\.aws\config
```

### 4. 認証情報の確認

#### デフォルトプロファイルを使用する場合

```bash
aws sts get-caller-identity
```

#### 名前付きプロファイルを使用する場合

```bash
aws sts get-caller-identity --profile group-message-reminder-deploy
```

#### 環境変数を使用する場合

環境変数を設定した後、同じコマンドを実行：

```bash
aws sts get-caller-identity
```

#### 期待される出力

正しく設定されていれば、以下のような出力が表示されます：

```json
{
    "UserId": "AIDAIOSFODNN7EXAMPLE",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/group-message-reminder-deploy-user"
}
```

#### エラーが発生する場合

以下のエラーが表示される場合は、認証情報が正しく設定されていません：

```
Unable to locate credentials
```

**対処法**:
1. `aws configure`を実行して認証情報を再設定
2. 環境変数が正しく設定されているか確認
3. 設定ファイルのパスと内容を確認

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
