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

echo "Environment: $ENVIRONMENT"
echo "AWS Region: $AWS_REGION"
echo "SES From Email: $SES_FROM_EMAIL"

# 確認プロンプト
read -p "Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Deployment cancelled."
    exit 1
fi

# Lambda関数をビルド
echo "Building Lambda function..."
npm run lambda:build

# SAMビルド
echo "Building SAM template..."
sam build --template-file infrastructure/group-message-reminder.yaml

# SAMデプロイ
echo "Deploying to AWS..."
sam deploy \
  --stack-name group-message-reminder-prod \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    Environment=prod \
    DatabaseUrl="$DATABASE_URL" \
    SesFromEmail="$SES_FROM_EMAIL" \
  --region "$AWS_REGION"

echo "Deployment completed successfully!"
echo "Lambda function ARN: Check CloudFormation outputs"
echo "EventBridge Schedules:"
echo "  - prod-group-message-reminder-morning"
echo "  - prod-group-message-reminder-noon"
echo "  - prod-group-message-reminder-evening"
echo "  - prod-group-message-reminder-night"
