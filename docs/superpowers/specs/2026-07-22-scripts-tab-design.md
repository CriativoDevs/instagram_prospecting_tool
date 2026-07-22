# FEAT-SCRIPT-01 — Aba de Scripts de mensagens pré-geradas com suporte a follow-up

- **Issue:** [#4](https://github.com/CriativoDevs/instagram_prospecting_tool/issues/4) `FEAT-SCRIPT-01`
- **Branch:** `4-feat-script-01`
- **Data:** 2026-07-22

## Contexto

Hoje a ferramenta gera uma única mensagem por perfil, automaticamente, via `generateDM()` (`lib/dm-templates.ts`), que detecta o tipo de negócio a partir da bio/nome/username e escolhe um template fixo por categoria (barbearia, salão, estética, unhas, spa, tatuagem, genérico). Não existe forma de criar mensagens alternativas para usar em diferentes momentos da prospecção (1º contacto vs. follow-ups).

## Objetivo

Criar uma aba **Scripts** onde o utilizador pode criar, editar, remover e organizar múltiplas mensagens pré-definidas, associadas a um estágio de prospecção (1º contacto, follow-up 1 semana, etc), com suporte a variáveis dinâmicas e integração no fluxo de geração/envio de DM já existente.

## Fora de escopo

- Envio automático de mensagens (a ferramenta continua a não enviar DMs sozinha — confirmado no rodapé da app).
- Envio em lote de um script para vários perfis de uma vez (ficou fora desta issue; ver possível issue futura para `/search`/`/history`).
- Lembretes automáticos de follow-up (coberto por `FEAT-REMINDER-01`, issue #5).

## 1. Modelo de dados & API

### Tipo `Script`

```ts
// types/instagram.ts (ou novo types/scripts.ts)
export type ScriptStage =
  | "primeiro_contacto"
  | "followup_1_semana"
  | "followup_2_semanas"
  | "followup_1_mes"
  | "outro";

export interface Script {
  id: string;
  stage: ScriptStage;
  title: string;
  body: string;        // texto livre com placeholders {{nome}} e {{segmento}}
  createdAt: string;
  updatedAt: string;
}
```

Ordem fixa de exibição das colunas/estágios: `primeiro_contacto`, `followup_1_semana`, `followup_2_semanas`, `followup_1_mes`, `outro`.

### Persistência

Redis (Upstash), seguindo o padrão de `lib/redis.ts` / `PROSPECTS_KEY`:

- Nova key: `timelyone:scripts` (array de `Script`).
- Sem localStorage — consistente com o resto da app, que já migrou toda a persistência para Redis.

### Rotas (`app/api/scripts/`)

- `GET /api/scripts` — lista todos os scripts.
- `POST /api/scripts` — cria um script (`{ stage, title, body }` → gera `id`, `createdAt`, `updatedAt`).
- `PATCH /api/scripts/[id]` — edita `stage`/`title`/`body` de um script existente; 404 se `id` não existir.
- `DELETE /api/scripts/[id]` — remove um script; 404 se `id` não existir.
- `POST /api/scripts/import` — aceita `{ rows: { stage, title, body }[] }` (já parseado no cliente a partir do CSV), cria vários scripts de uma vez. Linhas com `stage` inválido ou `body` vazio são ignoradas; resposta inclui `{ imported: number, skipped: number }`.

Todas as rotas seguem o padrão de tratamento de erro de `app/api/prospects`: `try/catch` em torno das chamadas Redis, retornando `NextResponse.json({ error }, { status: 500 })` em falha.

### Import / Export CSV

Na página `/scripts`:

- **"Baixar modelo CSV"** — gera/serve um ficheiro estático `scripts-modelo.csv` (em `public/`) com cabeçalho e exemplos:

  ```csv
  stage,title,body
  primeiro_contacto,Primeiro contacto padrão,"Olá {{nome}}! Vi o vosso trabalho como {{segmento}} e fiquei impressionado."
  followup_1_semana,Follow-up 1 semana,"Passei por aqui de novo {{nome}} — ainda interessados em conhecer a nossa plataforma para {{segmento}}?"
  followup_2_semanas,Follow-up 2 semanas,"Olá {{nome}}, última tentativa — se mudarem de ideias sobre a gestão do vosso negócio, estamos por aqui."
  ```

- **"Importar CSV"** — input de ficheiro; parse no cliente (colunas `stage,title,body`), valida `stage` contra o enum `ScriptStage`, envia linhas válidas para `POST /api/scripts/import`. Ao final, mostra resumo tipo "3 scripts importados, 1 linha inválida ignorada".
- **"Exportar CSV"** — gera CSV com as mesmas colunas a partir dos scripts atuais em Redis, para download (backup ou partilha entre máquinas/colegas).

## 2. Motor de substituição de variáveis

Placeholders suportados no `body`: `{{nome}}` e `{{segmento}}` — sintaxe exata, sem variações de maiúsculas/minúsculas.

Refatoração de `lib/dm-templates.ts`:

- `detectBusinessType(profile)` passa a ser exportado (já existe internamente).
- Novo mapa exportado `SEGMENTO_LABELS: Record<BusinessType, string>`, reaproveitando os rótulos já usados nos templates atuais:
  - `barbearia` → `"barbearia"`
  - `salao` → `"salão de cabeleireiro"`
  - `estetica` → `"centro de estética"`
  - `unhas` → `"nail studio"`
  - `spa` → `"spa"`
  - `tatuagem` → `"estúdio de tatuagem"`
  - `generico` → `"negócio de beleza"`

Nova função em `lib/scripts.ts`:

```ts
export function applyScript(script: Script, profile: ScoredProfile): string {
  const nome = profile.fullName || profile.username;
  const segmento = SEGMENTO_LABELS[detectBusinessType(profile)];
  return script.body
    .replaceAll("{{nome}}", nome)
    .replaceAll("{{segmento}}", segmento);
}
```

`generateDM()` (comportamento automático atual) permanece inalterado e continua a ser o modo "Automático (padrão)" quando nenhum script é selecionado.

## 3. Página `/scripts` — layout kanban

- Nova rota `app/scripts/page.tsx`, seguindo o estilo visual das páginas existentes (seta "voltar" para `/`, header, `max-w-7xl mx-auto`, fundo navy).
- Uma coluna por estágio, ordem fixa: **1º Contacto · Follow-up 1 semana · Follow-up 2 semanas · Follow-up 1 mês · Outro**.
- Cada coluna lista os scripts desse estágio como cards (título + preview truncado do body), com ícones de editar e remover.
- Múltiplos scripts por coluna são permitidos (variantes do mesmo estágio).
- Botão "+ Adicionar" no fundo de cada coluna expande um card em modo de edição **inline** (dentro da própria coluna, sem modal): campo título, textarea do body, botões guardar/cancelar. Editar um card existente expande esse mesmo card inline.
- Container das colunas com `overflow-x-auto` para scroll horizontal em ecrãs estreitos (5 colunas fixas lado a lado).
- No topo da página: botões "Baixar modelo CSV", "Importar CSV" (input file) e "Exportar CSV".
- Novo card de atalho no dashboard (`app/page.tsx`), ao lado dos cards de Pesquisa/Histórico, com ícone de mensagem, link para `/scripts`.

## 4. Integração no `DMGenerator`

- No topo do modal (`components/DMGenerator.tsx`), um `<select>` "Script" com:
  - Opção padrão **"Automático (padrão)"**, selecionada inicialmente — mantém o comportamento atual (`generateDM(profile)` no `useEffect` ao abrir o modal).
  - Restantes scripts agrupados por estágio (`<optgroup>` por `stage`), carregados via `GET /api/scripts`.
- Ao selecionar um script: `setDmText(applyScript(script, profile))`, substituindo o conteúdo do textarea (que continua livremente editável depois).
- Ao voltar para "Automático": recalcula com `generateDM(profile)`.
- Nenhuma mudança no fluxo de envio (`handleSendDM`, fila `dm-queue`, `PATCH /api/prospects/[username]`) — o texto final enviado é sempre o que estiver no textarea, independentemente da origem.
- Scripts carregados uma vez quando `profile` muda (modal abre); se `GET /api/scripts` falhar, degrada silenciosamente para dropdown com só "Automático" (não quebra o modal).

## 5. Tratamento de erros & testes

- **Import CSV:** parse tolerante — linha com `stage` fora do enum ou `body` vazio é ignorada e contabilizada; nenhuma linha inválida bloqueia as restantes.
- **API `/api/scripts`:** `try/catch` em torno de todas as chamadas Redis; 500 em falha de Redis; 404 em `PATCH`/`DELETE` de `id` inexistente.
- **DMGenerator:** falha em `GET /api/scripts` degrada para dropdown só com "Automático".
- **Testes:** o projeto não tem suite automatizada hoje; não introduzimos uma nesta issue. Verificação manual:
  - Criar/editar/remover script em cada coluna.
  - Importar CSV válido, CSV com linha inválida, exportar e reimportar o mesmo ficheiro (round-trip).
  - Selecionar script no DMGenerator, confirmar substituição de `{{nome}}`/`{{segmento}}`, voltar para "Automático".
  - Card no dashboard navega corretamente para `/scripts`.

## Aceite (mapeado da issue #4)

- [ ] Utilizador consegue criar, editar e remover scripts.
- [ ] Scripts suportam variáveis dinâmicas (`{{nome}}`, `{{segmento}}`) da geração atual.
- [ ] Na prospecção (modal `DMGenerator`), utilizador pode escolher qual script aplicar.
- [ ] Pelo menos 3 scripts de follow-up distintos podem coexistir (colunas + múltiplos scripts por coluna).
- [ ] Import/export/modelo CSV funcionam como descrito na secção 1.
