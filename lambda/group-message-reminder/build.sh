#!/bin/bash
set -e

echo "Building Group Message Reminder Lambda function..."

# Lambda関数ディレクトリに移動
cd "$(dirname "$0")"

# 依存関係をインストール（PrismaはLayerから提供されるため除外）
echo "Installing dependencies..."
npm install

# TypeScriptをビルド
echo "Building TypeScript..."
npm run build

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
rm -f handler.ts 2>/dev/null || true
rm -f tsconfig.json 2>/dev/null || true
rm -f schema.prisma 2>/dev/null || true
rm -f test-event*.json 2>/dev/null || true
rm -f README.md 2>/dev/null || true
rm -f build.sh 2>/dev/null || true

echo "Build completed!"
