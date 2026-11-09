# Roteiro de teste com pessoas

**Objetivo:** descobrir onde uma pessoa que nunca viu o jogo trava, o que ignora e onde desiste. O jogo foi medido a fundo com um bot, mas **nenhuma pessoa além do autor jogou**.

## Preparação (5 min)
1. Rode o jogo (`cd backend && npm install && npm start`, abra http://localhost:3000) ou publique-o numa máquina que a pessoa consiga abrir.
2. Peça para a pessoa **criar a própria conta e o próprio reino** (não faça isso por ela).
3. Em **Configurações**, ligue **"Gravar o registro de uso neste navegador"** (telemetria local; nada é enviado). Peça licença antes: o registro tem os painéis abertos, o tempo em cada um e os botões usados, sem nenhum texto digitado.
4. Quem conduz **não explica nada**. Só diga: *"Jogue como se eu não estivesse aqui e fale em voz alta o que está pensando."*

## Durante (45–60 min)
Anote, com horário, **sem ajudar**:
- Onde ela **trava** (olha parada, clica em vão, pergunta "e agora?").
- O que **ignora** (avisos, eventos pendentes, abas que nunca abre).
- O que **não entende** (palavras, números, ícones).
- Quando **sorri** ou **resmunga**.
Se ela travar por mais de 2 minutos, pergunte só: *"O que você esperava que acontecesse?"* e anote a resposta.

## Tarefas opcionais (se a pessoa não souber por onde ir)
1. "Faça o reino crescer." 2. "Descubra por que o povo está infeliz (ou feliz)." 3. "Resolva o próximo evento que aparecer." 4. "Escolha um modo de jogo (cenário, desafio, Sandbox)."

## Depois (10 min)
Perguntas, uma de cada vez, sem sugerir resposta:
1. O que você achou que era o objetivo do jogo?
2. Qual foi o momento mais divertido? E o mais chato?
3. Houve algo que você quis fazer e não achou como?
4. O que você mudaria primeiro?
5. Você jogaria de novo amanhã? Por quê?

## Coleta do registro
Em **Configurações → "Baixar registro (JSON)"**. O arquivo traz um **resumo** (painéis por tempo, botões mais usados, decisões pendentes máximas e o ponto de saída) e os eventos. Para a próxima pessoa, "Apagar registro".

## Como ler o registro
- **Tempo por painel:** painéis com muito tempo e poucas ações = leitura confusa; painéis nunca abertos = invisíveis ou irrelevantes.
- **Decisões pendentes máximas:** número alto e crescente = a pessoa ignora eventos.
- **Ponto de saída:** a última aba e a data do jogo mostram **onde ela desistiu**.
- **Cliques repetidos no mesmo botão** = não houve resposta clara.

## Quantas pessoas
Três a cinco, de perfis diferentes (quem joga muito, quem joga pouco, quem nunca jogou simulador). Depois da 3ª pessoa os mesmos problemas começam a se repetir: priorize o que aparece em duas ou mais.
