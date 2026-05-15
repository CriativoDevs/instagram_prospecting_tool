# TimelyOne — Instagram Prospecting Tool

## Contexto
Preciso de uma aplicação local (Next.js 14 com App Router) 
que me ajude a prospectar salões e negócios de beleza no 
Instagram por hashtag, analisar os perfis e gerar DMs 
personalizadas para cada um. O envio da DM é SEMPRE manual 
— a app apenas gera o texto e abre o perfil no browser.

---

## Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui (componentes)
- Node.js >= 18

---

## Funcionalidades

### 1. Pesquisa por hashtag
- Input para inserir uma hashtag (ex: cabeleireirosportugal)
- Chama a Instagram Basic Display API ou faz fetch público
  dos posts mais recentes dessa hashtag
- Extrai: username, nome do perfil, bio, nº de seguidores,
  nº de posts, link do perfil, foto de perfil

### 2. Filtros automáticos
- Filtrar perfis com 200 a 2000 seguidores
- Excluir contas verificadas
- Excluir contas com menos de 10 posts
- Mostrar apenas contas que pareçam ser negócios 
  (bio contém palavras como: salão, barbearia, estética, 
  cabeleireiro, beleza, studio, spa, wellness)

### 3. Lista de resultados
- Tabela com: foto, username, nome, bio, seguidores, posts
- Badge de qualidade: 🟢 Ideal / 🟡 OK / 🔴 Ignorar
- Botão "Abrir no Instagram" — abre o perfil numa nova tab
- Botão "Gerar DM" — gera mensagem personalizada
- Botão "Marcar como enviada" — regista que já foi contactada
- Contador: X perfis encontrados, X filtrados, X contactados

### 4. Gerador de DM personalizada
Para cada perfil, gerar automaticamente uma DM em 
Português de Portugal com:
- Nome do salão (extraído do nome do perfil ou bio)
- Referência ao tipo de negócio (cabeleireiro/barbearia/etc)
- Proposta de valor da TimelyOne
- Oferta de 3 meses grátis
- CTA para responder

Modelo base:
"Olá [Nome]! Vi o vosso trabalho no Instagram — que 
serviço cuidado 👏 
Desenvolvemos uma plataforma portuguesa de gestão para 
[tipo de negócio] — marcações automáticas, lembretes por 
WhatsApp e relatórios de receita num só lugar.
Estamos a oferecer 3 meses grátis aos primeiros clientes 
em troca de feedback honesto. Posso mostrar em 10 minutos 
como funciona?"

Botão "Copiar DM" — copia para clipboard com 1 clique.

### 5. Histórico e tracking
- Guardar localmente (localStorage ou ficheiro JSON) 
  os perfis já contactados
- Data de contacto, username, status: 
  Enviada / Respondeu / Converteu / Ignorou
- Dashboard simples: total contactados, taxa de resposta,
  conversões

### 6. Export
- Exportar lista de perfis para CSV
- Exportar histórico de DMs enviadas para CSV

---

## Estrutura de pastas (sugerida)
instagram-prospecting/
├── app/
│   ├── page.tsx              # Dashboard principal
│   ├── search/page.tsx       # Pesquisa por hashtag
│   ├── history/page.tsx      # Histórico de contactos
│   └── api/
│       ├── instagram/route.ts  # Proxy para Instagram API
│       └── export/route.ts     # Export CSV
├── components/
│   ├── ProfileCard.tsx
│   ├── DMGenerator.tsx
│   ├── FilterBar.tsx
│   └── StatsBar.tsx
├── lib/
│   ├── instagram.ts          # Funções da API
│   ├── dm-templates.ts       # Templates de DM
│   └── storage.ts            # Persistência local
├── types/
│   └── instagram.ts
├── .env.local.example
├── .gitignore
├── README.md
└── package.json

---

## Ficheiros obrigatórios a gerar

### README.md completo com:
- Descrição do projecto
- Pré-requisitos
- Instalação passo a passo
- Como configurar as variáveis de ambiente
- Como correr localmente
- Como usar cada funcionalidade
- Limitações conhecidas (sem auto-envio de DMs)
- Roadmap futuro

### .env.local.example com:
- INSTAGRAM_ACCESS_TOKEN=
- INSTAGRAM_APP_ID=
- INSTAGRAM_APP_SECRET=

### .gitignore com:
- .env.local
- node_modules
- .next
- *.csv (opcional, dados sensíveis)

---

## Git setup (incluir instruções no README)

```bash
git init
git add .
git commit -m "feat: initial commit — Instagram prospecting tool"
git branch -M main
git remote add origin https://github.com/SEU_USER/timelyone-prospecting.git
git push -u origin main
```

Estrutura de commits a seguir:
- feat: nova funcionalidade
- fix: correcção de bug
- docs: alteração na documentação
- style: formatação
- refactor: refactorização

---

## Notas importantes

1. O envio de DMs é SEMPRE manual — a app nunca envia 
   mensagens automaticamente. Apenas gera o texto e abre 
   o perfil no browser.

2. Respeitar os rate limits da Instagram API — máximo
   200 requests por hora.

3. Guardar um delay de 2-3 segundos entre requests 
   para evitar bloqueios.

4. Mostrar aviso legal no footer: 
   "Esta ferramenta não envia mensagens automaticamente. 
   Todos os contactos são feitos manualmente pelo utilizador."

5. A app corre apenas localmente — nunca fazer deploy 
   público desta ferramenta.

---

## Design
- Tema escuro (dark mode por defeito)
- Paleta: navy #0b1628, accent blue #0EA5E9, 
  verde #34D399, texto #fff
- Limpo, minimalista, funcional
- Mobile-friendly (pode ser usado no telemóvel 
  enquanto navega no Instagram)