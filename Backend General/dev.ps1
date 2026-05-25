# Script rápido para desarrollo
Write-Host "🚀 Iniciando CriptoSelf..." -ForegroundColor Green

# Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { Set-Location '$PWD'; .\venv\Scripts\Activate.ps1; python manage.py runserver }"

# Esperar un poco
Start-Sleep 2

# Frontend  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { Set-Location '$PWD\frontent_oficial'; npm run dev }"

Write-Host "✅ Servidores iniciados!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:8000" -ForegroundColor Blue