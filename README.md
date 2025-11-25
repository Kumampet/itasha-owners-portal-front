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

1. `main`に変更をpush  
2. Amplifyが自動で `npm ci` → `npm run build` を実行  
3. ビルド成功後、AmplifyのホスティングURLへ即時反映

Amplifyコンソールの「Build details」から各デプロイ状況を確認できます。

### Amplifyでの環境変数設定

Amplifyコンソールで以下の環境変数を設定してください：

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `TWITTER_CLIENT_ID`
- `TWITTER_CLIENT_SECRET`

設定場所: Amplify Console → App settings → Environment variables

詳細は[認証設定ガイド](docs/authentication-setup.md#aws-amplifyでの環境変数設定)を参照してください。
