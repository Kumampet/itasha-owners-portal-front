#!/bin/bash
# CloudFormationスタックのイベントを確認するスクリプト

set -e

STACK_NAME=${1:-group-message-reminder-staging}
PROFILE=${2:-Itanavi-Lambda-Deploy-local}
REGION=${3:-ap-northeast-1}

echo "Checking CloudFormation stack events for: $STACK_NAME"
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

# スタックのイベントを取得（最新の20件）
echo "Recent stack events:"
"$AWS_CMD" cloudformation describe-stack-events \
  --stack-name "$STACK_NAME" \
  --profile "$PROFILE" \
  --region "$REGION" \
  --max-items 20 \
  --query "StackEvents[].[Timestamp,ResourceType,LogicalResourceId,ResourceStatus,ResourceStatusReason]" \
  --output table 2>&1 || echo "Failed to get stack events"

echo ""
echo "To get more details, run:"
echo "  aws cloudformation describe-stack-events \\"
echo "    --stack-name $STACK_NAME \\"
echo "    --profile $PROFILE \\"
echo "    --region $REGION \\"
echo "    --query 'StackEvents[?ResourceStatus==\`CREATE_FAILED\` || ResourceStatus==\`UPDATE_FAILED\`]' \\"
echo "    --output json"
