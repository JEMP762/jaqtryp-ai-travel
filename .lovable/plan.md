## Objetivo
Fazer o áudio da tradução tocar no fone Bluetooth no celular, igual YouTube faz.

## Causa raiz
No Android Chrome, `speechSynthesis` envia áudio pelo canal de notificação do sistema, que muitos fones Bluetooth (A2DP) ignoram ou tocam só no alto-falante do celular. YouTube funciona porque usa `<audio>`/`<video>` → canal de mídia → Bluetooth.

## Mudanças (apenas em `src/routes/_app.live-translator.tsx`)

1. **Detectar mobile** (`/Android|iPhone|iPad/i.test(navigator.userAgent)`).

2. **No mobile, usar SOMENTE o MP3 do servidor** (`/api/tts?text=...&lang=...`), via uma única tag `<audio>` reutilizada. Não chamar `speechSynthesis` no mobile.

3. **No desktop**, manter `speechSynthesis` como hoje (funciona bem ali), com fallback para `/api/tts` se falhar.

4. **Desbloqueio de áudio no primeiro toque**: tocar um MP3 silencioso de 1 frame no elemento `<audio>` para liberar autoplay no Android.

5. **Botão "Testar áudio"**: no mobile chama direto o MP3, validando o caminho do Bluetooth antes da primeira tradução.

6. **Logs de erro do `<audio>`** (`onerror`) exibidos em toast para diagnosticar caso o `/api/tts` falhe.

7. **`api.tts.ts`**: já existe e funciona — sem mudanças (a menos que retorne erro, aí logamos status).

## Resultado esperado
No celular, toda fala (teste e tradução) baixa um MP3 e toca via `<audio>`, exatamente o caminho que YouTube usa → roteia automaticamente para o fone Bluetooth conectado.

## Sem mudanças
- Sem nova lista de dispositivos Bluetooth (o navegador mobile não expõe isso — explicado antes).
- Sem mexer em tradução, microfone, ou outras rotas.
