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

echo [1/2] Compilando o Launcher C# nativo...
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /out:Hisoka.exe launcher.cs

if %errorlevel% neq 0 (
    echo [ERRO] A compilacao do C# falhou!
    pause
    exit /b 1
)

echo [2/2] Configurando ambiente local...
:: Criar .env a partir de .env.example se .env nao existir na raiz
if not exist ".env" if exist ".env.example" (
    echo Criando o arquivo .env inicial na raiz...
    copy ".env.example" ".env" > nul
)

echo.
echo ===================================================
echo COMPILACAO CONCLUIDA COM SUCESSO!
echo ===================================================
echo O executavel foi gerado em: Hisoka.exe
echo.
echo Para ligar o Hisoka, basta executar o arquivo 'Hisoka.exe' na raiz.
echo Certifique-se de configurar o arquivo '.env' se necessario.
echo ===================================================
pause

