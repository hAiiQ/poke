@echo off
setlocal
title PokeCase Local Server

cd /d "%~dp0"

where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo Node.js beziehungsweise npm wurde nicht gefunden.
  echo Bitte installiere zuerst Node.js und starte diese Datei danach erneut.
  pause
  exit /b 1
)

powershell.exe -NoProfile -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5173' -UseBasicParsing -TimeoutSec 2; if ($response.StatusCode -eq 200) { exit 0 } } catch { exit 1 }"
if not errorlevel 1 (
  echo PokeCase laeuft bereits.
  start "" "http://localhost:5173/#cases"
  exit /b 0
)

if not exist "node_modules\" (
  echo Abhaengigkeiten werden installiert...
  call npm.cmd install
  if errorlevel 1 (
    echo Installation fehlgeschlagen.
    pause
    exit /b 1
  )
)

echo PokeCase wird gestartet...
echo Das Fenster muss geoeffnet bleiben, solange die Seite laufen soll.
echo.

start "" powershell.exe -NoProfile -WindowStyle Hidden -Command "$url = 'http://localhost:5173/#cases'; for ($i = 0; $i -lt 40; $i++) { try { $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 1; if ($response.StatusCode -eq 200) { Start-Process $url; break } } catch {}; Start-Sleep -Milliseconds 500 }"

call npm.cmd run dev -- --host 0.0.0.0 --port 5173

echo.
echo Der PokeCase Server wurde beendet.
pause
