#!/bin/bash
set -e

echo "Building Prisma Layer..."

# Layerディレクトリに移動
cd "$(dirname "$0")"

# nodejsディレクトリに移動
cd nodejs

# package.jsonを作成
cat > package.json << 'EOF'
{
  "name": "prisma-layer",
  "version": "1.0.0",
  "description": "Prisma Client Layer for Lambda",
  "dependencies": {
    "@prisma/client": "^7.0.0",
    "@prisma/adapter-mariadb": "^7.0.0",
    "mariadb": "^3.4.5"
  },
  "devDependencies": {
    "prisma": "^7.0.0"
  }
}
EOF

# 依存関係をインストール（devDependenciesも含む）
echo "Installing dependencies..."
npm install

# Prismaスキーマをコピー（Lambda関数ディレクトリから）
if [ -f "../../group-message-reminder/schema.prisma" ]; then
  cp ../../group-message-reminder/schema.prisma ./schema.prisma
  echo "Prisma schema copied"
else
  echo "Warning: schema.prisma not found"
fi

# Prismaクライアントを生成
echo "Generating Prisma Client..."
# prisma.config.tsを一時的にリネームして無視
if [ -f "../../../prisma.config.ts" ]; then
  mv ../../../prisma.config.ts ../../../prisma.config.ts.bak 2>/dev/null || true
fi
npx prisma generate --schema=./schema.prisma
# prisma.config.tsを復元
if [ -f "../../../prisma.config.ts.bak" ]; then
  mv ../../../prisma.config.ts.bak ../../../prisma.config.ts 2>/dev/null || true
fi

# 不要なファイルを削除
echo "Cleaning up unnecessary files..."
rm -f schema.prisma
rm -f package.json
rm -f package-lock.json
# prismaパッケージを削除（devDependencyのため）
rm -rf node_modules/prisma 2>/dev/null || true
# Prismaクライアントの不要なファイルを削除
find node_modules/@prisma/client -name "*.ts" -type f -delete 2>/dev/null || true
find node_modules/@prisma/client -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true
find node_modules/@prisma/client -name ".git" -type d -exec rm -rf {} + 2>/dev/null || true
find node_modules/@prisma/client -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true

echo "Prisma Layer build completed!"
