param(
  [Parameter(Mandatory = $true)]
  [string]$ApiKey,

  [Parameter(Mandatory = $true)]
  [string]$ApiBaseUrl,

  [string]$Client = "codex"
)

Write-Host ""
Write-Host "Configuring InsForge MCP for $Client..." -ForegroundColor Cyan
Write-Host ""

& npx @insforge/install --client $Client --env "API_KEY=$ApiKey" --env "API_BASE_URL=$ApiBaseUrl"

if ($LASTEXITCODE -ne 0) {
  Write-Error "InsForge MCP setup failed."
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "InsForge MCP setup complete." -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Restart Codex."
Write-Host "  2. Refresh the InsForge dashboard."
Write-Host "  3. Revoke the previous API key if you rotated it."
