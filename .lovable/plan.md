## Mostrar preço em BRL ao lado do EUR no buscador de voos

Hoje o buscador de voos exibe apenas a moeda devolvida pela Duffel (EUR). Vou adicionar o equivalente em BRL ao lado, em tempo real, usando a cotação já disponível via `getFxRate` (mesma fonte usada no `PriceBreakdown`).

### Onde aparece o BRL

1. **Cards da lista de resultados** (`_app.flights.tsx` ~linha 352)
   - Linha 1 (destaque): `€ 123,45`
   - Linha 2 (menor, cinza): `≈ R$ 765,30`

2. **Resumo do voo selecionado** (~linha 375) — mesmo padrão "€ X · ≈ R$ Y".

3. **Lista de pedidos anteriores** (~linha 512) — preço final com BRL abaixo.

4. **Tela de confirmação** (~linha 484) — total em EUR + equivalente BRL.

O `PriceBreakdown` (painel detalhado do voo selecionado) já mostra BRL — sem mudanças ali.

### Como

- Criar componente leve `PriceWithBrl` em `src/components/pricing/PriceWithBrl.tsx`:
  - Recebe `amount`, `currency`.
  - Se `currency === "BRL"`, mostra só o valor.
  - Caso contrário, busca cotação via `useServerFn(getFxRate)` + `useQuery` (cache de 1h, igual ao `PriceBreakdown`) e renderiza linha principal na moeda original + linha secundária `≈ R$ …`.
  - Reusa helpers `convert` e `fmt` de `@/lib/fx`.
- Substituir as 4 chamadas a `fmtMoney(...)` listadas acima pelo `<PriceWithBrl ... />`.

### Não muda

- API Duffel, cobrança, checkout: tudo continua na moeda original.
- Lógica de preço/comissão: intacta.
- Outras páginas (stays, checkout): fora do escopo deste pedido.

### Arquivos tocados

- novo: `src/components/pricing/PriceWithBrl.tsx`
- editado: `src/routes/_app.flights.tsx` (4 trechos de exibição)