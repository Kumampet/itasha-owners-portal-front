#!/bin/bash
set -e

echo "Building Prisma Layer..."

# Layerディレクトリに移動
cd "$(dirname "$0")"

# nodejsディレクトリが存在しない場合は作成
if [ ! -d "nodejs" ]; then
  echo "Creating nodejs directory..."
  mkdir -p nodejs
fi

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

# Prismaスキーマをコピー（ルートのprismaディレクトリから）
if [ -f "../../../prisma/schema.prisma" ]; then
  cp ../../../prisma/schema.prisma ./schema.prisma
  echo "Prisma schema copied from prisma/schema.prisma"
elif [ -f "../../group-message-reminder/schema.prisma" ]; then
  cp ../../group-message-reminder/schema.prisma ./schema.prisma
  echo "Prisma schema copied from lambda/group-message-reminder/schema.prisma"
else
  echo "Error: schema.prisma not found in expected locations"
  exit 1
fi

# PrismaスキーマにbinaryTargetsを追加（LambdaはLinux x86_64のみ必要）
echo "Updating Prisma schema for Lambda..."
# generatorセクションにbinaryTargetsを追加（Linux x86_64用）
if grep -q "binaryTargets" schema.prisma; then
  echo "binaryTargets already exists in schema"
else
  # Windows用のsedコマンド（Git Bash）
  sed -i.bak 's/generator client {/generator client {\n  binaryTargets = ["linux-musl-openssl-3.0.x"]/' schema.prisma 2>/dev/null || \
  # macOS用のsedコマンド
  sed -i '' 's/generator client {/generator client {\n  binaryTargets = ["linux-musl-openssl-3.0.x"]/' schema.prisma 2>/dev/null || \
  # フォールバック: 手動で追加
  python3 -c "
import re
with open('schema.prisma', 'r') as f:
    content = f.read()
if 'binaryTargets' not in content:
    content = re.sub(r'(generator client \{)', r'\1\n  binaryTargets = [\"linux-musl-openssl-3.0.x\"]', content)
    with open('schema.prisma', 'w') as f:
        f.write(content)
" 2>/dev/null || echo "Warning: Could not update schema.prisma, using as-is"
fi

# Prismaクライアントを生成
echo "Generating Prisma Client..."
# prisma.config.tsを一時的にリネームして無視
if [ -f "../../../prisma.config.ts" ]; then
  mv ../../../prisma.config.ts ../../../prisma.config.ts.bak 2>/dev/null || true
fi
# Linux x86_64のみを指定して生成
npx prisma generate --schema=./schema.prisma
# prisma.config.tsを復元
if [ -f "../../../prisma.config.ts.bak" ]; then
  mv ../../../prisma.config.ts.bak ../../../prisma.config.ts 2>/dev/null || true
fi

# スキーマファイルのバックアップを削除
rm -f schema.prisma.bak 2>/dev/null || true

# 不要なファイルを削除
echo "Cleaning up unnecessary files..."
rm -f schema.prisma
rm -f package.json
rm -f package-lock.json

# prismaパッケージを削除（devDependencyのため）
rm -rf node_modules/prisma 2>/dev/null || true

# .binディレクトリを削除（Lambda Layerには不要、シンボリックリンクが壊れるのを防ぐ）
rm -rf node_modules/.bin 2>/dev/null || true

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

# Prismaエンジンの不要なプラットフォームバイナリを削除（LambdaはLinux x86_64のみ必要）
echo "Removing unnecessary Prisma engine binaries..."
# .prisma/client内のエンジンファイルを確認
if [ -d "node_modules/.prisma/client" ]; then
  # Linux x86_64以外のプラットフォームのエンジンを削除
  find node_modules/.prisma/client -type f -name "*darwin*" -delete 2>/dev/null || true
  find node_modules/.prisma/client -type f -name "*windows*" -delete 2>/dev/null || true
  find node_modules/.prisma/client -type f -name "*arm64*" -delete 2>/dev/null || true
  # musl以外のLinuxバイナリも削除（Lambdaはmuslを使用）
  find node_modules/.prisma/client -type f -name "*linux-glibc*" -delete 2>/dev/null || true
