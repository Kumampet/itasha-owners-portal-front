#!/bin/bash
# 失敗したCloudFormationスタックを削除するスクリプト

set -e

STACK_NAME=${1:-aws-sam-cli-managed-default}
PROFILE=${2:-Itanavi-Lambda-Deploy-local}
REGION=${3:-ap-northeast-1}

echo "Checking stack: $STACK_NAME"
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

# スタックの存在確認
if ! "$AWS_CMD" cloudformation describe-stacks --stack-name "$STACK_NAME" --profile "$PROFILE" --region "$REGION" &> /dev/null; then
  echo "Stack '$STACK_NAME' does not exist. Nothing to clean up."
  exit 0
fi

# スタックの状態を確認
STACK_STATUS=$("$AWS_CMD" cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --profile "$PROFILE" \
  --region "$REGION" \
  --query "Stacks[0].StackStatus" \
  --output text 2>/dev/null)

echo "Current stack status: $STACK_STATUS"

# ROLLBACK_FAILEDまたはCREATE_FAILED状態のスタックを削除
if [ "$STACK_STATUS" = "ROLLBACK_FAILED" ] || [ "$STACK_STATUS" = "CREATE_FAILED" ] || [ "$STACK_STATUS" = "DELETE_FAILED" ]; then
  echo "Deleting failed stack: $STACK_NAME"
  "$AWS_CMD" cloudformation delete-stack \
    --stack-name "$STACK_NAME" \
    --profile "$PROFILE" \
    --region "$REGION"
  
  echo "Waiting for stack deletion to complete..."
  "$AWS_CMD" cloudformation wait stack-delete-complete \
    --stack-name "$STACK_NAME" \
    --profile "$PROFILE" \
    --region "$REGION"
  
  echo "Stack '$STACK_NAME' has been deleted successfully."
else
  echo "Stack '$STACK_NAME' is in state '$STACK_STATUS'. No action needed."
fi
