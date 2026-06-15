
# Carteira IA Global — Plano de Implementação (v1 completa)

Novo módulo do JAQTRYP AI para gestão financeira de viagem com IA. Nada existente será removido — só adições.

## 1. Decisões de produto

- **Acesso**: free com limites; pago libera tudo.
  - **Free**: até 1 carteira, até 20 despesas/mês, câmbio em tempo real, dashboard básico, registro manual.
  - **Pago**: ilimitado + Scanner OCR, Consultor Financeiro IA, chat conversacional, relatórios PDF, alertas inteligentes.
- **Moeda principal**: detectada pela viagem ativa (destino) com fallback BRL; usuário pode sobrescrever.
- **Despesa**: pode ser vinculada a uma trip (recomendado) ou avulsa (categoria "Geral").

## 2. Banco de dados (Lovable Cloud)

Novas tabelas no schema `public`, todas com RLS por `auth.uid()` e GRANTs:

- `wallets` — carteira do usuário (1+ por user). Campos: `user_id`, `name`, `main_currency`, `trip_id` (nullable, FK lógica para `trips.id`), `initial_balance`, `created_at`, `updated_at`.
- `wallet_expenses` — despesas. Campos: `wallet_id`, `user_id`, `trip_id` (nullable), `amount`, `currency`, `amount_in_main` (cache convertido), `fx_rate_used`, `category` (enum text: food, transport, lodging, shopping, leisure, health, fees, other), `merchant`, `country`, `occurred_at`, `source` (manual|ocr|import), `receipt_url` (nullable), `notes`, `raw_ocr` (jsonb).
- `wallet_budgets` — orçamento por carteira/trip. Campos: `wallet_id`, `trip_id`, `total_budget`, `daily_budget`, `emergency_reserve`, `currency`, `start_date`, `end_date`.
- `wallet_alerts` — alertas gerados (orçamento estourando, gasto atípico, etc.).
- Reaproveita `fx_rates` (já existe) para cache de cotações.

Storage bucket privado `wallet-receipts` para imagens enviadas ao scanner.

## 3. Server functions (TanStack `createServerFn`)

`src/lib/wallet.functions.ts`:
- `listWallets`, `createWallet`, `updateWallet`, `deleteWallet`
- `listExpenses({ walletId, tripId?, from?, to? })`
- `createExpense`, `updateExpense`, `deleteExpense` (faz conversão server-side usando `getFxRate`)
- `getWalletSummary({ walletId })` → saldo, total gasto, por categoria, por país, série diária, % do orçamento
- `setBudget`, `getBudget`
- `wasteCheck` → detecta gastos excessivos e gera `wallet_alerts`

`src/lib/wallet-ai.functions.ts` (gated por `has_active_subscription`):
- `scanReceipt({ imageDataUrl })` — chama Lovable AI (`google/gemini-2.5-flash` multimodal) com prompt estruturado para extrair `{amount, currency, date, category, merchant, country}`; salva imagem no bucket; retorna sugestão para o usuário confirmar antes de gravar.
- `askWalletAi({ walletId, prompt })` — carrega contexto (resumo + últimas despesas + orçamento) e responde via `google/gemini-3-flash-preview`.
- `advisorReport({ walletId })` — gera relatório do Consultor Financeiro (economia, melhor momento de câmbio, comparação de custo, simulação).

`src/lib/fx.functions.ts` — já existe `getFxRate`. Adicionar `fxAsk({ prompt })` que usa IA para interpretar perguntas em linguagem natural ("quanto são 500 euros em reais?") e chama `getFxRate` internamente.

Todas as fns mutativas usam `requireSupabaseAuth`. Fns de IA verificam assinatura ativa via `has_active_subscription` e retornam erro amigável + CTA para free users que excederem cotas.

## 4. Rotas / UI

Nova rota autenticada `src/routes/_app.wallet.tsx` (hub) com sub-tabs em uma única página responsiva:

