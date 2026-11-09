#!/bin/bash
# Kings or Thrones — iniciar (Mac e Linux). Uso: ./iniciar.sh   (ou ./iniciar.sh --sem-navegador)
cd "$(dirname "$0")/backend" || exit 1
if ! command -v node >/dev/null 2>&1; then echo "Node.js nao encontrado. Instale a versao LTS em https://nodejs.org e rode de novo."; exit 1; fi
V=$(node -p "process.versions.node.split('.')[0]")
if [ "$V" -lt 20 ]; then echo "Seu Node.js (versao $V) e antigo. Instale a versao LTS (20 ou mais) em https://nodejs.org e rode de novo."; exit 1; fi
if [ ! -d node_modules ]; then echo "Instalando o jogo (so na primeira vez, cerca de 1 minuto)..."; npm install --omit=dev --no-audit --no-fund || { echo "A instalacao falhou. Mande esta tela para quem te enviou o jogo."; exit 1; }; fi
PORT=${PORT:-3000}; URL="http://localhost:$PORT"
echo ""; echo "O jogo vai abrir em $URL"; echo "Para PARAR o jogo, feche esta janela (ou aperte Ctrl+C)."; echo ""
if [ "$1" != "--sem-navegador" ]; then ( sleep 3; ( xdg-open "$URL" || open "$URL" ) >/dev/null 2>&1 & ) ; fi
PORT=$PORT exec node server.js
