# Atividade Final do Módulo 01

## O Caminho de Uma Requisição Web

Esta atividade reúne o que você praticou durante o módulo. Antes de começar, conclua:

1. [Identificando a Comunicação](01-identificando-a-comunicacao.md)
2. [Encontrando o Destino](02-encontrando-o-destino.md)
3. [Lendo Uma Troca HTTP](03-lendo-uma-troca-http.md)
4. [Separando Responsabilidades](04-separando-responsabilidades.md)
5. [Investigando Cache](05-investigando-cache.md)

## Cenário

Um tutor abre `app.petcareos.com.br` no celular e consulta o status de seu pet.

Você vai explicar o que acontece desde o endereço ser informado até o conteúdo aparecer na tela.

## Parte 1 — Organize o Caminho

Coloque as etapas abaixo na ordem correta:

- o browser interpreta o conteúdo recebido;
- o DNS ajuda a encontrar o endereço do destino;
- o servidor processa o pedido;
- o tutor informa a URL;
- o browser envia uma request HTTP;
- o servidor devolve uma response HTTP;
- a interface aparece na tela;

Depois de ordenar, acrescente ao seu fluxo uma observação explicando onde o cache pode evitar que um arquivo seja baixado novamente.

## Parte 2 — Explique Cada Participante

Complete:

| Participante ou conceito | O que faz nesse fluxo? |
| --- | --- |
| Tutor | |
| Browser | |
| DNS | |
| HTTP | |
| Servidor | |
| Frontend | |
| Backend | |
| Cache | |

## Parte 3 — Crie Seu Mapa

Transforme as respostas anteriores em um mapa simples. Você pode usar:

- uma lista numerada;
- caixas e setas em uma folha;
- um diagrama textual;
- uma ferramenta de desenho.

Seu mapa deve começar com o tutor acessando a URL e terminar com o status do pet aparecendo na tela.

## Parte 4 — Investigue Uma Falha

Escolha uma situação:

- o domínio não é encontrado;
- o servidor responde com erro;
- a página mostra conteúdo antigo;
- o browser recebe a resposta, mas a tela não aparece corretamente.

Indique:

1. em qual parte do caminho o problema pode estar;
2. qual conceito do módulo ajuda a explicar a falha;
3. o que você observaria primeiro para investigar.

## Corrija Sua Atividade Com IA

Depois de concluir a atividade, copie o prompt abaixo, substitua o campo indicado pela sua resposta e envie para uma IA:

```text
Estou concluindo um módulo introdutório sobre o caminho de uma requisição web.

Minha atividade usa este cenário: uma pessoa abre `app.petcareos.com.br` no celular para consultar o status de um pet.

Eu precisei:
1. ordenar o caminho desde a URL até a interface aparecer;
2. explicar onde o cache pode evitar um novo download;
3. explicar o papel de tutor, browser, DNS, HTTP, servidor, frontend, backend e cache;
4. representar o fluxo em um mapa;
5. relacionar uma falha a uma etapa e dizer o que investigaria primeiro.

Analise minha atividade usando estes critérios:
- a ordem do fluxo é tecnicamente coerente para uma explicação introdutória;
- os oito participantes ou conceitos têm papéis claros;
- o mapa começa no acesso à URL e termina na apresentação do conteúdo;
- o cache aparece em uma posição e com uma função coerentes;
- a falha escolhida foi relacionada a uma etapa possível do fluxo;
- a investigação proposta usa conceitos estudados, sem exigir conhecimentos avançados.

Organize a correção em:
1. pontos corretos;
2. pontos que precisam de revisão;
3. perguntas ou dicas para eu corrigir sozinho;
4. uma avaliação final: "pronto para avançar", "revisar alguns pontos" ou "refazer uma parte".

Não reescreva toda a atividade por mim e não apresente um modelo completo antes da minha nova tentativa. Só mostre uma resposta completa se eu pedir.

Minha atividade:
[COLE SUA RESPOSTA AQUI]
```

Guarde esta atividade. Nos próximos módulos, você poderá comparar esse mapa com as telas, o código e os servidores que aprenderá a construir.
