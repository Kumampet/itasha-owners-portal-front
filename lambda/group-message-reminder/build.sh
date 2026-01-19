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

echo "Build completed!"
