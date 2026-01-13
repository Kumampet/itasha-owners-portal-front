#!/bin/bash
set -e

echo "Installing AWS SAM CLI..."

# Wingetが利用可能か確認
if command -v winget &> /dev/null; then
    echo "Using winget to install SAM CLI..."
    winget install Amazon.SAM-CLI
    echo ""
    echo "Installation completed!"
    echo ""
    echo "Note: If 'sam' command is not recognized in Git Bash, add the following to ~/.bashrc:"
    echo "  alias sam='sam.cmd'"
    echo ""
    echo "Then run: source ~/.bashrc"
    exit 0
fi

# Chocolateyが利用可能か確認
if command -v choco &> /dev/null; then
    echo "Using Chocolatey to install SAM CLI..."
    choco install aws-sam-cli -y
    echo ""
    echo "Installation completed!"
    exit 0
fi

# Pythonが利用可能か確認
if command -v python &> /dev/null || command -v python3 &> /dev/null; then
    PYTHON_CMD=$(command -v python3 || command -v python)
    echo "Using Python to install SAM CLI..."
    $PYTHON_CMD -m pip install aws-sam-cli
    echo ""
    echo "Installation completed!"
    exit 0
fi

echo "Error: No installation method found."
echo ""
echo "Please install SAM CLI manually using one of the following methods:"
echo "  1. Download installer from: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
echo "  2. Install Chocolatey and run: choco install aws-sam-cli"
echo "  3. Install Python and run: pip install aws-sam-cli"
exit 1

