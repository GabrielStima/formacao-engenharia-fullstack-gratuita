# Exercício 05 — Investigando Cache

Faça este exercício depois da aula [Cache HTTP](../01.08-cache-http.md).

## Cenário

O portal do tutor usa o arquivo `portal.css` para definir as cores da interface.

Na segunda-feira, a equipe mudou a cor do status "Em atendimento" de azul para
verde. Mesmo assim, alguns tutores continuam vendo a cor antiga.

Você não precisa escrever código. O objetivo é raciocinar sobre onde o problema
pode estar.

## Sua Tarefa

Analise as três situações:

| Situação | O que aconteceu |
| --- | --- |
| Primeira visita | O browser baixou `portal.css` do servidor. |
| Segunda visita | O browser reutilizou uma versão guardada de `portal.css`. |
| Depois da mudança | Alguns usuários ainda veem a cor antiga. |

Responda:

1. Em qual situação o cache ajudou?
2. Em qual situação o cache pode ter atrapalhado?
3. O problema parece estar necessariamente no frontend? Por quê?
4. O problema parece estar necessariamente no servidor? Por quê?
5. Que pergunta você faria antes de concluir a causa?
6. O que você observaria primeiro na aba Network do DevTools?

Depois, classifique cada hipótese:

| Hipótese | Cache, servidor ou frontend? | Por quê? |
| --- | --- | --- |
| O browser está reutilizando `portal.css` antigo. | | |
| O servidor ainda está entregando o arquivo antigo. | | |
| O HTML aponta para o nome errado do arquivo CSS. | | |
| A nova regra CSS existe, mas outra regra visual está vencendo. | | |

## Corrija Sua Atividade Com IA

Depois de concluir a atividade, copie o prompt abaixo, substitua o campo indicado
pela sua resposta e envie para uma IA:

```text
Estou estudando cache HTTP em um módulo introdutório sobre Internet e Web.

Resolvi um exercício com este cenário:
- o portal usa `portal.css`;
- na primeira visita, o browser baixou o arquivo;
- na segunda visita, o browser reutilizou uma versão guardada;
- depois de uma mudança visual, alguns usuários ainda veem a cor antiga.

Minha tarefa foi identificar quando o cache ajudou, quando pode ter atrapalhado,
se o problema precisa estar no frontend ou no servidor, quais perguntas eu faria
antes de concluir a causa e o que observaria primeiro na aba Network.

Também classifiquei estas hipóteses:
1. browser reutilizando `portal.css` antigo;
2. servidor entregando arquivo antigo;
3. HTML apontando para o nome errado do CSS;
4. regra CSS nova existindo, mas perdendo para outra regra.

Analise minha resposta usando estes critérios:
- cache foi tratado como possível causa, não como certeza automática;
- servidor e frontend foram considerados como hipóteses diferentes;
- a aba Network foi usada para observar request, response, status e origem do recurso;
- a explicação evita conclusões precipitadas;
- a classificação das hipóteses está coerente.

Primeiro, aponte o que está correto. Depois, indique imprecisões sem entregar uma
resposta completa. Para cada problema, dê uma dica e permita que eu tente corrigir.
Só apresente uma resposta completa se eu pedir.

Minha resposta:
[COLE SUA RESPOSTA AQUI]
```
