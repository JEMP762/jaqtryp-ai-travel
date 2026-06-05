O problema real não parece ser a tradução nem o pareamento Bluetooth em si. O app traduz corretamente; a falha está na etapa em que o navegador Chrome/Android tenta transformar o texto traduzido em voz usando a API nativa `speechSynthesis`. Essa API é instável em Android, principalmente quando há microfone ativo, troca de saída Bluetooth, voz do sistema indisponível ou quando a fala acontece depois de uma tradução assíncrona.

Também há uma limitação importante: uma página web no Chrome Android não consegue escolher diretamente “tocar neste fone Bluetooth”. Ela só toca na saída de áudio ativa do smartphone. Se o áudio do próprio Chrome não estiver roteando para o fone, o app não tem permissão para forçar isso como um app nativo faria.

Plano para resolver no app:

1. Reverter a parte de “Bluetooth dentro do app” para um fluxo honesto e confiável
   - Manter o Bluetooth como saída do sistema do smartphone.
   - Remover qualquer indicação de que o app controla/conecta diretamente o fone.
   - Adicionar um teste de saída de áudio mais claro antes de iniciar a tradução.

2. Corrigir a reprodução de voz no Chrome Android
   - Reescrever a função `speak()` para evitar padrões que causam `synthesis-failed` no Android:
     - não reutilizar `SpeechSynthesisUtterance` vazio;
     - não chamar `speechSynthesis.cancel()` imediatamente antes de toda fala;
     - não usar `setTimeout` para iniciar a fala quando ela precisa vir de uma ação do usuário;
     - reiniciar a fila de fala de forma mais segura;
     - carregar e selecionar vozes disponíveis antes do teste.
   - Adicionar um “desbloqueio de áudio” via toque do usuário antes da primeira tradução falada.

3. Separar microfone e fala para evitar conflito
   - Garantir que o reconhecimento de voz pare completamente antes do TTS iniciar.
   - Inserir um pequeno estado intermediário “preparando áudio” após o microfone encerrar, para evitar que Chrome/Android tente usar entrada e saída ao mesmo tempo.

4. Adicionar diagnóstico visível no app
   - Mostrar se o navegador suporta voz.
   - Mostrar quantas vozes o Chrome carregou.
   - Botão “Testar áudio do Chrome” e botão “Testar Bluetooth do aparelho”.
   - Se continuar falhando, mostrar instrução objetiva: testar um vídeo/áudio no Chrome; se o Chrome não tocar no fone, o problema é roteamento do Android/Bluetooth, não do tradutor.

5. Fallback prático se o `speechSynthesis` continuar falhando
   - Quando o Chrome retornar `synthesis-failed`, o app não ficará apenas com erro: vai manter a tradução na tela e orientar o usuário a tocar novamente em “Ouvir”.
   - Se o aparelho continuar recusando TTS, a alternativa técnica realmente confiável é trocar a voz nativa do navegador por áudio TTS gerado em servidor/serviço de voz, reproduzido como arquivo de áudio normal. Isso exigiria uma integração de voz/TTS adicional, porque a API atual usada para tradução não gera áudio.

Resultado esperado:
- Se o problema for o código atual chamando a fala de forma incompatível com Chrome Android, a correção deve voltar a tocar no fone conectado.
- Se o problema for o Chrome/Android não roteando TTS para o Bluetooth ou a voz do sistema falhando, o app vai diagnosticar isso claramente e evitar prometer uma conexão que a web não consegue controlar.

<presentation-actions>
  <presentation-open-history>View History</presentation-open-history>
</presentation-actions>

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>