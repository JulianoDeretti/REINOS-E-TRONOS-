@echo off
rem Kings or Thrones - iniciar (Windows). Basta dar dois cliques neste arquivo.
cd /d "%~dp0backend"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado. Instale a versao LTS em https://nodejs.org e de dois cliques neste arquivo de novo.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Instalando o jogo - so na primeira vez, cerca de 1 minuto...
  call npm install --omit=dev --no-audit --no-fund
  if errorlevel 1 (
    echo A instalacao falhou. Mande esta tela para quem te enviou o jogo.
    pause
    exit /b 1
  )
)
echo.
echo O jogo vai abrir em http://localhost:3000
echo Para PARAR o jogo, feche esta janela.
echo.
start "" cmd /c "timeout /t 3 >nul & start http://localhost:3000"
node server.js
pause
