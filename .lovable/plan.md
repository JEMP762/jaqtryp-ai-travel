O erro **400: redirect_uri_mismatch** acontece porque a URL configurada em **Google Cloud → Authorized redirect URIs** não bate exatamente com a URL que o backend usa no login Google.

## O que fazer agora no Google Cloud

No seu OAuth Client ID do tipo **Web application**, em **Authorized redirect URIs**, adicione exatamente esta URL:

```text
https://etmuritswjialcycfgvw.supabase.co/auth/v1/callback
```

Salve e aguarde 1–5 minutos para o Google aplicar.

## O que NÃO usar nesse modo manual

Não use estas URLs como redirect URI autorizada no Google Cloud para o modo manual:

```text
https://oauth.lovable.app/callback
https://jaqtryp-ai-travel.lovable.app/~oauth/callback
```

Essas são do fluxo gerenciado, não do fluxo manual com suas credenciais.

## Authorized JavaScript origins

Em **Authorized JavaScript origins**, deixe as origens do seu app, sem caminho no final:

```text
https://jaqtryp-ai-travel.lovable.app
https://id-preview--6d4b0769-d635-4330-aa35-732b66d1a0d8.lovable.app
```

Se for testar localmente, também pode adicionar:

```text
http://localhost:8080
```

## Depois disso

Teste novamente o botão Google. Se continuar dando erro, copie a linha **redirect_uri=...** que aparece nos “detalhes do erro” do Google, porque ela mostra exatamente qual URL o Google está recebendo.