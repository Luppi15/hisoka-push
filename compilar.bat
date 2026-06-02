@echo off
echo ===================================================
echo   Compilando o Hisoka Push V2 para Executavel
echo ===================================================

:: Verificar se o ambiente virtual existe
if not exist ".venv" (
    echo [ERRO] O ambiente virtual .venv nao foi encontrado.
    echo Crie o ambiente virtual e instale os pacotes antes de compilar.
    pause
    exit /b 1
)

echo [1/3] Compilando o Launcher C# nativo...
if not exist "dist" mkdir "dist"
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /out:dist\Hisoka.exe launcher.cs

if %errorlevel% neq 0 (
    echo [ERRO] A compilacao do C# falhou!
    pause
    exit /b 1
)

echo [2/3] Configurando ambiente na pasta dist...
if not exist "dist" mkdir "dist"

:: Copiar .env ou .env.example para a pasta dist se dist\.env nao existir
if not exist "dist\.env" if exist ".env" (
    echo Copiando o arquivo .env atual para a pasta dist...
    copy ".env" "dist\.env" > nul
)
if not exist "dist\.env" if not exist ".env" if exist ".env.example" (
    echo Copiando .env.example para a pasta dist...
    copy ".env.example" "dist\.env" > nul
)

echo.
echo ===================================================
echo [3/3] COMPILACAO CONCLUIDA COM SUCESSO!
echo ===================================================
echo O executavel foi gerado em: dist\Hisoka.exe
echo.
echo Para ligar o Hisoka, basta executar o arquivo 'dist\Hisoka.exe'
echo Certifique-se de configurar o arquivo 'dist\.env' se necessario.
echo ===================================================
pause
