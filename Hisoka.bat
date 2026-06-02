@echo off
if "%1"=="hidden" (
    cd /d "%~dp0."
    powershell -Command "$port = 5000; if (Test-Path .env) { Get-Content .env | ForEach-Object { if ($_ -match '^FLASK_PORT\s*=\s*(.*)$') { $port = $Matches[1].Trim() } } }; $py = Start-Process -FilePath '.venv\Scripts\python.exe' -ArgumentList 'app.py' -NoNewWindow -PassThru; Start-Sleep -Seconds 2; $browser = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe' -ErrorAction SilentlyContinue).'(default)'; if (!$browser -or !(Test-Path $browser)) { $browser = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe' -ErrorAction SilentlyContinue).'(default)' }; if (!$browser -or !(Test-Path $browser)) { $browser = 'msedge.exe' }; $edgeArgs = @('--app=http://127.0.0.1:' + $port, '--user-data-dir=' + $env:TEMP + '\HisokaEdgeProfile'); Start-Process -FilePath $browser -ArgumentList $edgeArgs -Wait; try { Stop-Process -Id $py.Id -Force } catch {}"
    exit /b
)

start "" /min powershell -WindowStyle Hidden -Command "Start-Process -FilePath '%~f0' -ArgumentList 'hidden' -WindowStyle Hidden"
exit /b
