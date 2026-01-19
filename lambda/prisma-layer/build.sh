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
echo "Removing unnecessary Prisma Client files..."
# TypeScriptソースファイルを削除
find node_modules/@prisma/client -name "*.ts" -type f -delete 2>/dev/null || true
find node_modules/@prisma/client -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true
find node_modules/@prisma/client -name "*.map" -type f -delete 2>/dev/null || true
# ドキュメントファイルを削除
find node_modules/@prisma/client -name "*.md" -type f -delete 2>/dev/null || true
find node_modules/@prisma/client -name "CHANGELOG*" -type f -delete 2>/dev/null || true
find node_modules/@prisma/client -name "LICENSE*" -type f -delete 2>/dev/null || true
# テストファイルを削除
find node_modules/@prisma/client -name "*.test.*" -type f -delete 2>/dev/null || true
find node_modules/@prisma/client -name "*.spec.*" -type f -delete 2>/dev/null || true
# .gitディレクトリを削除
find node_modules/@prisma/client -name ".git" -type d -exec rm -rf {} + 2>/dev/null || true
# ネストされたnode_modulesを削除
find node_modules/@prisma/client -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true

# mariadbパッケージの不要なファイルを削除
echo "Removing unnecessary mariadb files..."
find node_modules/mariadb -name "*.md" -type f -delete 2>/dev/null || true
find node_modules/mariadb -name "*.test.*" -type f -delete 2>/dev/null || true
find node_modules/mariadb -name "*.spec.*" -type f -delete 2>/dev/null || true
find node_modules/mariadb -name "test" -type d -exec rm -rf {} + 2>/dev/null || true
find node_modules/mariadb -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true
find node_modules/mariadb -name "examples" -type d -exec rm -rf {} + 2>/dev/null || true

# @prisma/adapter-mariadbの不要なファイルを削除
if [ -d "node_modules/@prisma/adapter-mariadb" ]; then
  echo "Removing unnecessary @prisma/adapter-mariadb files..."
  find node_modules/@prisma/adapter-mariadb -name "*.ts" -type f -delete 2>/dev/null || true
  find node_modules/@prisma/adapter-mariadb -name "*.md" -type f -delete 2>/dev/null || true
  find node_modules/@prisma/adapter-mariadb -name "*.map" -type f -delete 2>/dev/null || true
fi

# その他の不要なファイルを削除
find node_modules -name ".npmignore" -type f -delete 2>/dev/null || true
find node_modules -name ".gitignore" -type f -delete 2>/dev/null || true
find node_modules -name "README*" -type f -delete 2>/dev/null || true

echo "Prisma Layer build completed!"
