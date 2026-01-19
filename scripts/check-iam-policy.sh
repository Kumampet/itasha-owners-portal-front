#!/bin/bash
# IAMポリシーを確認するスクリプト

set -e

PROFILE=${1:-Itanavi-Lambda-Deploy-local}
USER_NAME=${2:-Itanavi-Lambda-Deploy-local}

echo "Checking IAM policy for user: $USER_NAME"
echo "Profile: $PROFILE"
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

# ユーザーにアタッチされているポリシーを確認
echo "Attached policies:"
"$AWS_CMD" iam list-attached-user-policies \
  --user-name "$USER_NAME" \
  --profile "$PROFILE" \
  --output table 2>&1 || echo "Failed to list attached policies (may need admin permissions)"

echo ""
echo "Inline policies:"
"$AWS_CMD" iam list-user-policies \
  --user-name "$USER_NAME" \
  --profile "$PROFILE" \
  --output table 2>&1 || echo "Failed to list inline policies (may need admin permissions)"

echo ""
echo "To check effective permissions, run:"
echo "  aws iam simulate-principal-policy \\"
echo "    --policy-source-arn arn:aws:iam::059948105185:user/$USER_NAME \\"
echo "    --action-names s3:CreateBucket \\"
echo "    --resource-arns arn:aws:s3:::sam-deployments-* \\"
echo "    --profile <admin-profile>"
