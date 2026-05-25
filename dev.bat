@echo off
:: Wrapper para dev.ps1
:: Uso:  dev          -> arranca backend + usuario + empresa
::       dev stop     -> detiene todo
::       dev status   -> muestra que esta arriba
set "ACTION=%~1"
if "%ACTION%"=="" set "ACTION=start"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0dev.ps1" -Action %ACTION%
