#!/bin/bash
set -e

echo "Building Group Message Reminder Lambda function..."

# プロジェクトルートに移動
cd "$(dirname "$0")/../.."

# Prismaクライアントを生成
echo "Generating Prisma Client..."
npx prisma generate --schema=./lambda/group-message-reminder/schema.prisma

# Lambda関数ディレクトリに移動
cd lambda/group-message-reminder

# 依存関係をインストール
echo "Installing dependencies..."
npm install

# TypeScriptをビルド
echo "Building TypeScript..."
npm run build

# Prismaクライアントをdistにコピー
echo "Copying Prisma Client..."
cp -r node_modules/.prisma dist/ 2>/dev/null || true
cp -r node_modules/@prisma dist/ 2>/dev/null || true

echo "Build completed!"
