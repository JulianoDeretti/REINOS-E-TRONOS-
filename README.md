# Kings or Thrones

Simulador de reinos e civilizações medievais (Portugal medieval como ponto de partida): economia, população, política, diplomacia com IA que lembra o que você faz, eventos e arcos de história, campanha de 82 anos em cinco eras.

- **Como o jogo funciona hoje:** [`DESIGN.md`](DESIGN.md)
- **Histórico das etapas, decisões e medições:** [`CHANGELOG.md`](CHANGELOG.md)
- **Testar com pessoas:** [`PLAYTEST.md`](PLAYTEST.md)

## Como rodar
Requer **Node.js 18+**.

```bash
cd backend
npm install
npm start          # http://localhost:3000
npm test           # testes do servidor
npm run test:e2e   # testes no navegador (Chromium/puppeteer)
```

O banco é um SQLite em `backend/data/kings-or-thrones.sqlite`, criado na primeira execução. Saves de etapas anteriores continuam funcionando (migrações automáticas e não destrutivas).

## Estado
O projeto tem **mais de 250 testes de servidor e ~65 de navegador**. **Nenhuma pessoa além do autor jogou ainda**: os parâmetros de desenho marcados como "não calibrado" em `DESIGN.md` precisam de teste com jogadores (veja `PLAYTEST.md`).

## Teste com pessoas
Há um pacote enxuto para enviar a testadores (`kings-or-thrones-teste.zip`: 1,5 MB, sem o Chromium nem as ferramentas de teste, com `iniciar.bat` / `iniciar.sh`, `COMO-JOGAR.md` e `PARA-QUEM-APLICA-O-TESTE.md`). Veja o `CHANGELOG.md` (Etapa 86).
