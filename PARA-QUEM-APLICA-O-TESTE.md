# Para quem aplica o teste

**Objetivo:** descobrir onde uma pessoa que nunca viu o jogo **trava, ignora ou desiste**. O jogo foi medido a fundo com um bot, mas **nenhuma pessoa além do autor jogou**. Os parâmetros marcados como "não calibrado" em `DESIGN.md` (se existir) dependem desta observação.

## Antes
1. Escolha **3 a 5 pessoas de perfis diferentes**: quem joga muito, quem joga pouco, quem nunca jogou simulador. Depois da 3ª pessoa os problemas começam a se repetir; priorize o que aparece em **duas ou mais**.
2. Mande a pasta e o `COMO-JOGAR.md`, **ou** acompanhe a pessoa (vídeo ou presencial) e peça que ela rode o `iniciar.bat` / `iniciar.sh` sozinha.
3. Peça para ela **criar a própria conta e o próprio reino**. **Não faça isso por ela.**
4. **Não explique nada.** Só diga: *"Jogue como se eu não estivesse aqui e fale em voz alta o que está pensando."*

## Durante (45 a 60 min)
Anote, com horário, **sem ajudar**:
- Onde ela **trava** (olha parada, clica em vão, pergunta "e agora?").
- O que **ignora** (avisos, eventos pendentes, abas que nunca abre).
- O que **não entende** (palavras, números, ícones).
- Quando **sorri** ou **resmunga**.
Se travar por mais de 2 minutos, pergunte só: *"O que você esperava que acontecesse?"* e anote a resposta.

## Depois (10 min)
Faça as 5 perguntas do `COMO-JOGAR.md`, **uma de cada vez**, sem sugerir resposta.

## Coleta do registro (opcional)
Se a pessoa ligou o registro, peça o arquivo JSON (Configurações → "Baixar registro (JSON)"). Ele traz um **resumo** (painéis por tempo, botões mais usados, decisões pendentes máximas, ponto de saída) e os eventos. **Nada é enviado automaticamente.**

## Como ler o registro
- **Tempo por painel:** muito tempo e poucas ações = leitura confusa; painéis nunca abertos = invisíveis ou irrelevantes.
- **Decisões pendentes máximas:** número alto e crescente = a pessoa ignora eventos.
- **Ponto de saída:** a última aba e a data do jogo mostram **onde ela desistiu**.
- **Cliques repetidos no mesmo botão** = não houve resposta clara.

## O que me mandar
Suas anotações, os JSONs e as respostas das 5 perguntas. Com isso eu priorizo o que mexer (sub-abas, calibração da tensão, do emprego e do resgate, e o início do jogo).
