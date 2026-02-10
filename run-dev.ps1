# Script para rodar dev sem prompts interativos
$ErrorActionPreference = "SilentlyContinue"

# Matar todos os node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Mudar para diretório e executar
Set-Location "e:\eventos-booking-hub"
npm run dev:all
