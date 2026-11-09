# Kings or Thrones — como o jogo funciona hoje

Este documento descreve o jogo **como ele está** (Etapa 71). Para o histórico de decisões e medições, veja `CHANGELOG.md`. Tudo aqui foi conferido no código ou em testes; quando algo é uma escolha de desenho **não calibrada com jogadores**, está marcado.

## Pilha
- **Servidor:** Node.js + Express + SQLite (`better-sqlite3`), em `backend/`. Migrações automáticas e não destrutivas.
- **Cliente:** JavaScript puro em `frontend/` (scripts clássicos, sem bundler). `kingdom.js` (~308 KB) mais módulos `painel-*.js` extraídos por análise de escopo (`backend/tools/extractPanel.js`).
- **Testes:** `npm test` (servidor, ~230 testes) e `npm run test:e2e` (navegador real, Chromium/puppeteer, ~60 testes).
- **Segurança de interface:** CSP fechada para `<style>`; o teste de navegador exige zero violações.

## Tempo
- Calendário de **400 dias por ano**, 12 meses a partir de março, 4 estações de 100 dias.
- **Eras** (calendário de 400 dias): 1 Fundação (dia 0), 2 Expansão (dia 2.800), 3 Potências (dia 8.000), 4 Grandes Crises (dia 14.400), 5 Magia (dia 32.800). A era escala o tamanho dos eventos (×1,0 a ×2,6) e a ameaça da IA.
- O jogador avança 1 a 30 dias por vez; as decisões e crises chegam como eventos.

## Economia
- **Ouro, comida, madeira, pedra, ferro e raros.** Teto base de ouro de **15.000** (armazéns aumentam outros recursos). Renda, despesa e saldo do detalhamento são **por dia**.
- **Construções:** 1.636 tipos, com níveis (10 a 20) e efeitos únicos no nível V. Cada tipo comporta em média **3,7 trabalhadores** (nível 1); a Casa Grande abriga 32 moradores.
- **Abas:** barras com 9 ou mais botões (`.category-filter`) mostram 6 + a ativa e agrupam o resto em "Mais (N)" (`frontend/js/abas-mais.js`). É só agrupamento; nada foi removido.
- **Crises por era:** 3 / 5 / 8 / 11 / 13 disponíveis nas eras 1 a 5 (a era 5 tem Invasão Planar e Ocaso da Magia; a 4 tem Tempestade Arcana, Colapso Comercial e Ascensão de um Império). O `minEra` das crises é escrito na escala antiga de 6 eras e remapeado (`ERA_MAP`). *(Efeitos não calibrados.)*
- **Auditoria de eventos por decisão:** as sobrescritas (`packs/<tema>.overrides.js`) valem em qualquer tema; um tema só ganha `audited: true` quando TODAS as decisões estão cobertas (mar, saúde). O povo está em auditoria parcial (15 de 28 decisões). `node tools/auditEventos.js --todos` mostra o andamento.
- **Resgate:** uma região perdida pode ser comprada de volta por 3× o custo de reivindicar (×1,5 em guerra com quem a tomou). *(Não calibrado.)* Mercenários já existem (qualquer unidade, sem quartel nem população, sobretaxa de ~2).
- **Perder terra:** nas eras 3 a 5, uma incursão sem tropas em casa pode tomar uma região de fronteira (8% × (era − 2) × dificuldade por incursão; teto 40%; o escudo de aliados reduz). Capital e cidades nunca são tomadas. Com tropas em casa vale a batalha (derrota decisiva também pode custar uma região). *(Não calibrado com jogadores.)*
- **Proteção de novato:** nos primeiros 120 dias a IA não declara guerra sozinha (o jogador pode declarar). Antes, ~23% dos reinos novos sofriam uma guerra em 45 dias, sem exército. `KOT_GRACE=0` desliga.
- **Comida e primeiros dias:** o reino nasce com 3.000 de comida e consome 0,45 por habitante por dia (~450), então **sem fazendas ela acaba em ~7 dias**. O jogo **projeta** os dias restantes e avisa quando restam 14 ou menos (urgente com 5 ou menos); na aba Construções há um atalho "Construir N fazendas" com a conta feita. Uma Fazenda de Trigo (24 de comida/dia, 4 trabalhadores, 80 de ouro + 40 de madeira, 1 dia) é o socorro básico.
- **Trabalhadores:** a capital e as cidades **distribuem sozinhas** os desempregados pelas vagas abertas (agricultura primeiro); a realocação manual continua disponível.
- **Fila de construção:** 4 vagas base + bônus de prédios (Oficina de Construção, Guilda dos Construtores) + **vagas extras alugadas com ouro** (até 8, 30 dias cada, preço 400 × n² na era 1, sobe 50% por era). Construtores: capacidade cresce com a população e as eras.
- **Administração:** custo diário por habitante acima de 3.000, que cresce com o tamanho e a era.
- **Programas do Reino:** festas, exército e obras públicas (≤ 40% cada, ≤ 70% no total da renda). O custo é `min(planejado, excedente)`: só gastam o que sobra; absorvem todo o excedente quando somam 70%.
- **Sorte do reino:** compensa desvios nos sorteios d100 (bônus −12 a +20 pontos; a média se mantém).

