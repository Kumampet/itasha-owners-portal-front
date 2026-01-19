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
  
  if [ "$STACK_STATUS" = "ROLLBACK_FAILED" ] || [ "$STACK_STATUS" = "CREATE_FAILED" ]; then
    echo "Found failed SAM managed stack (status: $STACK_STATUS). Attempting cleanup..."
    
    # スタックを削除
    if "$AWS_CMD" cloudformation delete-stack \
      --stack-name aws-sam-cli-managed-default \
      --profile "$AWS_PROFILE" \
      --region "$AWS_REGION" 2>&1; then
      
      echo "Waiting for cleanup to complete (this may take a few minutes)..."
      # 最大10分待機（30秒間隔で20回）
      MAX_WAIT=20
      COUNT=0
      while [ $COUNT -lt $MAX_WAIT ]; do
        if ! "$AWS_CMD" cloudformation describe-stacks \
          --stack-name aws-sam-cli-managed-default \
          --profile "$AWS_PROFILE" \
          --region "$AWS_REGION" &> /dev/null; then
          echo "Stack deleted successfully."
          break
        fi
        echo "Still waiting... ($((COUNT + 1))/$MAX_WAIT)"
        sleep 30
        COUNT=$((COUNT + 1))
      done
      
      if [ $COUNT -eq $MAX_WAIT ]; then
        echo "Warning: Stack deletion is taking longer than expected."
        echo "You may need to delete it manually from the AWS Console."
        echo "Or use a custom S3 bucket: export SAM_S3_BUCKET=your-bucket-name"
      fi
    else
      echo "Failed to delete stack. Please delete manually or use a custom S3 bucket."
      echo "To use a custom bucket: export SAM_S3_BUCKET=your-bucket-name"
    fi
  elif [ "$STACK_STATUS" = "DELETE_FAILED" ]; then
    echo "ERROR: SAM managed stack is in DELETE_FAILED state."
    echo "This stack cannot be automatically deleted."
    echo ""
    echo "Please manually delete the stack using one of the following methods:"
    echo ""
    echo "Option 1: AWS Console"
    echo "  1. Go to CloudFormation console: https://console.aws.amazon.com/cloudformation"
    echo "  2. Find stack 'aws-sam-cli-managed-default'"
    echo "  3. Select it and click 'Delete'"
    echo ""
    echo "Option 2: AWS CLI (if resources allow)"
    echo "  $AWS_CMD cloudformation delete-stack \\"
    echo "    --stack-name aws-sam-cli-managed-default \\"
    echo "    --profile $AWS_PROFILE \\"
    echo "    --region $AWS_REGION"
    echo ""
    echo "Option 3: Use a custom S3 bucket instead"
    echo "  Set SAM_S3_BUCKET environment variable to use an existing bucket:"
    echo "  export SAM_S3_BUCKET=your-existing-bucket-name"
    echo ""
    exit 1
  fi
fi

# メインスタックの状態を確認して、ROLLBACK_COMPLETE状態の場合は削除
STACK_NAME="group-message-reminder-staging"
if "$AWS_CMD" cloudformation describe-stacks --stack-name "$STACK_NAME" --profile "$AWS_PROFILE" --region "$AWS_REGION" &> /dev/null; then
  MAIN_STACK_STATUS=$("$AWS_CMD" cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --profile "$AWS_PROFILE" \
    --region "$AWS_REGION" \
    --query "Stacks[0].StackStatus" \
    --output text 2>/dev/null || echo "UNKNOWN")
  
  if [ "$MAIN_STACK_STATUS" = "ROLLBACK_COMPLETE" ]; then
    echo "Found stack in ROLLBACK_COMPLETE state. Deleting before redeploy..."
    "$AWS_CMD" cloudformation delete-stack \
      --stack-name "$STACK_NAME" \
      --profile "$AWS_PROFILE" \
      --region "$AWS_REGION" 2>&1 || true
    
    echo "Waiting for stack deletion to complete..."
    "$AWS_CMD" cloudformation wait stack-delete-complete \
      --stack-name "$STACK_NAME" \
      --profile "$AWS_PROFILE" \
      --region "$AWS_REGION" 2>&1 || {
      echo "Waiting for deletion (this may take a few minutes)..."
      MAX_WAIT=20
      COUNT=0
      while [ $COUNT -lt $MAX_WAIT ]; do
        if ! "$AWS_CMD" cloudformation describe-stacks \
          --stack-name "$STACK_NAME" \
          --profile "$AWS_PROFILE" \
          --region "$AWS_REGION" &> /dev/null; then
          echo "Stack deleted successfully."
          break
        fi
        echo "Still waiting... ($((COUNT + 1))/$MAX_WAIT)"
        sleep 30
        COUNT=$((COUNT + 1))
      done
    }
  fi
fi

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

# S3バケットの設定
if [ -n "$SAM_S3_BUCKET" ]; then
  echo "Using custom S3 bucket: $SAM_S3_BUCKET"
  SAM_DEPLOY_ARGS=(
    --stack-name group-message-reminder-staging
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
    --parameter-overrides
      Environment=staging
      DatabaseUrl="$DATABASE_URL"
      SesFromEmail="$SES_FROM_EMAIL"
    --region "$AWS_REGION"
    --profile "$AWS_PROFILE"
    --s3-bucket "$SAM_S3_BUCKET"
    --no-confirm-changeset
    --no-fail-on-empty-changeset
  )
else
  echo "Using SAM managed S3 bucket (--resolve-s3)"
  SAM_DEPLOY_ARGS=(
    --stack-name group-message-reminder-staging
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
    --parameter-overrides
      Environment=staging
      DatabaseUrl="$DATABASE_URL"
      SesFromEmail="$SES_FROM_EMAIL"
    --region "$AWS_REGION"
    --profile "$AWS_PROFILE"
    --resolve-s3
    --no-confirm-changeset
    --no-fail-on-empty-changeset
  )
fi

"$SAM_CMD" deploy "${SAM_DEPLOY_ARGS[@]}"

echo "Deployment completed successfully!"
echo "Lambda function ARN: Check CloudFormation outputs"
echo "EventBridge Schedules:"
echo "  - staging-group-message-reminder-morning"
echo "  - staging-group-message-reminder-noon"
echo "  - staging-group-message-reminder-evening"
echo "  - staging-group-message-reminder-night"
