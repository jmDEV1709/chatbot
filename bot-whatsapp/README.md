# Bot WhatsApp

Bot simples em Node.js usando Baileys.

## Hospedagem

Este bot foi pensado para rodar em uma **Hetzner VPS**. Ele não foi preparado para hospedagem compartilhada, porque precisa manter um processo Node.js ativo o tempo todo para preservar a conexão com o WhatsApp.

### Deploy na Hetzner VPS

1. Suba uma VPS com Ubuntu 22.04 ou similar.
2. Instale Node.js LTS e `npm`.
3. Envie este projeto para a VPS.
4. Execute `npm install`.
5. Inicie com `npm start` para gerar o QR Code.
6. Escaneie o QR Code com o WhatsApp do número do bot.
7. Depois que estiver autenticado, use PM2 para manter o bot ativo em segundo plano.

## Gemini

O comando ,ia usa a API do Gemini. Defina a variável de ambiente GEMINI_API_KEY antes de iniciar o bot. Se quiser trocar o modelo, use GEMINI_MODEL.

Se a API retornar erro, confira se a chave é uma API key válida do Gemini/Google AI Studio e se o modelo informado existe para essa chave.

Para rodar localmente, coloque a chave em um arquivo `.env` na raiz do projeto:

```env
GEMINI_API_KEY=sua_chave_aqui
GEMINI_MODEL=gemini-2.0-flash
```

A chave vai na linha `GEMINI_API_KEY=` do arquivo `.env`.

O arquivo `.env` já fica ignorado pelo Git.

## Como testar

1. Instale as dependências:

```bash
npm install
```

2. Inicie o bot:

```bash
npm start
```

3. Escaneie o QR Code que aparecer no terminal com o WhatsApp.

4. Adicione o número do bot em um grupo e teste os comandos:

```text
,menu
,ia
,imagem
,sticker
```