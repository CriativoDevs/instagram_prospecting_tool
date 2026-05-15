# TimelyOne — Instagram Prospecting Tool

Ferramenta local estratégica para identificar e contactar potenciais parceiros de negócio no mercado de beleza e bem-estar através do Instagram.

## Funcionalidades

- **Pesquisa por Nicho**: Catálogo de hashtags pré-definidas por categoria — escolhe o nicho e clica na hashtag.
- **Nichos suportados**: Barbearia · Cabelo & Salão · Estética · Unhas · Spa & Bem-estar · Tatuagem
- **Filtros configuráveis**: Range de seguidores e mínimo de posts ajustáveis com sliders. Presets rápidos (Micro, Pequeno, Médio). Filtros guardados automaticamente entre sessões.
- **Badge de Qualidade**: Perfis classificados como `IDEAL` ou `OK` com base nos filtros activos.
- **Gerador de DM**: Mensagem personalizada por tipo de negócio (barbearia, tatuagem, spa, etc.) gerada com 1 clique.
- **Tracking**: Histórico de perfis contactados e estado de conversão.
- **Exportação**: Exportação de dados para CSV.

## Stack

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Estilo**: Tailwind CSS
- **Dados reais**: Apify (Instagram Hashtag Scraper + Profile Scraper)
- **Persistência**: LocalStorage

## Instalação

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente — crie o ficheiro `.env.local` na raiz:
   ```env
   APIFY_API_TOKEN=o_teu_token_aqui
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
   > Para obter o token: [apify.com](https://apify.com) → Settings → Integrations → Personal API tokens

3. Inicie o servidor:
   ```bash
   npm run dev
   ```

4. Abra [http://localhost:3000](http://localhost:3000).

## Como usar

1. Acede a **Pesquisa por Hashtag**
2. Clica num nicho (ex: 💈 Barbearia)
3. Seleciona uma hashtag do catálogo ou escreve a tua própria
4. Opcional: abre **Filtros** e ajusta o range de seguidores e posts mínimos
5. Clica **Pesquisar**
6. Para cada perfil relevante, clica **Gerar DM** → copia a mensagem → envia manualmente no Instagram
7. Clica **Marcar como enviada** para registar no histórico

## Sem token Apify

A ferramenta funciona em modo **Mock** com dados simulados — útil para testar a interface sem gastar créditos. O banner no topo da pesquisa indica sempre se os dados são reais ou simulados.

## Notas

- Esta ferramenta **nunca** envia mensagens automaticamente. Todos os contactos são feitos manualmente.
- Desenhada para uso local — o token Apify nunca é exposto ao browser.
- Créditos Apify: plano gratuito inclui $5/mês, suficiente para dezenas de pesquisas.

---
Desenvolvido para TimelyOne.
