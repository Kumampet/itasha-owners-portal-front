This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 開発環境の前提条件（Node.js / npm）

依存関係のインストールや開発サーバーは **Node.js** と **npm**（Node に同梱）で行います。このリポジトリは **Next.js 16** 向けのため、**Node.js 20 以上の LTS** の利用を推奨します（[Next.js の要件](https://nextjs.org/docs/app/getting-started/installation)に沿ってください）。

### インストール済みかの確認

ターミナル（macOS）または PowerShell / コマンドプロンプト（Windows）で次を実行し、バージョンが表示されれば準備できています。

```bash
node -v
npm -v
```

`node` は動くが `command not found: npm` になる場合は、Node のインストールが不完全か、**npm が入っているディレクトリが PATH に含まれていません**。下記のいずれかの方法で入れ直すか、シェル／環境変数の設定を見直してください。

### macOS でのセットアップ

#### 公式インストーラー（手軽）

1. [Node.js ダウンロードページ](https://nodejs.org/)から **LTS** の macOS 用インストーラー（`.pkg`）を取得する  
2. ウィザードに従いインストールする  
3. **新しいターミナル**を開き、`node -v` と `npm -v` で確認する  

#### Homebrew

Homebrew が使える場合は次で Node.js（npm 同梱）を入れられます。

```bash
brew install node
```

インストール後に `node -v` / `npm -v` で確認します。

複数ユーザーで Homebrew を共有しており、`Cellar is not writable` や権限エラーが出る場合は、管理者に所有者の修正を依頼するか、後述の **nvm** のようにホームディレクトリ配下にツールチェーンを置く方法を選んでください。

#### nvm（バージョン切り替え・管理者権限が不要になりやすい）

1. [nvm のインストール手順](https://github.com/nvm-sh/nvm#installing-and-updating)に従いセットアップする（`~/.zshrc` などに `NVM_DIR` の読み込みが追記されます）  
2. ターミナルを開き直すか `source ~/.zshrc` を実行する  
3. 例として LTS を入れる場合:

```bash
nvm install --lts
nvm use --lts
```

このリポジトリで `npm install` が成功すれば問題ありません。

### Windows でのセットアップ

#### 公式インストーラー（手軽）

1. [Node.js ダウンロードページ](https://nodejs.org/)から **LTS** の Windows 用インストーラー（`.msi`）を取得する  
2. ウィザードに従いインストールする（**PATH に追加**のオプションが有効であることを確認する）  
3. **新しい** PowerShell またはコマンドプロンプトを開き、`node -v` と `npm -v` で確認する  

#### winget

```powershell
winget install OpenJS.NodeJS.LTS
```

インストール後はターミナルを開き直し、バージョンを確認します。

#### nvm-windows（複数バージョンの切り替え）

1. [nvm-windows の Releases](https://github.com/coreybutler/nvm-windows/releases) から **nvm-setup** を入手しインストールする  
2. 管理者権限の PowerShell などで、例:

```powershell
nvm install lts
nvm use <インストールされたバージョン>
```

---

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, set up Git hooks (husky):

```bash
npx husky install
```

Finally, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## 認証設定

このアプリケーションはGoogleアカウントとX（Twitter）アカウントでのログインをサポートしています。

詳細な設定手順については、[認証設定ガイド](docs/authentication-setup.md)を参照してください。

## Deploy on AWS Amplify

このリポジトリはAmplify Hostingに接続済みで、`main`ブランチへのpushをトリガーにCI/CDが走る構成です。

1. `main`に変更をpush  
2. Amplifyが自動で `npm ci` → `npm run build` を実行  
3. ビルド成功後、AmplifyのホスティングURLへ即時反映

Amplifyコンソールの「Build details」から各デプロイ状況を確認できます。

### ブランチ管理

#### 本番環境（mainブランチ）
- `main`ブランチへのpushで自動デプロイされます
- 本番環境のURLに反映されます

#### ステージング環境（stagingブランチ）
- `staging`ブランチをAmplifyのstaging環境として接続するには、AWS Amplifyコンソールでの設定が必要です
- **重要**: staging環境は本番環境とは完全に分離された独立した環境です。本番データベースや本番のAWSリソースとは連動しません。

**設定手順：**
1. [AWS Amplifyコンソール](https://console.aws.amazon.com/amplify/)にアクセス
2. 対象のアプリを選択
3. 左メニューから「**App settings**」→「**Branch management**」を選択
4. 「**Add branch**」ボタンをクリック
5. ブランチ名に「`staging`」を入力
6. 「**Save**」をクリック
7. 作成された`staging`ブランチの行で「**Actions**」→「**Manage app**」をクリック
8. 左メニューから「**App settings**」→「**Environment variables**」を選択
9. staging環境用の環境変数を設定（本番環境とは異なる値を設定）

**注意：**
- `staging`ブランチへのpushで自動的にstaging環境にデプロイされます
- 環境変数はブランチごとに個別に設定できます
- staging環境用のデータベース、OAuth設定、AWSリソースを別途作成する必要があります

**詳細な設定手順：**
staging環境の構築については、[Staging環境構築ガイド](docs/staging-environment-setup.md)を参照してください。

### Amplifyでの環境変数設定

Amplifyコンソールで以下の環境変数を設定してください：

#### データベース関連
- `DATABASE_URL` - RDSデータベースへの接続文字列
- `DATABASE_POOL_SIZE` - データベース接続プールサイズ（オプション、デフォルト: 10）
- `DATABASE_DEBUG` - データベースデバッグモード（オプション、デフォルト: false）

#### 認証関連
- `NEXTAUTH_SECRET` - NextAuth.js用シークレットキー
- `NEXTAUTH_URL` - ブランチごとに異なるURLを設定（例: `https://your-app.amplifyapp.com`）
- `GOOGLE_CLIENT_ID` - Google OAuth クライアントID
- `GOOGLE_CLIENT_SECRET` - Google OAuth クライアントシークレット
- `TWITTER_CLIENT_ID` - X (Twitter) OAuth クライアントID
- `TWITTER_CLIENT_SECRET` - X (Twitter) OAuth クライアントシークレット

#### AWSリソース関連
- `APP_AWS_REGION` - AWSリージョン（例: `ap-northeast-1`）
- `APP_AWS_ACCESS_KEY_ID` - AWSアクセスキーID（将来のAWSサービス利用に備えて設定）
- `APP_AWS_SECRET_ACCESS_KEY` - AWSシークレットアクセスキー（将来のAWSサービス利用に備えて設定）

#### その他
- `NEXT_PUBLIC_ENVIRONMENT` - 環境識別子（オプション、例: `production`, `staging`）

**設定場所**: Amplify Console → App settings → Environment variables

**重要**: 
- 本番環境とstaging環境で異なる値を設定する必要があります
- 環境変数の詳細については、[環境変数リファレンス](docs/environment-variables-reference.md)を参照してください

詳細は[認証設定ガイド](docs/authentication-setup.md#aws-amplifyでの環境変数設定)を参照してください。
