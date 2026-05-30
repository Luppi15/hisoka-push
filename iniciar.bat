@echo off
title Servidor Hisoka Push V2
echo ===================================================
echo Iniciando o servidor Hisoka Push V2...
echo ===================================================

:: Aguarda 2 segundos em segundo plano antes de abrir o navegador
:: para garantir que o Flask teve tempo de iniciar.
start /b cmd /c "timeout /t 2 >nul && start http://127.0.0.1:5000"

:: Executa o aplicativo usando o Python do ambiente virtual
.venv\Scripts\python.exe app.py

pause
