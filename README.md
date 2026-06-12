# TimelyOne — Instagram Prospecting Tool

Ferramenta estratégica para identificar e contactar potenciais parceiros de negócio no mercado de beleza e bem-estar através do Instagram.

## Funcionalidades

- **Pesquisa por Nicho**: Catálogo de hashtags pré-definidas por categoria — escolhe o nicho e clica na hashtag.
- **Nichos suportados**: Barbearia · Cabelo & Salão · Estética · Unhas · Spa & Bem-estar · Tatuagem
- **Filtros configuráveis**: Range de seguidores e mínimo de posts ajustáveis. Presets rápidos (Micro, Pequeno, Médio). Filtros guardados automaticamente entre sessões.
- **Pesquisa Geográfica**: Modo geo que combina hashtag de nicho com localização (ex: `barbearia` + `lisboa`).
- **Badge de Qualidade**: Perfis classificados como `IDEAL` ou `OK` com base nos filtros activos. Perfis fora dos critérios podem ser consultados via toggle "Mostrar".
- **Extensão Chrome**: Envio automático de DMs via browser — abre o Instagram, escreve e envia a mensagem sem intervenção manual.
- **Gerador de DM**: Mensagem personalizada por tipo de negócio gerada com 1 clique, editável antes do envio.
- **Histórico & Funil**: Registo de todos os contactos com estados `Enviada → Respondeu → Converteu / Recusou`.
- **Métricas**: Taxa de resposta, conversões e recusas no dashboard e no histórico.
- **Exportação**: Exportação do histórico para CSV com todas as datas e estados.
- **PWA**: Funciona como app instalável em mobile com layout de cards adaptado.

## Stack

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Estilo**: Tailwind CSS
- **Dados reais**: Apify (Instagram Hashtag Scraper + Profile Scraper)
- **Persistência**: Upstash Redis
- **Extensão**: Chrome Extension Manifest V3

## Instalação

1. Instala as dependências:
   ```bash
   npm install
   ```

2. Configura as variáveis de ambiente — cria o ficheiro `.env.local` na raiz:
   ```env
   APIFY_API_TOKEN=          # token da conta Apify
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   UPSTASH_REDIS_REST_URL=   # endpoint Upstash Redis
   UPSTASH_REDIS_REST_TOKEN= # token Upstash Redis
   ```

3. Inicia o servidor:
   ```bash
   npm run dev
   ```

4. Abre [http://localhost:3000](http://localhost:3000).

## Extensão Chrome

A extensão automatiza o envio de DMs no Instagram em background.

### Instalação

1. Abre `chrome://extensions`
2. Activa **Modo de programador**
3. Clica **Carregar sem compactação** e selecciona a pasta `chrome-extension/`

### Distribuição para outros utilizadores

Comprime a pasta `chrome-extension/` num ZIP e envia. O destinatário descomprime e segue os mesmos passos acima.

### Como usar

1. Com a extensão instalada, clica **Enviar DM** no card de um perfil
2. A extensão abre o Instagram, navega para o perfil e envia a mensagem automaticamente
3. O status do prospect actualiza para "Enviada" após confirmação

### URL da app (produção vs. dev)

Por padrão a extensão aponta para `https://instagram-prospecting-tool.vercel.app`.

Para usar em dev local, no console do **Service Worker** da extensão (`chrome://extensions` → Service Worker):
```javascript
// Activar localhost
chrome.storage.local.set({ appUrl: "http://localhost:3000" })

// Voltar a produção
chrome.storage.local.remove("appUrl")
```

### Debug

Abre o **Service Worker** em `chrome://extensions` e corre no console:

```javascript
// Ver estado actual
chrome.storage.local.get(null, console.log)

// Verificar se o alarm está registado (deve ter "dm-queue-poll")
chrome.alarms.getAll(console.log)

// Recriar o alarm se estiver vazio
chrome.alarms.create("dm-queue-poll", { periodInMinutes: 1 })

// Forçar verificação da fila
processQueue()

// Desbloquear se estiver travado
isSending = false
processQueue()
```

## Sem token Apify

A ferramenta funciona em modo **Mock** com dados simulados — útil para testar a interface sem gastar créditos. O banner no topo da pesquisa indica sempre se os dados são reais ou simulados.

## Notas

- A extensão respeita um intervalo aleatório de 45–90 segundos entre envios e um limite de 50 DMs por dia.
- O token Apify nunca é exposto ao browser — todas as chamadas passam pela API route do servidor.
- Créditos Apify: plano gratuito inclui $5/mês. Cada pesquisa de 50 perfis custa ~$0.13.

---
Desenvolvido para TimelyOne.
