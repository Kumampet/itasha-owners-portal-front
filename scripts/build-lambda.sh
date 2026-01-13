#!/bin/bash
set -e

echo "Building Lambda functions..."

# Lambda関数のディレクトリリスト
LAMBDA_DIRS=(
  "lambda/websocket-connect"
  "lambda/websocket-disconnect"
  "lambda/websocket-join-group"
  "lambda/websocket-leave-group"
  "lambda/websocket-send-message"
  "lambda/broadcast-message"
)

# 各Lambda関数をビルド
for dir in "${LAMBDA_DIRS[@]}"; do
  echo "Building $dir..."
  cd "$dir"
  
  # package.jsonが存在するか確認
  if [ ! -f "package.json" ]; then
    echo "Error: package.json not found in $dir"
    exit 1
  fi
  
  # 依存関係をインストール
  npm install --production=false
  
  # TypeScriptをビルド
  if [ -f "tsconfig.json" ]; then
    npm run build
  else
    echo "Warning: tsconfig.json not found in $dir, skipping build"
  fi
  
  cd - > /dev/null
done

echo "All Lambda functions built successfully!"