fi

# @prisma/enginesパッケージの不要なバイナリを削除
if [ -d "node_modules/@prisma/engines" ]; then
  echo "Removing unnecessary Prisma engines..."
  # すべてのプラットフォームディレクトリを削除（Linux x86_64 muslのみ残す）
  find node_modules/@prisma/engines -type d -name "*darwin*" -exec rm -rf {} + 2>/dev/null || true
  find node_modules/@prisma/engines -type d -name "*windows*" -exec rm -rf {} + 2>/dev/null || true
  find node_modules/@prisma/engines -type d -name "*arm64*" -exec rm -rf {} + 2>/dev/null || true
  find node_modules/@prisma/engines -type d -name "*linux-glibc*" -exec rm -rf {} + 2>/dev/null || true
  # ファイルも削除
  find node_modules/@prisma/engines -type f -name "*darwin*" -delete 2>/dev/null || true
  find node_modules/@prisma/engines -type f -name "*windows*" -delete 2>/dev/null || true
  find node_modules/@prisma/engines -type f -name "*arm64*" -delete 2>/dev/null || true
  find node_modules/@prisma/engines -type f -name "*linux-glibc*" -delete 2>/dev/null || true
  # キャッシュディレクトリも削除
  find node_modules/@prisma/engines -type d -name ".cache" -exec rm -rf {} + 2>/dev/null || true
  find node_modules/@prisma/engines -type d -name "cache" -exec rm -rf {} + 2>/dev/null || true
fi

# @prisma/studio-coreを削除（Lambdaでは不要）
if [ -d "node_modules/@prisma/studio-core" ]; then
  echo "Removing Prisma Studio (not needed in Lambda)..."
  rm -rf node_modules/@prisma/studio-core 2>/dev/null || true
fi

# @prisma/query-plan-executorを削除（Lambdaでは不要）
if [ -d "node_modules/@prisma/query-plan-executor" ]; then
  echo "Removing Prisma Query Plan Executor (not needed in Lambda)..."
  rm -rf node_modules/@prisma/query-plan-executor 2>/dev/null || true
fi

# @prisma/clientの不要なランタイムファイルを削除
if [ -d "node_modules/@prisma/client/runtime" ]; then
  echo "Removing unnecessary Prisma Client runtime files..."
  # SQL Server、PostgreSQL、SQLite用のWASMファイルを削除（MySQLのみ使用）
  find node_modules/@prisma/client/runtime -name "*sqlserver*" -type f -delete 2>/dev/null || true
  find node_modules/@prisma/client/runtime -name "*postgresql*" -type f -delete 2>/dev/null || true
  find node_modules/@prisma/client/runtime -name "*sqlite*" -type f -delete 2>/dev/null || true
  # Edge runtime関連のファイルを削除（Lambdaでは不要）
  find node_modules/@prisma/client -name "*edge*" -type f -delete 2>/dev/null || true
  find node_modules/@prisma/client -name "*browser*" -type f -delete 2>/dev/null || true
fi

# mariadbパッケージの不要なファイルをさらに削除
if [ -d "node_modules/mariadb" ]; then
  echo "Removing more unnecessary mariadb files..."
  # ドキュメントとサンプルを削除
  find node_modules/mariadb -name "*.md" -type f -delete 2>/dev/null || true
  find node_modules/mariadb -name "*.txt" -type f -delete 2>/dev/null || true
  find node_modules/mariadb -name "examples" -type d -exec rm -rf {} + 2>/dev/null || true
  find node_modules/mariadb -name "doc" -type d -exec rm -rf {} + 2>/dev/null || true
  find node_modules/mariadb -name "docs" -type d -exec rm -rf {} + 2>/dev/null || true
fi

# その他の不要なファイルを削除
find node_modules -name ".npmignore" -type f -delete 2>/dev/null || true
find node_modules -name ".gitignore" -type f -delete 2>/dev/null || true
find node_modules -name "README*" -type f -delete 2>/dev/null || true

# サイズを確認
echo "Layer size after cleanup:"
du -sh node_modules 2>/dev/null || echo "Size check failed"

echo "Prisma Layer build completed!"
