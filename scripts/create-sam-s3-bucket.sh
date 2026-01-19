#!/bin/bash
# SAMデプロイ用のS3バケットを作成するスクリプト

set -e

BUCKET_NAME=${1:-sam-deployments-$(date +%s)}
PROFILE=${2:-Itanavi-Lambda-Deploy-local}
REGION=${3:-ap-northeast-1}

echo "Creating S3 bucket for SAM deployments..."
echo "Bucket name: $BUCKET_NAME"
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

# バケットが既に存在するか確認
if "$AWS_CMD" s3 ls "s3://$BUCKET_NAME" --profile "$PROFILE" --region "$REGION" &> /dev/null; then
  echo "Bucket '$BUCKET_NAME' already exists."
  echo "You can use it by setting: export SAM_S3_BUCKET=$BUCKET_NAME"
  exit 0
fi

# バケットを作成
echo "Creating bucket..."
if [ "$REGION" = "us-east-1" ]; then
  # us-east-1の場合はLocationConstraintを指定しない
  "$AWS_CMD" s3 mb "s3://$BUCKET_NAME" --profile "$PROFILE" --region "$REGION"
else
  "$AWS_CMD" s3 mb "s3://$BUCKET_NAME" --profile "$PROFILE" --region "$REGION"
fi

# バージョニングを有効化
echo "Enabling versioning..."
"$AWS_CMD" s3api put-bucket-versioning \
  --bucket "$BUCKET_NAME" \
  --versioning-configuration Status=Enabled \
  --profile "$PROFILE" \
  --region "$REGION"

echo ""
echo "Bucket created successfully!"
echo "Use this bucket by setting: export SAM_S3_BUCKET=$BUCKET_NAME"
echo "Example:"
echo "  export SAM_S3_BUCKET=$BUCKET_NAME"
echo "  npm run lambda:deploy:staging"
