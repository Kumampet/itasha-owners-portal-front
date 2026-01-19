#!/bin/bash
set -e

echo "Deploying Group Message Reminder Lambda function for STAGING environment..."

# 環境変数の確認
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL to staging database connection string"
    exit 1
fi

if [ -z "$SES_FROM_EMAIL" ]; then
    echo "Error: SES_FROM_EMAIL environment variable is not set"
    echo "Please set SES_FROM_EMAIL to staging SES sender email address"
    exit 1
fi

export AWS_REGION=${AWS_REGION:-ap-northeast-1}
export ENVIRONMENT=staging

echo "Environment: $ENVIRONMENT"
echo "AWS Region: $AWS_REGION"
echo "SES From Email: $SES_FROM_EMAIL"

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

# SAMデプロイ
echo "Deploying to AWS..."
"$SAM_CMD" deploy \
  --stack-name group-message-reminder-staging \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    Environment=staging \
    DatabaseUrl="$DATABASE_URL" \
    SesFromEmail="$SES_FROM_EMAIL" \
  --region "$AWS_REGION" \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset

echo "Deployment completed successfully!"
echo "Lambda function ARN: Check CloudFormation outputs"
echo "EventBridge Schedules:"
echo "  - staging-group-message-reminder-morning"
echo "  - staging-group-message-reminder-noon"
echo "  - staging-group-message-reminder-evening"
echo "  - staging-group-message-reminder-night"
