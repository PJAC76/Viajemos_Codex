Write-Host ""
Write-Host "InsForge MCP local repo hints" -ForegroundColor Cyan
Write-Host ""

if (Test-Path "AGENTS.md") {
  Write-Host "AGENTS.md detected in project root." -ForegroundColor Green
} else {
  Write-Host "AGENTS.md not found in project root." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "To verify MCP end-to-end from Codex, use:"
Write-Host "  I'm using InsForge as my backend platform, call InsForge MCP's fetch-docs tool to learn about InsForge instructions."
Write-Host ""
Write-Host "To rotate the API key, re-run:"
Write-Host "  npm run insforge:connect -- -ApiKey <NEW_KEY> -ApiBaseUrl <YOUR_BASE_URL>"
