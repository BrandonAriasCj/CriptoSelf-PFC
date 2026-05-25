@echo off
color 1F
title Backend General -- CriptoSelf
cd /d "%~dp0Backend General"
echo.
echo  ================================================
echo    BACKEND GENERAL  --  http://localhost:8000
echo  ================================================
echo.
"venv\Scripts\python.exe" manage.py runserver 0.0.0.0:8000
pause
