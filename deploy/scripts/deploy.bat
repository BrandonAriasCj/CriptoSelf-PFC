@echo off
:: Wrapper para deploy.ps1
:: Uso: deploy.bat [up|prepare|stack|dns|build|services|verify|status|down]
set "ACTION=%~1"
if "%ACTION%"=="" set "ACTION=help"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy.ps1" %*
