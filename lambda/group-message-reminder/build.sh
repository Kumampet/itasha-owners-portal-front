#!/bin/bash
set -e

echo "Building Group Message Reminder Lambda function..."

# Lambda関数ディレクトリに移動
cd "$(dirname "$0")"

# 依存関係をインストール（prismaパッケージを含む）
echo "Installing dependencies..."
npm install

# Prismaクライアントを生成（Lambda関数ディレクトリで実行）
echo "Generating Prisma Client..."
# prisma.config.tsを一時的にリネームして無視
if [ -f "../../prisma.config.ts" ]; then
  mv ../../prisma.config.ts ../../prisma.config.ts.bak 2>/dev/null || true
fi
npx prisma generate --schema=./schema.prisma
# prisma.config.tsを復元
if [ -f "../../prisma.config.ts.bak" ]; then
  mv ../../prisma.config.ts.bak ../../prisma.config.ts 2>/dev/null || true
fi

# TypeScriptをビルド
echo "Building TypeScript..."
npm run build

# distディレクトリの内容をルートにコピー（SAM CLIのビルドプロセス用）
echo "Copying dist contents to root for SAM build..."
cp dist/handler.js . 2>/dev/null || true

# Prismaクライアントはnode_modulesに既に存在するため、追加のコピーは不要
# SAM CLIのNodejsNpmBuilderがnode_modulesを自動的にパッケージ化する

# 不要なファイルを削除してパッケージサイズを削減
echo "Cleaning up unnecessary files..."
rm -rf dist 2>/dev/null || true
rm -f handler.d.ts 2>/dev/null || true
rm -f handler.d.ts.map 2>/dev/null || true
rm -f handler.js.map 2>/dev/null || true
rm -f *.ts 2>/dev/null || true
rm -f tsconfig.json 2>/dev/null || true
rm -f schema.prisma 2>/dev/null || true
rm -f test-event*.json 2>/dev/null || true
rm -f README.md 2>/dev/null || true
rm -f build.sh 2>/dev/null || true

# node_modulesから不要なパッケージを削除（devDependencies）
echo "Removing dev dependencies from node_modules..."
npm prune --production 2>/dev/null || true

echo "Build completed!"