## População
- **Moradia:** a imigração afunila de 100% até a **tolerância de ocupação (padrão 1,05)** e zera; acima dela a população sobrante emigra devagar (0 a −0,2%/dia até 150%; depois, encolhimento forte). Sem-teto estrutural ≈ 4,8%. *(Escolha de desenho, medida em 12 anos; `KOT_OCC_TOL=1.15` restaura o antigo.)*
- **Inverno:** nos anos 1, 2 e 3 em diante o inverno aperta 50%, 75% e 100% (evita fome no primeiro inverno).
- **Emprego (gradual):** o efeito sobre felicidade (−10 a +3) e crescimento (−0,4 a +0,1) cresce de forma contínua com a taxa de ocupação, no máximo com **20% da população ocupada**. O desemprego fica em ~90% por desenho (poucos empregos por edifício); a interface chama isso de **mão de obra ociosa**, que é a reserva de exército, expedições e colonos. *(Não calibrado com jogadores.)*

## Política e mundo
- **19 governos**, ciclos de 80 dias (eleições, orçamento), gabinete, partidos, facções, legitimidade.
- **Reinos de IA** com governantes e pessoas nomeadas, objetivos, espionagem, suborno, recrutamento e coalizões.
- **Memória dos rivais:** guerra declarada, tratado rompido e sanção geram rancor; tratado, presente e ajuda geram gratidão (meia-vida de 200 dias). O saldo muda a agressão contra o jogador (×0,6 a ×1,6), a confiança exigida em tratados e a aceitação da paz; rivais com memória escrevem cartas (30 textos).
- **Tensão do meio e do fim:** a chance diária de a IA declarar guerra cresce com a **era** (×1,3 / ×1,8 / ×2,4 nas eras 3 a 5) e com o **domínio** do jogador sobre a IA mais forte (até ×1,5), e segue a **dificuldade** escolhida (tranquilo ×0,6, normal ×1, difícil ×1,4, brutal ×1,9, sandbox ×0,3). O dano das incursões sem tropas em casa acompanha a era (estabilidade até ×2) e o tamanho do reino (contado até 50 mil habitantes). Tratados, escudo de aliados e tropas reduzem o dano. `KOT_TENSION=0` desliga. Em simulação (economista, era 4) a tensão **base** drena o ouro mas **não ameaça** um reino passivo com tratados (estabilidade mínima 78); a dificuldade Difícil/Brutal é o botão para quem quer risco. *(Não calibrado com jogadores.)*

## Campanha e modos
- **Vitórias** (conquista, prosperidade, fé, conhecimento, legado, regime) e **derrotas** (colapso, extinção, capital tomada), marcos, crises e Grandes Obras (20).
- **Dificuldades:** tranquilo, normal, difícil, brutal e Sandbox (sem derrota). **Ironman:** opt-in nos primeiros 60 dias; trava a dificuldade, o fim é definitivo e a pontuação vale ×1,25.
- **Cenários e desafios** (4 + 2) com meta, prazo e prêmio. **Livro do Reinado** (crônica imprimível).

## Conteúdo narrativo
- **Eventos:** ~14,7 mil situações compostas de pacotes escritos à mão; automáticos e de decisão (com prévia de chance e efeito).
- **Botões dos eventos compostos:** o tema escreve a situação; os botões vêm de **textos neutros compartilhados**, exceto nos temas **auditados** (hoje o **mar** e a **saúde**), que usam rótulos, desfechos e falhas próprios por decisão. Os outros 14 temas aguardam auditoria (`backend/tools/auditEventos.js`).
- **39 arcos de história** (143 passos) com **diretor de ritmo**: um arco por vez, 200 dias entre inícios, o 1º a partir do dia 40. Depois de vistos todos, **reprises** a cada 600 dias (7 arcos de premissa única não voltam). Cada opção custa, arrisca ou compensa algo (regra verificada por teste).

## Interface
- **Menu:** "Hoje" + 5 pilares (Reino, Corte, Fé e Saber, Guerra e Diplomacia, Mundo), 26 entradas; três pares fundidos por seletor de seção.
- Conselheiros por pilar, explicações de cada número, mapa em SVG (modo canvas rápido opcional, sem camadas), 43 ícones SVG (recursos, pilares e os 29 itens do menu) nos recursos e no menu (o resto usa emoji), tema claro e escuro, tela para celular.
- **Telemetria local opcional** (Configurações): grava no navegador, nada é enviado; ver `PLAYTEST.md`.

## Ferramentas de desenvolvimento (`backend/tools/`)
- `simulate.js` + `bot.js`: simulador de partidas (perfis economista, militarista, equilibrado…). **O bot não mede diversão e compensa a felicidade**; serve para achar defeitos, não para calibrar.
- `extractPanel.js` (extração de módulos com análise de escopo), `lintContent.js` (gramática do conteúdo), `analisaRodada.py` e `analisaMatriz.py`.

