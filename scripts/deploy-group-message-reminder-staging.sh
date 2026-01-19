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

# ローカル環境からデプロイする場合は、AWSプロファイルを設定
export AWS_PROFILE=Itanavi-Lambda-Deploy-local

echo "Environment: $ENVIRONMENT"
echo "AWS Region: $AWS_REGION"
echo "AWS Profile: $AWS_PROFILE (for local deployment)"
echo "SES From Email: $SES_FROM_EMAIL"

# AWS認証情報の確認（プロファイルを使用）
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity --profile "$AWS_PROFILE" &> /dev/null; then
  echo "Error: AWS credentials not configured for profile '$AWS_PROFILE'."
  echo "Please configure AWS credentials using one of the following methods:"
  echo "  1. Run 'aws configure --profile Itanavi-Lambda-Deploy-local'"
  echo "  2. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables"
  echo "  3. Use AWS SSO or IAM roles"
  exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --profile "$AWS_PROFILE" --query Account --output text 2>/dev/null)
echo "AWS Account ID: $AWS_ACCOUNT_ID"

# AWS CLIのパスを取得（cleanupスクリプト用）
if command -v aws &> /dev/null; then
  AWS_CMD="aws"
elif [ -f "/c/Program Files/Amazon/AWSCLIV2/aws.exe" ]; then
  AWS_CMD="/c/Program Files/Amazon/AWSCLIV2/aws.exe"
else
  AWS_CMD="aws"  # デフォルト（エラー時は後で検出される）
fi

# 失敗したSAM管理スタックをクリーンアップ
echo "Checking for failed SAM managed stacks..."
if "$AWS_CMD" cloudformation describe-stacks --stack-name aws-sam-cli-managed-default --profile "$AWS_PROFILE" --region "$AWS_REGION" &> /dev/null; then
  STACK_STATUS=$("$AWS_CMD" cloudformation describe-stacks \
    --stack-name aws-sam-cli-managed-default \
    --profile "$AWS_PROFILE" \
    --region "$AWS_REGION" \
    --query "Stacks[0].StackStatus" \
    --output text 2>/dev/null || echo "UNKNOWN")
  
  if [ "$STACK_STATUS" = "ROLLBACK_FAILED" ] || [ "$STACK_STATUS" = "CREATE_FAILED" ] || [ "$STACK_STATUS" = "DELETE_FAILED" ]; then
    echo "Found failed SAM managed stack. Cleaning up..."
    "$AWS_CMD" cloudformation delete-stack \
      --stack-name aws-sam-cli-managed-default \
      --profile "$AWS_PROFILE" \
      --region "$AWS_REGION" || true
    
    echo "Waiting for cleanup to complete (this may take a few minutes)..."
    "$AWS_CMD" cloudformation wait stack-delete-complete \
      --stack-name aws-sam-cli-managed-default \
      --profile "$AWS_PROFILE" \
      --region "$AWS_REGION" || echo "Stack deletion in progress..."
  fi
fi

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
  --stack-name group-message-reminder-staging \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    Environment=staging \
    DatabaseUrl="$DATABASE_URL" \
    SesFromEmail="$SES_FROM_EMAIL" \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE" \
  --resolve-s3 \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset

echo "Deployment completed successfully!"
echo "Lambda function ARN: Check CloudFormation outputs"
echo "EventBridge Schedules:"
echo "  - staging-group-message-reminder-morning"
echo "  - staging-group-message-reminder-noon"
echo "  - staging-group-message-reminder-evening"
echo "  - staging-group-message-reminder-night"
