#!/bin/bash
set -e

echo "Deploying Group Message Reminder Lambda function for PRODUCTION environment..."

# 環境変数の確認
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL to production database connection string"
    exit 1
fi

if [ -z "$SES_FROM_EMAIL" ]; then
    echo "Error: SES_FROM_EMAIL environment variable is not set"
    echo "Please set SES_FROM_EMAIL to production SES sender email address"
    exit 1
fi

export AWS_REGION=${AWS_REGION:-ap-northeast-1}
export ENVIRONMENT=prod

# ローカル環境からデプロイする場合は、AWSプロファイルを設定
export AWS_PROFILE=admin

echo "Environment: $ENVIRONMENT"
echo "AWS Region: $AWS_REGION"
echo "AWS Profile: $AWS_PROFILE (for local deployment)"
echo "SES From Email: $SES_FROM_EMAIL"

# AWS認証情報の確認（プロファイルを使用）
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity --profile "$AWS_PROFILE" &> /dev/null; then
  echo "Error: AWS credentials not configured for profile '$AWS_PROFILE'."
  echo "Please configure AWS credentials using one of the following methods:"
  echo "  1. Run 'aws configure --profile admin'"
  echo "  2. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables"
  echo "  3. Use AWS SSO or IAM roles"
  exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --profile "$AWS_PROFILE" --query Account --output text 2>/dev/null)
echo "AWS Account ID: $AWS_ACCOUNT_ID"

# 確認プロンプト
read -p "Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Deployment cancelled."
    exit 1
fi

# Lambda関数をビルド
echo "Building Lambda function..."
# Prisma Layerをビルド
echo "Building Prisma Layer..."
bash lambda/prisma-layer/build.sh

# Lambda関数をビルド
echo "Building Lambda function..."
npm run lambda:build

# SAMコマンドのパスを取得（Windows環境対応）
if command -v sam &> /dev/null; then
  SAM_CMD="sam"
elif command -v sam.cmd &> /dev/null; then
  SAM_CMD="sam.cmd"
elif [ -f "/c/Program Files/Amazon/AWSSAMCLI/bin/sam.cmd" ]; then
  SAM_CMD="/c/Program Files/Amazon/AWSSAMCLI/bin/sam.cmd"
elif [ -f "C:/Program Files/Amazon/AWSSAMCLI/bin/sam.cmd" ]; then
  SAM_CMD="C:/Program Files/Amazon/AWSSAMCLI/bin/sam.cmd"
else
  # Windows環境でwhere.exeを使用してsam.cmdを探す
  SAM_PATH=$(where.exe sam.cmd 2>/dev/null | head -n 1 | tr -d '\r')
  if [ -n "$SAM_PATH" ]; then
    SAM_CMD="$SAM_PATH"
  else
    echo "Error: SAM CLI not found. Please install AWS SAM CLI."
    exit 1
  fi
fi

echo "Using SAM CLI: $SAM_CMD"

# SAMビルド
echo "Building SAM template..."
"$SAM_CMD" build --template-file infrastructure/group-message-reminder.yaml

# SAMデプロイ（AWSプロファイルを使用）
echo "Deploying to AWS..."
"$SAM_CMD" deploy \
  --stack-name group-message-reminder-prod \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    Environment=prod \
    DatabaseUrl="$DATABASE_URL" \
    SesFromEmail="$SES_FROM_EMAIL" \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE" \
  --resolve-s3

echo "Deployment completed successfully!"
echo "Lambda function ARN: Check CloudFormation outputs"
echo "EventBridge Schedules:"
echo "  - prod-group-message-reminder-morning"
echo "  - prod-group-message-reminder-noon"
echo "  - prod-group-message-reminder-evening"
echo "  - prod-group-message-reminder-night"