## Interruptores de ambiente (experimentos)
`KOT_OCC_TOL`, `KOT_UNEMP` (`step`/`solved`), `KOT_TENSION=0`, `KOT_RIVALS_EFFECT=0`, `KOT_ARC_DIRECTOR=0`, `KOT_ARC_REPRISE=0`, `KOT_LUCK=0`, `KOT_ADMIN=0`, `KOT_WINTER_RAMP=0`, `KOT_GROWTH_CAP=0`, `KOT_BUILDER_SCALE=0`, `KOT_PROGRAMS=0`; do bot: `KOT_BOT_EVOLVE`, `KOT_BOT_EVOLVE_SLOTS`, `KOT_BOT_SPEND`, `KOT_BOT_PROGRAMS`, `KOT_BOT_PROG_MAX`.

## O que ainda não se sabe
Nenhuma pessoa além do autor jogou o jogo. Todos os parâmetros marcados como "não calibrado" (tolerância de ocupação, curva de emprego, tensão, ×1,25 do Ironman, cadência dos arcos, pesos da memória) precisam de teste com jogadores.

## Cidades com profundidade (Etapa 91)
Cada cidade (menos a capital) tem **vocação** (escolhida nos cartões de subida de nível), **lealdade à coroa** (com petições, recusa de tributo, motim e **independência**), **Foral**, **governador com personalidade** (31 traços), **defesa** (guarnição, muralhas, ataques e a perda rara por ocupação) e eventos por vocação e terreno. A janela da cidade tem as abas **Governo** e **Defesa** e um aviso de estado. Uma cidade independente ou ocupada **não aceita ordens** até ser reconquistada, comprada de volta ou aceita como vassala. Código: `backend/game/cityDepth.js` e `cityContent.js`; testes: `tests/cidades-profundas.test.js` e o teste de navegador "Etapa 91".

## Criação do reino com identidade (Etapa 92)
O assistente tem 6 passos (identidade, bandeira, governo, **povo**, território, fundação). **Origem** (6), **passado** do governante (4), **tradição** (4), **traços** (até 2 dos 31) e **fé inicial** (nome + 2 princípios) são opcionais e mudam o ponto de partida, com bônus e custo escritos. A origem agenda um **arco de abertura** (8º dia). **Heráldica:** dinastia, lema e bandeira de duas cores. Reinos prontos e sorteio no passo 1. Código: `backend/game/originCatalog.js`, `originSetup.js` e `packs/arcos6.js`; testes: `tests/criacao-reino.test.js` e o teste de navegador "Etapa 92".

## Fim de jogo das cidades (Etapa 93)
Uma cidade (menos a capital) de nível 3 ou mais pode ser declarada **livre e aliada**: sem tributo, sem rebelião, sem controle, com dividendo de 2% do ouro a cada 30 dias; só se volta atrás pagando a reintegração. A campanha ganhou as métricas `metropolises`, `freeCities` e `cityLoyalty`, os marcos "Ter 1 Metrópole" e "Ter 3 Metrópoles" e a vitória **Rede de Metrópoles**. **Mudar a capital de lugar não foi implementado** (ver `CHANGELOG.md`, Etapa 93). Testes: `tests/fim-de-jogo-cidades.test.js` e o teste de navegador "Etapa 93".

## Fluxo de recursos na rede de cidades (Etapa 94)
A Cidade-Forja produz ferro e pedra, a Universitária produz cristais, e a guarnição consome comida e ouro: as cidades passam a ter **produção e demanda diferentes**. O painel Cidades mostra o **balanço por cidade**, os **gargalos** (o que acaba em menos de 90 dias) e **rotas sugeridas** de um clique. As rotas continuam sendo as de `city_trade_routes`. Código: `cityDepth.js` (`extraNet`, `flows`); testes: `tests/fluxos-rede.test.js` e o teste de navegador "Etapa 94".

## Arcos de cidade (Etapa 95)
Cada cidade pode viver **um arco de 3 passos por vocação** (porto, mina, fronteira, cidade santa, celeiro, universidade), além dos dois arcos gerais (a capital ambiciosa e o governador que some com o tesouro). Um arco por vez por cidade, cada um uma única vez; os passos seguintes são agendados 20 dias depois. Código: `cityContent.js` (`ARC`, `ARC_STARTS`) e `cityDepth.startArcs`; testes: `tests/arcos-cidade.test.js`.

## Mudar a capital de lugar (Etapa 96)
Uma cidade de nível 4 ou mais, leal (60%+), pode virar a capital: a capital atual vira uma cidade do reino. É uma **troca de papéis em uma transação com invariantes** (edifícios por tipo, população, estoques e "exatamente uma capital" precisam bater, senão tudo é desfeito). Custa ouro, causa um choque e só repete a cada 10 anos. Código: `backend/game/capitalMove.js`; testes: `tests/mudanca-capital.test.js` e o teste de navegador "Etapa 96".

