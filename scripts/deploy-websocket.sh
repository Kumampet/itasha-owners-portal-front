#!/bin/bash
set -e

# 環境変数の確認
if [ -z "$AWS_REGION" ]; then
  echo "Error: AWS_REGION environment variable is not set"
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  exit 1
fi

# 環境名の設定（デフォルトはdev）
ENVIRONMENT=${ENVIRONMENT:-dev}
STACK_NAME="websocket-api-${ENVIRONMENT}"

echo "Deploying WebSocket API for environment: $ENVIRONMENT"
echo "Stack name: $STACK_NAME"

# Lambda関数をビルド
echo "Building Lambda functions..."
./scripts/build-lambda.sh

# SAM CLIがインストールされているか確認
# Windows環境ではsam.cmdとして提供されている可能性がある
SAM_CMD="sam"
if command -v sam.cmd &> /dev/null; then
    SAM_CMD="sam.cmd"
elif command -v sam &> /dev/null; then
    SAM_CMD="sam"
else
    echo "Error: SAM CLI is not installed. Please install it first."
    echo ""
    echo "Quick install:"
    echo "  npm run sam:install"
    echo ""
    echo "Or install manually:"
    echo "  1. Winget: winget install Amazon.SAM-CLI"
    echo "  2. Download installer from: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
    echo "  3. Chocolatey: choco install aws-sam-cli"
    echo "  4. Python: pip install aws-sam-cli"
    exit 1
fi

# SAM CLIのPATHを設定（Windows環境の場合）
if [ -d "/c/Program Files/Amazon/AWSSAMCLI/bin" ]; then
    export PATH="/c/Program Files/Amazon/AWSSAMCLI/bin:$PATH"
fi

# SAMビルド
echo "Building SAM application..."
$SAM_CMD build --template-file infrastructure/websocket-api.yaml

if [ $? -ne 0 ]; then
    echo "Error: SAM build failed"
    exit 1
fi

# SAMデプロイ
echo "Deploying SAM application..."
$SAM_CMD deploy \
  --stack-name "$STACK_NAME" \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    Environment="$ENVIRONMENT" \
    DatabaseUrl="$DATABASE_URL" \
  --region "$AWS_REGION" \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset

if [ $? -ne 0 ]; then
    echo "Error: SAM deploy failed"
    exit 1
fi

# 出力値を取得
echo "Getting stack outputs..."
OUTPUTS=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$AWS_REGION" \
  --query 'Stacks[0].Outputs' \
  --output json)

# WebSocket APIエンドポイントを取得
WEBSOCKET_ENDPOINT=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="WebSocketApiEndpoint") | .OutputValue')
BROADCAST_LAMBDA_ARN=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="BroadcastMessageLambdaArn") | .OutputValue')

echo ""
echo "Deployment completed successfully!"
echo ""
echo "WebSocket API Endpoint: $WEBSOCKET_ENDPOINT"
echo "Broadcast Lambda ARN: $BROADCAST_LAMBDA_ARN"
echo ""
echo "Please set the following environment variables in AWS Amplify:"
echo "  NEXT_PUBLIC_WEBSOCKET_ENDPOINT=$WEBSOCKET_ENDPOINT"
echo "  BROADCAST_MESSAGE_LAMBDA_ARN=$BROADCAST_LAMBDA_ARN"

