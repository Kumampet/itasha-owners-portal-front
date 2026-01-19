#!/bin/bash
# AWS CLIのPATHをGit Bashに追加するスクリプト

AWS_CLI_PATH="/c/Program Files/Amazon/AWSCLIV2"
BASH_PROFILE="$HOME/.bash_profile"
BASHRC="$HOME/.bashrc"

# AWS CLIがインストールされているか確認
if [ ! -f "$AWS_CLI_PATH/aws.exe" ]; then
    echo "Error: AWS CLI not found at $AWS_CLI_PATH"
    echo "Please install AWS CLI first using the MSI installer."
    exit 1
fi

# PATHに追加する行
PATH_LINE="export PATH=\"\$PATH:$AWS_CLI_PATH\""

# .bash_profileが存在する場合はそれを使用、なければ.bashrcを使用
if [ -f "$BASH_PROFILE" ]; then
    CONFIG_FILE="$BASH_PROFILE"
elif [ -f "$BASHRC" ]; then
    CONFIG_FILE="$BASHRC"
else
    # どちらも存在しない場合は.bash_profileを作成
    CONFIG_FILE="$BASH_PROFILE"
    touch "$CONFIG_FILE"
fi

# 既にPATHが追加されているか確認
if grep -q "$AWS_CLI_PATH" "$CONFIG_FILE" 2>/dev/null; then
    echo "AWS CLI PATH is already configured in $CONFIG_FILE"
else
    echo "" >> "$CONFIG_FILE"
    echo "# AWS CLI PATH" >> "$CONFIG_FILE"
    echo "$PATH_LINE" >> "$CONFIG_FILE"
    echo "Added AWS CLI PATH to $CONFIG_FILE"
fi

echo ""
echo "Please restart Git Bash or run the following command:"
echo "  source $CONFIG_FILE"
echo ""
echo "Then verify AWS CLI is available:"
echo "  aws --version"
