This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

### WebSocket APIのデプロイ

WebSocket APIは、mainブランチへのマージ時に自動デプロイされます。

詳細は `README-DEPLOYMENT.md` を参照してください。

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

**設定手順：**
1. [AWS Amplifyコンソール](https://console.aws.amazon.com/amplify/)にアクセス
2. 対象のアプリを選択
3. 左メニューから「**App settings**」→「**Branch management**」を選択
4. 「**Add branch**」ボタンをクリック
5. ブランチ名に「`staging`」を入力
6. 「**Save**」をクリック
7. 作成された`staging`ブランチの行で「**Actions**」→「**Manage app**」をクリック
8. 左メニューから「**App settings**」→「**Environment variables**」を選択
9. `main`ブランチと同じ環境変数を設定（必要に応じてstaging用の値を設定）

**注意：**
- `staging`ブランチへのpushで自動的にstaging環境にデプロイされます
- 環境変数はブランチごとに個別に設定できます（staging用のデータベースURLなど）

### Amplifyでの環境変数設定

Amplifyコンソールで以下の環境変数を設定してください：

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`（ブランチごとに異なるURLを設定可能）
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `TWITTER_CLIENT_ID`
- `TWITTER_CLIENT_SECRET`
- `APP_AWS_REGION`
- `APP_AWS_ACCESS_KEY_ID`
- `APP_AWS_SECRET_ACCESS_KEY`

設定場所: Amplify Console → App settings → Environment variables

詳細は[認証設定ガイド](docs/authentication-setup.md#aws-amplifyでの環境変数設定)を参照してください。
