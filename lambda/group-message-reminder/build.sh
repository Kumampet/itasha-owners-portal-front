#!/bin/bash
set -e

echo "Building Group Message Reminder Lambda function..."

# Lambda関数ディレクトリに移動
cd "$(dirname "$0")"

# 依存関係をインストール（PrismaはLayerから提供されるため除外）
echo "Installing dependencies..."
npm install

# Prismaクライアントがnode_modulesに含まれている場合は削除（Layerから提供されるため）
echo "Removing Prisma Client from node_modules (provided by Layer)..."
rm -rf node_modules/@prisma 2>/dev/null || true
rm -rf node_modules/.prisma 2>/dev/null || true

# TypeScriptをビルド
echo "Building TypeScript..."
npm run build

# Prismaクライアントをdistから削除（Lambda Layerから提供されるため不要）
echo "Removing Prisma Client from dist (provided by Layer)..."
rm -rf dist/@prisma 2>/dev/null || true
rm -rf dist/.prisma 2>/dev/null || true

# distディレクトリの内容をルートにコピー（SAM CLIのビルドプロセス用）
echo "Copying dist contents to root for SAM build..."
cp dist/handler.js . 2>/dev/null || true

# PrismaクライアントはLambda Layerから提供されるため、ここでは不要

# 不要なファイルを削除してパッケージサイズを削減
echo "Cleaning up unnecessary files..."
rm -rf dist 2>/dev/null || true
rm -f handler.d.ts 2>/dev/null || true
rm -f handler.d.ts.map 2>/dev/null || true
rm -f handler.js.map 2>/dev/null || true
# handler.tsとtsconfig.jsonはソースファイルなので削除しない
# rm -f handler.ts 2>/dev/null || true
# rm -f tsconfig.json 2>/dev/null || true
rm -f schema.prisma 2>/dev/null || true
rm -f test-event*.json 2>/dev/null || true
rm -f README.md 2>/dev/null || true
# build.shは最後に削除しない（SAM CLIのビルドプロセスで使用される可能性があるため）

# node_modulesから不要なパッケージを削除
echo "Removing unnecessary packages from node_modules..."
# AWS SDKの不要な部分を削除（SESのみ使用）
if [ -d "node_modules/@aws-sdk" ]; then
  echo "Removing unnecessary AWS SDK packages..."
  # client-ses以外のクライアントを削除
  for dir in node_modules/@aws-sdk/client-*; do
    if [ -d "$dir" ] && [ "$(basename "$dir")" != "client-ses" ]; then
      rm -rf "$dir" 2>/dev/null || true
    fi
  done
  # 共通パッケージの不要な部分を削除
  find node_modules/@aws-sdk -name "*.md" -type f -delete 2>/dev/null || true
  find node_modules/@aws-sdk -name "*.test.*" -type f -delete 2>/dev/null || true
fi
# ドキュメントファイルを削除
find node_modules -name "*.md" -type f -delete 2>/dev/null || true
find node_modules -name "LICENSE*" -type f -delete 2>/dev/null || true
find node_modules -name "CHANGELOG*" -type f -delete 2>/dev/null || true
find node_modules -name "*.txt" -type f -delete 2>/dev/null || true
# テストファイルを削除
find node_modules -name "*.test.*" -type f -delete 2>/dev/null || true
find node_modules -name "*.spec.*" -type f -delete 2>/dev/null || true
find node_modules -name "test" -type d -exec rm -rf {} + 2>/dev/null || true
find node_modules -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true
find node_modules -name "__tests__" -type d -exec rm -rf {} + 2>/dev/null || true
# ソースマップを削除（本番環境では不要）
find node_modules -name "*.map" -type f -delete 2>/dev/null || true

echo "Build completed!"
