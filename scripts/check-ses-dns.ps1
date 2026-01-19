# SESドメイン認証のDNSレコードを確認するPowerShellスクリプト

$Domain = "itasha-owners-navi.link"
$DnsName = "_amazonses.$Domain"

Write-Host "Checking DNS record for SES domain verification..." -ForegroundColor Cyan
Write-Host "Domain: $Domain" -ForegroundColor Cyan
Write-Host "DNS Name: $DnsName" -ForegroundColor Cyan
Write-Host ""

try {
    $result = Resolve-DnsName -Name $DnsName -Type TXT -ErrorAction Stop
    Write-Host "DNS Record found:" -ForegroundColor Green
    foreach ($record in $result) {
        Write-Host "  Type: $($record.Type)" -ForegroundColor Yellow
        Write-Host "  Name: $($record.Name)" -ForegroundColor Yellow
        Write-Host "  Strings: $($record.Strings -join '')" -ForegroundColor Yellow
    }
} catch {
    Write-Host "DNS Record not found or not yet propagated." -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  1. DNS record is correctly configured in your DNS provider" -ForegroundColor Yellow
    Write-Host "  2. DNS propagation may take up to 48 hours" -ForegroundColor Yellow
    Write-Host "  3. Use online DNS checker: https://mxtoolbox.com/TXTLookup.aspx" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "To check SES verification status:" -ForegroundColor Cyan
Write-Host "  aws ses get-identity-verification-attributes --identities $Domain --profile admin --region ap-northeast-1 --output table" -ForegroundColor Gray
