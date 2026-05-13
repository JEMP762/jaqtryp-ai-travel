## Objetivo
Adicionar camada de monetização (markup, taxa de serviço, upsells, dashboard financeiro) sobre o fluxo Duffel existente — sem alterar reservas, autenticação ou integrações atuais.

## Escopo (apenas adições)

### 1. Banco de dados (migration aditiva)
- `commission_settings` — configuração global de markup/taxa (admin):
  - `markup_type` (percent|fixed), `markup_value`, `service_fee_type`, `service_fee_value`, `currency`, `upsells_enabled`, `updated_at`
- `booking_commissions` — histórico financeiro por reserva (não toca `flight_orders`/`stay_orders`):
  - `id`, `user_id`, `order_kind` (flight|stay), `order_id` (FK lógico), `original_amount`, `markup_amount`, `service_fee_amount`, `final_amount`, `currency`, `net_profit`, `upsells` (jsonb), `created_at`
- Role `admin` no enum `app_role` (já existe estrutura `user_roles`)
- RLS: usuário vê só suas comissões; admin vê tudo via `has_role(uid,'admin')`

### 2. Backend (server functions novas, não modifica existentes)
- `src/lib/pricing.functions.ts`:
  - `getPricingConfig()` — lê `commission_settings`
  - `applyPricing(originalAmount, currency)` — retorna `{ original, markup, serviceFee, final }`
  - `previewOfferPricing({ offer_id, kind })` — retorna breakdown sem reservar
- `src/lib/commission.functions.ts`:
  - `recordCommission(...)` — chamado após criar reserva
  - `listMyCommissions()`, `adminFinancialSummary()` (admin only)
- `src/lib/admin.functions.ts`:
  - `getCommissionSettings()`, `updateCommissionSettings()` (admin only)

Hook leve em `duffel.functions.ts` / `stays.functions.ts`: após `insert` em `flight_orders`/`stay_orders`, chamar helper que grava em `booking_commissions`. Não muda assinatura nem retorno.

### 3. Frontend — adições leves
- **Componente `<PriceBreakdown>`** (`src/components/pricing/PriceBreakdown.tsx`): exibe original + taxa JAQTRYP + markup + final, com badge "Preço justo" / "Boa oportunidade" baseado em score simples
- **Componente `<UpsellSuggestions>`**: cards de seguro/bagagem/chip/traslado (mock-driven via IA, sem cobrança real ainda — apenas seleção que entra no `upsells` jsonb)
- **Componente `<SmartCheckoutSummary>`**: resumo IA + score conforto + alertas Shield, exibido no checkout de voos/hotéis
- Integrar nos checkouts de `_app.flights.tsx` e `_app.stays.tsx` apenas inserindo os componentes acima — sem refatorar fluxo

### 4. Dashboard admin — nova rota
- `src/routes/_app.admin.financial.tsx`:
  - Cards: receita mensal, comissão total, lucro líquido, ticket médio, upsells vendidos
  - Tabela de reservas com breakdown
  - Gráfico simples (recharts) de receita por dia
  - Visível apenas se `has_role(user,'admin')`
- `src/routes/_app.admin.settings.tsx`:
  - Form de markup, taxa de serviço, toggle upsells, moeda padrão

### 5. IA de conversão
- Expandir `api.chat.tsx`: adicionar prompt opcional quando contexto inclui `pricing_breakdown` para explicar vantagens, economia, score conforto. Sem mudar escopo travel-only existente.

## Arquivos novos
- migration SQL
- `src/lib/pricing.functions.ts`
- `src/lib/commission.functions.ts`
- `src/lib/admin.functions.ts`
- `src/components/pricing/PriceBreakdown.tsx`
- `src/components/pricing/UpsellSuggestions.tsx`
- `src/components/pricing/SmartCheckoutSummary.tsx`
- `src/routes/_app.admin.financial.tsx`
- `src/routes/_app.admin.settings.tsx`

## Arquivos modificados (mínimo)
- `src/lib/duffel.functions.ts` — adicionar chamada a `recordCommission` após insert (1 linha)
- `src/lib/stays.functions.ts` — idem
- `src/routes/_app.flights.tsx` — inserir `<PriceBreakdown>` + `<UpsellSuggestions>` no checkout
- `src/routes/_app.stays.tsx` — idem
- `src/components/site/Navbar.tsx` — link "Admin" condicional
- `src/routes/api.chat.tsx` — prompt expandido com pricing context (opcional)

## Garantias
- Nenhum endpoint Duffel alterado
- `flight_orders` / `stay_orders` intactos
- Valor original Duffel preservado em todos lugares
- Upsells por enquanto são metadata (não cobrados separadamente) — flag para fase 2
- Tudo gated por feature: se `commission_settings` não existir, sistema funciona como hoje (markup=0)

Confirma para eu implementar?