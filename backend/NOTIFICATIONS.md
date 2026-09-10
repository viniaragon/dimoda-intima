# Notificações de pedidos

PIX manual e dinheiro notificam ao registrar o pedido. Cartão notifica somente após
confirmação paga pelo Stripe (webhook ou consulta de status). A integração utiliza
email administrativo, email separado ao cliente quando válido e WhatsApp administrativo.
Falhas ou ausência de configuração em um canal não impedem o outro nem desfazem a compra.

## Configuração

Não há novas dependências ou contratação de plano. Use o plano gratuito existente
do Resend dentro dos seus limites e o gateway próprio na VPS existente.
O código usa `fetch`, `AbortController` e `node:crypto`, disponíveis no Node 20 do projeto.

- `RESEND_API_KEY`: chave de envio do Resend.
- `RESEND_FROM_EMAIL`: remetente de domínio verificado, por exemplo
  `Di Moda Íntima <pedidos@dimodaintima.cloud>`, **apenas após verificar esse domínio**.
  O remetente de teste `onboarding@resend.dev` não permite enviar livremente a terceiros.
- `ADMIN_EMAILS=viniaragon@gmail.com,diannalmeida1@gmail.com`: lista administrativa.
  Aceita vírgula, ponto e vírgula ou espaços; remove duplicados. Lista inválida falha
  explicitamente no envio administrativo sem impedir email ao cliente.
- `ADMIN_EMAIL`: compatibilidade quando `ADMIN_EMAILS` está vazio. Sem ambos, mantém
  o fallback histórico `dimodaintima@gmail.com`.
- `WHATSAPP_GATEWAY_URL`: URL **base** do serviço próprio, sem `/messages`, credenciais,
  query string ou fragmento. Vazia desativa esse canal.
- `WHATSAPP_GATEWAY_TOKEN`: segredo compartilhado com o gateway (Bearer).
- `ADMIN_WHATSAPP=557591568274`: destino administrativo fixo em formato internacional.
  O número informado pelo usuário foi preservado; não é obtido do corpo de requisições
  públicas nem substitui a configuração pública de atendimento/PIX do site.
- `WHATSAPP_GATEWAY_ALLOW_INSECURE_HTTP=false`: padrão seguro. HTTP em localhost é
  permitido. Para rede Docker privada e confiável, pode ser `true` com URL como
  `http://dimoda-whatsapp:3000`; nunca utilizar essa exceção na Internet pública.
- `NOTIFICATION_TIMEOUT_MS=8000`: limite por email incluindo leitura do corpo e
  orçamento global do WhatsApp incluindo consultas de estado;
  máximo 30000 ms. Valor ausente/inválido usa 8000 ms.

O antigo `CALLMEBOT_API_KEY` não é mais utilizado. A opção WhatsApp precisa do gateway
próprio configurado, autenticado e conectado; não há fallback que declara envio pelo console.

## Contrato com o gateway

O backend chama `POST <URL base>/messages`, com `Authorization: Bearer <token>`,
`Content-Type: application/json` e `Idempotency-Key`. Corpo:

```json
{"phone":"557591568274","message":"texto do pedido"}
```

O texto não pode exceder 4096 caracteres. Pedidos maiores registram falha nesse canal;
email e compra continuam. O destino vem exclusivamente de `ADMIN_WHATSAPP`.
O gateway também deve fixar/validar esse destino em sua própria configuração.
Redirecionamentos HTTP são recusados para não encaminhar o token a outro servidor.

Sucesso exige HTTP **200**, corpo JSON com `status: "sent"` e `idempotencyKey`
igual à chave enviada. HTTP 202 `pending` com a mesma `idempotencyKey` permite consultar
novamente a operação via POST com **exatamente a mesma chave e corpo**, a cada 500 ms,
dentro do orçamento global. O gateway deve tratar isso como consulta do envio existente.
HTTP 202 `unknown` encerra sem repetição; esgotar o orçamento ainda `pending` também
retorna `success: false`/`WHATSAPP_DELIVERY_UNCONFIRMED`. Nunca gera chave nova. Corpo inválido,
HTTP 4xx/5xx, timeout ou erro de rede também falham explicitamente.
O sucesso significa aceitação do envio pelo serviço, não confirmação de leitura pelo destinatário.

Resend exige HTTP 2xx e JSON com `id` não vazio. O resultado é `status: "accepted"`,
sem alegar entrega à caixa de entrada. Não se registram texto do pedido, token ou
corpo de erro dos provedores nos logs da camada de notificações.

## Reentregas e limites de confiabilidade

A transação Firestore `confirmOrderPayment` retorna `changed: false` quando o pedido
já está pago, inclusive após `shipped`, `delivered` ou `cancelled`, sem gravar novamente.
Somente a primeira transação alterada dispara notificações. Isso evita duplicação
entre webhook, consulta de status e confirmações concorrentes, além de impedir regressão
do status operacional. Chaves dos provedores são estáveis por pedido, evento e canal:
`order:<sha256(orderId)>:created|paid:<canal>`, com menos de 128 caracteres.
O gateway deve persistir sua idempotência; no Resend a retenção documentada é 24 horas.
O email não usa relógio atual no corpo, mantendo payload estável em chamadas repetidas
com os mesmos dados e configuração. Mudanças de destinatários/remetente/conteúdo com
a mesma chave podem gerar conflito no provedor durante a janela de idempotência.

Não há outbox durável ou rotina de reenvio nesta etapa; apenas consulta limitada de
operações `pending` já aceitas pelo gateway com a mesma chave. Uma queda do processo após
confirmar o pagamento e antes de enviar pode perder a notificação; reentrega do webhook
não reenvia avisos de um pedido já pago. Um canal com falha precisa de tratamento
operacional; nunca inventar chave nova para contornar estado indeterminado.
Na criação PIX/dinheiro, o envio ocorre em segundo plano. Na confirmação Stripe,
aguarda-se o resultado limitado pelo timeout; falha de notificação não impede resposta
de sucesso do pagamento. Exatamente uma entrega ponta a ponta não é garantida.

## Validação local

```powershell
node --test backend/tests/*.test.js
```

Executar na raiz do projeto. Testes usam fetch mock e doubles em memória, sem rede,
Firebase real ou leitura de credenciais. Os testes de transação/reconciliação executam
as funções reais extraídas dos arquivos para evitar inicializar Firebase/Stripe.
Não substituem teste do gateway conectado nem validação real do domínio Resend.

Referências oficiais consultadas em 2026-09-10:
[Resend: envio](https://resend.com/docs/api-reference/emails/send-email),
[idempotência](https://resend.com/docs/dashboard/emails/idempotency-keys),
[erros de domínio/remetente](https://www.resend.com/docs/api-reference/errors).
