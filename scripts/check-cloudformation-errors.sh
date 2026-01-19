#!/bin/bash
# CloudFormationスタックのエラーを確認するスクリプト

STACK_NAME=${1:-group-message-reminder-staging}
PROFILE=${2:-Itanavi-Lambda-Deploy-local}
REGION=${3:-ap-northeast-1}

echo "Checking CloudFormation stack errors for: $STACK_NAME"
echo "Profile: $PROFILE"
echo "Region: $REGION"
echo ""

# AWS CLIのパスを取得
if command -v aws &> /dev/null; then
  AWS_CMD="aws"
elif [ -f "/c/Program Files/Amazon/AWSCLIV2/aws.exe" ]; then
  AWS_CMD="/c/Program Files/Amazon/AWSCLIV2/aws.exe"
else
  echo "Error: AWS CLI not found"
  exit 1
fi

# スタックの状態を確認
echo "Stack Status:"
"$AWS_CMD" cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --profile "$PROFILE" \
  --region "$REGION" \
  --query "Stacks[0].StackStatus" \
  --output text 2>/dev/null || echo "Stack not found or error occurred"

echo ""
echo "Failed Events:"
"$AWS_CMD" cloudformation describe-stack-events \
  --stack-name "$STACK_NAME" \
  --profile "$PROFILE" \
  --region "$REGION" \
  --max-items 50 \
  --query "StackEvents[?ResourceStatus=='CREATE_FAILED' || ResourceStatus=='UPDATE_FAILED' || ResourceStatus=='ROLLBACK_FAILED'].[Timestamp,ResourceType,LogicalResourceId,ResourceStatusReason]" \
  --output table 2>/dev/null || echo "Failed to get stack events"

echo ""
echo "Recent Events (last 10):"
"$AWS_CMD" cloudformation describe-stack-events \
  --stack-name "$STACK_NAME" \
  --profile "$PROFILE" \
  --region "$REGION" \
  --max-items 10 \
  --query "StackEvents[].[Timestamp,ResourceType,LogicalResourceId,ResourceStatus]" \
  --output table 2>/dev/null || echo "Failed to get stack events"
