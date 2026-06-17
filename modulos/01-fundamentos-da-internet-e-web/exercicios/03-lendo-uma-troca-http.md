# Exercício 03 — Lendo Trocas HTTP

Faça este exercício depois da aula [HTTP](../01.07-http.md).

## Cenário

O portal do tutor precisa carregar informações, lidar com erro de página não
encontrada, autenticar uma pessoa e registrar uma ação simples.

Você verá quatro trocas HTTP pequenas. O objetivo não é decorar todos os códigos,
mas identificar método, path, status, headers e body.

## Troca 1 — GET Bem-Sucedido

O browser pediu ao servidor a página de acompanhamento de um pet:

```text
GET /pets/123/status HTTP/1.1
Host: app.petcareos.com.br
```

O servidor respondeu:

```text
HTTP/1.1 200 OK
Content-Type: text/html

<h1>Status: Em atendimento</h1>
```

## Troca 2 — Página Não Encontrada

O browser pediu um caminho que não existe:

```text
GET /pets/999/status HTTP/1.1
Host: app.petcareos.com.br
```

O servidor respondeu:

```text
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "erro": "Pet não encontrado"
}
```

## Troca 3 — Login Sem Credencial Válida

O browser tentou enviar dados de login:

```text
POST /login HTTP/1.1
Host: app.petcareos.com.br
Content-Type: application/json

{
  "email": "tutora@example.com",
  "senha": "incorreta"
}
```

O servidor respondeu:

```text
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "erro": "Credenciais inválidas"
}
```

## Troca 4 — Registro Criado

O browser enviou uma solicitação de atualização de status:

```text
POST /pets/123/atualizacoes HTTP/1.1
Host: app.petcareos.com.br
Content-Type: application/json
Authorization: Bearer token-exemplo

{
  "mensagem": "Tutor visualizou o status"
}
```

O servidor respondeu:

```text
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "upd_456",
  "status": "registrado"
}
```

## Sua Tarefa

Para cada troca, preencha:

| Troca | Método | Path | Status | Família do status | Header principal | Existe body? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |

Depois, responda:

1. Qual troca representa sucesso simples?
2. Qual troca representa recurso não encontrado?
3. Qual troca representa falha de autenticação?
4. Qual troca representa criação de algo novo?
5. Em quais trocas existe body na request?
6. Em quais trocas existe body na response?
7. O browser recebeu uma tela pronta ou conteúdo que ainda precisa interpretar?

## Corrija Sua Atividade Com IA

Depois de concluir a atividade, copie o prompt abaixo, substitua o campo indicado
pela sua resposta e envie para uma IA:

```text
Estou estudando a estrutura básica de trocas HTTP.

Analisei quatro trocas:
1. GET /pets/123/status -> 200 OK com Content-Type: text/html
2. GET /pets/999/status -> 404 Not Found com Content-Type: application/json
3. POST /login -> 401 Unauthorized com Content-Type: application/json
4. POST /pets/123/atualizacoes -> 201 Created com Content-Type: application/json

Minha tarefa foi identificar método, path, status, família do status, header
principal e presença de body na request e na response. Também expliquei quais
trocas representam sucesso, erro de cliente, falha de autenticação e criação de
recurso.

Analise minha resposta usando estes critérios:
- método e path foram identificados corretamente;
- status e família do status foram classificados corretamente;
- headers e bodies foram diferenciados;
- 200 foi interpretado como sucesso;
- 201 foi interpretado como criação;
- 401 foi interpretado como falha de autenticação;
- 404 foi interpretado como recurso não encontrado;
- foi reconhecido que o browser ainda precisa interpretar HTML ou JSON recebido.

Primeiro, aponte o que está correto. Depois, indique erros ou partes imprecisas
sem reescrever toda a atividade por mim. Para cada problema, dê uma dica e
permita que eu tente corrigir. Só apresente uma resposta completa se eu pedir.

Minha resposta:
[COLE SUA RESPOSTA AQUI]
```
