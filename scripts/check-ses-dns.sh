#!/bin/bash
# SESドメイン認証のDNSレコードを確認するスクリプト

DOMAIN="itasha-owners-navi.link"
DNS_NAME="_amazonses.${DOMAIN}"

echo "Checking DNS record for SES domain verification..."
echo "Domain: ${DOMAIN}"
echo "DNS Name: ${DNS_NAME}"
echo ""

# Windows環境でのnslookupを使用
if command -v nslookup &> /dev/null; then
  echo "Using nslookup..."
  nslookup -type=TXT "${DNS_NAME}" 2>&1
elif command -v host &> /dev/null; then
  echo "Using host command..."
  host -t TXT "${DNS_NAME}" 2>&1
else
  echo "Error: Neither nslookup nor host command found."
  echo "Please use one of the following methods:"
  echo ""
  echo "1. Online DNS checker:"
  echo "   Visit https://mxtoolbox.com/TXTLookup.aspx"
  echo "   Enter: ${DNS_NAME}"
  echo ""
  echo "2. PowerShell (Windows):"
  echo "   Resolve-DnsName -Name ${DNS_NAME} -Type TXT"
  echo ""
  echo "3. AWS CLI:"
  echo "   aws ses get-identity-verification-attributes \\"
  echo "     --identities ${DOMAIN} \\"
  echo "     --profile admin \\"
  echo "     --region ap-northeast-1 \\"
  echo "     --output table"
fi
