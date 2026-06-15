### Objetivo
Eliminar o erro 404 de `favicon.ico` no console do navegador e adicionar um ícone de marca ao projeto Jaqtryp AI.

### Problema atual
- O navegador busca `/favicon.ico` automaticamente.
- Nenhum arquivo favicon existe no projeto.
- O `<head>` em `src/routes/__root.tsx` não declara um ícone.

### Passos

1. **Gerar favicon visual**
   - Criar uma imagem PNG (512x512) com o logo/letra "J" do Jaqtryp AI em estilo minimalista, adequada para favicon.
   - A imagem será salva em `src/assets/favicon.png`.

2. **Adicionar link no `<head>`**
   - Em `src/routes/__root.tsx`, incluir um link para o favicon dentro do array `links` do `head()`:
     ```
     { rel: "icon", type: "image/png", href: "/src/assets/favicon.png" }
     ```
   - Também adicionar `apple-touch-icon` para iOS.

3. **Verificar build**
   - Confirmar que a imagem é corretamente servida e que o erro 404 desaparece do console.

### Resultado esperado
- Nenhum erro 404 relacionado a favicon no console.
- Ícone visível na aba do navegador e em bookmarks.