```
/wallet
 ├─ Visão geral     → Dashboard (KPIs, gráficos, gastos por categoria/país, evolução diária)
 ├─ Despesas       → Lista + filtros + botão "Nova despesa" (manual) e "Scanner IA"
 ├─ Câmbio         → Conversor rápido + chat de câmbio IA
 ├─ Orçamento      → Definição/visualização + projeção
 ├─ Consultor IA   → Relatório do Consultor + chat conversacional
 └─ Configurações  → Moeda principal, carteiras, vínculo com trip
```

Componentes novos em `src/components/wallet/`:
- `WalletDashboard.tsx` (usa `recharts` já instalado)
- `ExpenseList.tsx`, `ExpenseForm.tsx`
- `ReceiptScanner.tsx` (upload de foto/print, preview do que a IA extraiu, confirmar/editar)
- `FxConverter.tsx` + `FxChat.tsx`
- `BudgetPanel.tsx`
- `AdvisorChat.tsx` (reusa padrão de chat já presente no projeto)
- `UpgradeGate.tsx` (chip "Pro" + CTA para `/billing` quando free)

Entrada no menu: adicionar item "Carteira IA" no `_app` shell (sem mexer em rotas existentes).

## 5. Integrações

- **Planner (`_app.planner`)**: botão "Abrir carteira da viagem" cria/abre wallet vinculada à trip; ao criar trip, gera orçamento sugerido (server fn `suggestBudget` usando duração + destino + categoria).
- **Stays / Flights / Checkout**: ao concluir reserva, registra automaticamente uma despesa em `wallet_expenses` (categoria lodging/transport) na carteira da trip, se existir.
- **Tradutor / Live translator / Mapa**: link contextual "Adicionar despesa aqui" quando aplicável.
- **Notificações (sonner)**: alertas de orçamento e do consultor.

## 6. IA (Lovable AI Gateway)

- Câmbio conversacional + chat financeiro → `google/gemini-3-flash-preview`.
- OCR de recibos → `google/gemini-2.5-flash` (multimodal text+image) com `Output.object` (Zod) para resposta estruturada.
- Consultor → mesmo modelo flash com prompt analítico e contexto resumido.
- Tudo via `createServerFn`, nunca no cliente. Erros 402/429 mostram toast claro.

## 7. Gating & limites (free)

Helper `getWalletQuota(userId)` retorna `{ isPro, expensesThisMonth, limit }`. UI mostra:
- Badge "Pro" nos cartões de Scanner, Consultor, Chat e Relatórios.
- Banner com progress bar quando free chega perto do limite de despesas/mês.
- Modais de upgrade reutilizando `useSubscriptionCheckout`.

## 8. Detalhes técnicos

```
Stack: TanStack Start + Supabase (já configurado) + recharts + lucide + shadcn
IA:    Lovable AI Gateway (LOVABLE_API_KEY já existe)
FX:    open.er-api.com + exchangerate.host (já em fx.functions.ts) com cache fx_rates
OCR:   Gemini multimodal via /v1/chat/completions (sem dependência externa)
Auth:  requireSupabaseAuth + has_active_subscription
Storage: bucket 'wallet-receipts' privado, signed URLs
```

Migração única cria tabelas + GRANTs + RLS + policies + bucket.

## 9. Entregáveis

1. Migration SQL (tabelas, RLS, GRANTs, bucket).
2. `src/lib/wallet.functions.ts`, `src/lib/wallet-ai.functions.ts` (+ extensão de `fx.functions.ts`).
3. Rota `_app.wallet.tsx` com tabs e todos componentes em `src/components/wallet/`.
4. Hooks em `_app.planner.tsx` / `checkout.functions.ts` / `stays.functions.ts` / `duffel.functions.ts` para auto-registrar despesas (sem alterar lógica existente — só append).
5. Link no menu lateral do `_app`.
6. Gating free/pago + toasts de erro de IA.

Sem alterar funcionalidades atuais — somente adição.
