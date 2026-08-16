# Plano de implementação — estados reais e validação de pedidos

## Objetivo

Impedir que dados, imagens ou respostas demonstrativas apareçam em produção; tornar falhas explícitas para clientes e administradores; e fazer o backend ser a fonte canônica de produtos, preços, estoque e total antes de criar pedidos ou pagamentos.

## Regras de segurança da mudança

- [x] Preservar os serviços atuais de rollback (Vercel e Zeabur).
- [x] Não alterar DNS, Caddy ou Traefik sem necessidade comprovada.
- [x] Não registrar segredos, tokens ou variáveis sensíveis no repositório.
- [x] Remover as fixtures demonstrativas de runtime; novas fixtures só poderão existir sob `import.meta.env.DEV`.
- [x] Garantir que o bundle de produção não contenha URLs do Unsplash nem nomes/preços de produtos fictícios.

## 1. Inventário e arquitetura

- [x] Reproduzir o flash inicial de conteúdo demonstrativo na página inicial.
- [x] Reproduzir o falso produto em uma rota de produto inexistente.
- [x] Mapear fallbacks demonstrativos em Home, categoria, produto e painel administrativo.
- [x] Mapear o fluxo carrinho → checkout → pedido → pagamento.
- [x] Confirmar todos os endpoints de pagamento que recebiam valores do cliente.

## 2. Storefront

- [x] Iniciar `siteConfig` como `null`.
- [x] Exibir skeleton neutro enquanto a configuração real está carregando.
- [x] Exibir “Não foi possível carregar” e “Tentar novamente” em falhas recuperáveis.
- [x] Tratar HTTP 404 de produto como “Produto não encontrado”.
- [x] Remover fallbacks de produtos/configurações demonstrativas do caminho de produção.
- [x] Remover fixtures atuais; qualquer fixture futura deverá ficar atrás de `import.meta.env.DEV`.
- [x] Reiniciar `heroLoaded` quando a URL da imagem do hero mudar.
- [x] Eliminar requisições ao Unsplash e outros placeholders de imagem externos.
- [x] Usar placeholder vetorial local e neutro para imagem ausente.

## 3. Painel administrativo

- [x] Remover produtos e pedidos demonstrativos do caminho de produção.
- [x] Exibir erro real com ação de nova tentativa quando listagens falharem.
- [x] Remover toast de sucesso quando o salvamento da configuração falhar.
- [x] Iniciar o editor visual em estado neutro e aguardar a configuração da API.

## 4. Backend — integridade comercial

- [x] Validar formato e quantidade de cada item do pedido.
- [x] Recarregar cada produto pelo ID no banco antes de criar o pedido.
- [x] Rejeitar IDs inexistentes, produtos inativos e estoque insuficiente.
- [x] Ignorar nome, preço e total enviados pelo navegador.
- [x] Recalcular preços e total no servidor usando valores canônicos do banco.
- [x] Fazer o pagamento usar o pedido validado como fonte do valor e dos itens.
- [x] Exigir assinatura no webhook Stripe e reconciliar o retorno do checkout de forma idempotente pelo servidor.
- [x] Retornar códigos HTTP e mensagens coerentes para entrada inválida, ausência e conflito de estoque.

## 5. Testes obrigatórios

- [x] API lenta: skeleton neutro, sem flash de dados demonstrativos; depois conteúdo real.
- [x] API offline: mensagem de erro e botão de nova tentativa, sem produtos falsos.
- [x] DNS falhando: mesmo estado honesto de erro, sem imagem externa indevida.
- [x] HTTP 404: “Produto não encontrado”.
- [x] HTTP 500: mensagem de erro e nova tentativa.
- [x] Pedido adulterado: preço/nome/total do cliente não prevalecem.
- [x] Produto inexistente, inativo ou sem estoque: pedido recusado.
- [x] Pagamento adulterado: valor do cliente não prevalece sobre o pedido persistido.

## 6. Qualidade e publicação

- [x] Executar testes automatizados do backend (9 testes aprovados).
- [x] Executar testes automatizados do frontend (5 testes aprovados).
- [x] Gerar build de produção do frontend.
- [x] Executar verificação de sintaxe disponível no projeto.
- [x] Revisar o diff e garantir que não há segredos nem alterações fora do escopo.
- [x] Commitar e publicar a branch `migration/coolify`.
- [x] Configurar o backend do Coolify para a mesma branch e redeployar frontend/backend.
- [x] Validar produção em `https://dimodaintima.cloud` e `https://api.dimodaintima.cloud`.
- [x] Confirmar no bundle/rede de produção que não há requisição ao Unsplash.
- [x] Registrar o resultado final e os comandos de rollback.

## Resultado da implantação

- Versão publicada no frontend e no backend: `7c60c3d2194f998df77cadd91c728565c2a7634b`.
- Backend: healthcheck interno e `GET /api/health` públicos aprovados.
- Frontend: HTTP 200, configuração real e 75 produtos carregados; nenhuma referência ao Unsplash ou aos produtos demonstrativos conhecidos no bundle.
- Validação negativa sem gravação: produto inexistente recusado com `PRODUCT_NOT_FOUND` e pedido inexistente recusado com `ORDER_NOT_FOUND`, ambos HTTP 404.
- Navegador interno: página inicial exibiu somente configuração/imagens reais; rota inexistente exibiu “Produto não encontrado”.
- Vercel e Zeabur foram preservados sem alterações como contingência adicional.

## Rollback documentado

Opção preferencial, sem alterar o histórico Git:

1. No Coolify, usar **Rollback** do frontend para o deployment do commit `6fb843dcd1e6f0783138e1329fca572a92386f15`.
2. No Coolify, usar **Rollback** do backend para o deployment do commit `e5b83c96360422be6b24e6077b190d7ab967778e`.
3. Confirmar `GET https://api.dimodaintima.cloud/api/health` e a página inicial após a troca.

Alternativa auditável pelo Git, criando commits reversos:

```powershell
git switch migration/coolify
git revert 7c60c3d e8e6e84
git push origin migration/coolify
```

Essa alternativa deve ser usada somente se for necessário desfazer integralmente esta implementação; os deploys antigos do Coolify e os serviços originais continuam disponíveis.

## Critérios de aceite

- Nenhuma falha de API pode ser mascarada por dados ou mensagens de sucesso fictícios em produção.
- Nenhuma página pode requisitar fotos demonstrativas externas durante carregamento ou erro.
- O backend, não o navegador, determina IDs válidos, descrição, preço, estoque e total do pedido/pagamento.
- Os cinco cenários de rede/HTTP solicitados têm evidência de teste.
- A versão corrigida está publicada no Coolify com HTTPS saudável e rollback documentado.
