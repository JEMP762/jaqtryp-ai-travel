## O que será construído

Uma nova tela **Sala ao vivo** dentro do Tradutor, onde uma pessoa cria uma sala, recebe um **código de 6 caracteres + link** e envia para a outra. Cada lado entra, escolhe **seu próprio idioma** e a conversa flui em tempo real: cada pessoa fala no seu idioma, a outra **ouve em áudio (voz ElevenLabs) e lê o texto** no idioma dela.

## Fluxo do usuário

1. Em `/live-translator`, novo botão **"Criar sala"** → gera código (ex.: `KX7-92A`) e abre `/live-room/KX7-92A`.
2. Tela da sala mostra:
   - Código grande + botão **Copiar link** + botão **Compartilhar** (WhatsApp/SMS via `navigator.share`).
   - Seletor do **meu idioma** (PT, EN, ES, FR, IT, DE, JA, ZH).
   - Status: "Aguardando convidado…" / "Conectado: 2 pessoas".
   - Botão grande **🎙️ Falar** (mesmo padrão do tradutor atual).
   - Histórico bilíngue: cada mensagem mostra original (cinza) + tradução para o meu idioma (destaque), com botão play para reouvir.
3. A outra pessoa abre o link, escolhe o idioma dela e o mesmo botão "Falar" aparece.
4. Quando A fala: áudio é transcrito (Scribe), traduzido para o idioma de B e tocado automaticamente no aparelho de B com voz ElevenLabs. B vê o texto nos dois idiomas.

## Como funciona por baixo (técnico)

- **Sala em tempo real**: Supabase Realtime (canal `room:{code}`) com **Presence** para saber quem está conectado e qual idioma cada um escolheu. Sem tabela no banco — efêmero.
- **Pipeline de fala**:
  1. Cliente grava (MediaRecorder, já implementado).
  2. POST `/api/public/stt` → texto no idioma de origem (já existe).
  3. POST novo `/api/public/translate-broadcast` com `{ roomCode, fromLang, text, targets: [{userId, lang}] }` → para cada destinatário: chama Lovable AI Gateway (Gemini Flash) para traduzir + chama ElevenLabs TTS, devolve `{ userId, translatedText, audioBase64 }` por destinatário.
  4. Cliente publica no canal Realtime: `{ type: 'message', fromUserId, originalText, fromLang, perRecipient: { [userId]: { text, audio } } }`.
  5. Cada cliente, ao receber, pega só o pedaço dele, mostra texto e dá play no áudio.
- **Por que servidor traduz e gera TTS, não o cliente**: chaves ElevenLabs/Lovable AI ficam server-side; uma única request por fala (em vez de N round-trips).
- **Idiomas**: mapeamento PT→`por`, EN→`eng` etc. já existe em `api.public.stt.ts` — reaproveitado. Voz ElevenLabs multilíngue: `eleven_multilingual_v2` com voz Sarah (`EXAVITQu4vr4xnSDxMaL`) por padrão (neutra, funciona em todos idiomas).
- **Sem autenticação obrigatória** na sala: qualquer pessoa com o link entra (UUID anônimo gerado no cliente). Mantém UX de "manda o link e pronto". Route `/live-room/$code` é pública.

## Arquivos

- `src/routes/_app.live-room.$code.tsx` (novo) — UI da sala, Presence, gravação, recepção, playback.
- `src/routes/api.public.translate-broadcast.ts` (novo) — endpoint server route: traduz + gera TTS para N destinatários, retorna JSON.
- `src/routes/_app.live-translator.tsx` (editado) — adicionar botão **"Criar sala ao vivo"** no topo, ao lado do modo atual (modo solo/presencial continua existindo).
- `src/lib/i18n/translations.ts` (editado) — strings PT/EN: "Sala ao vivo", "Convidar", "Aguardando convidado", etc.

## Limites e observações

- Conversa **não fica salva** (sem histórico no banco). Se você quiser salvar depois, é uma extensão fácil.
- Áudio TTS pode pesar nos créditos ElevenLabs quando há muita fala — mostro contador discreto de uso na tela.
- Funciona em até ~4 participantes na mesma sala (Presence + broadcast aguenta tranquilo).
