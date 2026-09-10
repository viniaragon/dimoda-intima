# DiModa: gateway WhatsApp para avisos à própria conta

MVP privado na VPS Hostinger existente, sem assinatura ou servidor adicional. Node 24, Chromium e `whatsapp-web.js` **1.34.7**, versão estável confirmada no registro npm em 10/09/2026. Não há campanhas, endpoints de leitura de chats ou envio a terceiros. A biblioteca usa WhatsApp Web e sua sessão pode sincronizar dados internamente; o gateway não publica esses dados. Integração não oficial, sujeita a desconexão, mudanças do WhatsApp e bloqueio de conta. Sem garantia de disponibilidade ou entrega.

## Configuração

1. Copie `.env.example` para `.env` e gere o token com `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`. Guarde-o no gerenciador de segredos/Coolify. Não envie pelo frontend, URL, logs ou Git.
2. Mantenha `ALLOWED_PHONE=557591568274`, exatamente o número informado (+55 75 9156-8274). Nenhum nono dígito é inserido. Após vincular, `getNumberId` resolve o identificador WhatsApp e ele deve ser idêntico à conta conectada. `number_unresolved` ou `account_mismatch` bloqueia envios: confirme o número com o usuário antes de mudar a configuração.
3. Execute `docker compose up -d --build` nesta pasta. A porta publicada é **127.0.0.1:3300**, nunca uma interface pública. O volume `whatsapp-data` preserva LocalAuth e SQLite; use **uma única réplica** e nunca dois processos no mesmo volume.
4. Na máquina local, faça `ssh -L 3300:127.0.0.1:3300 usuario@VPS`; abra `http://127.0.0.1:3300`, informe o token e leia o QR pelo WhatsApp da própria conta. O token fica apenas na memória da página; fechar/recarregar exige login novamente. Sair da interface não desvincula a conta. QR e sessão não são registrados nos logs.
5. Confirme `GET /status` autenticado retornando `state: ready, selfVerified: true`. Não foi feito pareamento nem envio real durante a implementação.

## Coolify e recursos

Use esta pasta como contexto de build/Compose na VPS existente. Configure os dois segredos como variáveis do serviço. Preserve o volume no caminho `/app/data` (UID 1000). Conecte o backend e o gateway à mesma rede Docker privada; o backend usa `http://whatsapp-gateway:3000`, conforme o alias real da rede. Configure o token somente no servidor. Não associe domínio/rota pública ao gateway nem exponha a porta através do proxy. Para acessar o QR mantenha o bind loopback e o túnel SSH acima. Revise o Compose efetivo no Coolify: ele pode adaptar redes e nomes de volumes.

O Compose limita a 1 CPU, 768 MB RAM e 256 processos; são limites iniciais, não uma promessa de consumo/funcionamento em qualquer VPS. Chromium precisa de memória durante o login. Verifique capacidade livre antes de iniciar e monitore `docker stats` e reinícios/OOM. Se insuficiente, interrompa o gateway e ajuste apenas dentro da capacidade disponível da VPS, sem contratar recursos. Falhas não devem impedir operações do site: o backend precisa manter seu próprio outbox e exibir falha/pendência. `/health` mede apenas processo HTTP vivo, não conexão WhatsApp; monitore `/status` com autenticação.

### Alternativa autorizada: painel HTTPS pelo Traefik

Quando não houver túnel SSH disponível, a Central pode publicar a aplicação Dockerfile no Coolify em `https://whatsapp.dimodaintima.cloud`, porta interna 3000, **sem mapear porta no host**. HTTPS válido é obrigatório para o token/QR; o login público contém apenas formulário. QR, status e envio continuam exigindo Bearer. Use alias privado `dimoda-whatsapp` para o backend (`http://dimoda-whatsapp:3000`); o backend não precisa passar pelo endereço público. Na aplicação Dockerfile configure também volume persistente e os limites de CPU/RAM/PIDs: os limites do Compose não se aplicam automaticamente a esse tipo de aplicação.

Essa opção amplia a superfície pública e torna o token a credencial principal. Gere 32 bytes aleatórios, não compartilhe e rotacione no Coolify e backend se houver exposição. Não registre Authorization nem corpo de `/qr` no proxy/observabilidade. Restrinja no Traefik os endpoints ao mínimo necessário; idealmente `/messages` só deve ser alcançável pela rede privada. O gateway responde 429 após 20 falhas de autenticação por minuto por peer TCP e limita 100 conexões. Não confia em X-Forwarded-For; atrás do Traefik, as falhas compartilham o bucket do proxy. Credenciais válidas continuam aceitas para evitar bloqueio de administradores por tentativas alheias. Isso não substitui limitação de tráfego no proxy e não pretende conter DDoS. Se possível, configure rate limit no Traefik com IP de origem obtido exclusivamente de proxies confiáveis. A alternativa HTTPS autenticada é suportada sem mudanças no contrato.

O Chromium roda como usuário `node`, mas com `--no-sandbox` para compatibilidade Docker. O container perde capabilities e usa `no-new-privileges`; mantenha o serviço privado, imagem atualizada e volume restrito. O volume contém credenciais da conta: proteja também backups. Remover volume perde sessão **e deduplicação**; nunca use `docker compose down -v` em operação normal. Pare o serviço antes de copiar/restaurar o volume. Restaurar backup antigo pode perder chaves recentes; suspenda retries até reconciliar. Não escale horizontalmente.

## Contrato HTTP

Todos os endpoints de dados exigem `Authorization: Bearer <GATEWAY_TOKEN>`. Sem cookies ou CORS. A página de login e seu script são públicos, mas não contêm QR, token ou sessão. Respostas têm `Cache-Control: no-store`.

- `GET /health`: público, `200 {"ok":true}`.
- `GET /status`: `200 {"state":"ready","selfVerified":true}`; estados possíveis: starting, qr, qr_error, authenticated, verifying, ready, number_unresolved, account_mismatch, verification_failed, auth_failure, disconnected, initialization_failed, stopping. Não expõe número/ID da conta.
- `GET /qr`: autenticado, `200 {"qr":"data:image/png;base64,..."}` ou 404 se indisponível.
- `POST /messages`: JSON `{"phone":"557591568274","message":"Seu aviso"}` e `Idempotency-Key` único por aviso lógico (8–128 caracteres `[A-Za-z0-9._:-]`). São aceitos espaços, parênteses, hífen e + inicial no telefone, mas os dígitos precisam coincidir com a whitelist configurada. Texto de 1–4096 unidades UTF-16, sem mensagem vazia; corpo máximo 24 KiB.

| HTTP | Corpo/semântica |
| --- | --- |
| 202 | `{status:"pending",idempotencyKey}`: aceito e persistido, ainda não confirmado. |
| 200 | `{status:"sent",idempotencyKey}`: `sendMessage` retornou mensagem identificada. Não significa entregue ou lida. |
| 202 | `{status:"unknown",idempotencyKey}`: timeout, exceção ou reinício após aceitação. Pode ter sido enviado. |
| 503 | `{status:"failed",idempotencyKey}`: item aceito anteriormente, mas conta deixou de estar verificada antes de chamar envio; nenhum envio desse item foi iniciado. Terminal para esta chave. |
| 503 | `{error:"not_ready"}`: rejeitado antes de aceitar, sem gravar chave. Pode repetir mesma chave/body quando conectado. |
| 503 | `{error:"storage_unavailable"}`: persistência indisponível; reconcilie repetindo mesma chave/body. |
| 409 | `{error:"idempotency_conflict"}`: mesma chave, outro conteúdo/destino. |
| 429 | `{error:"rate_limited"}`: máximo 30 novos itens/hora e 20 esperando na fila. Retries existentes continuam consultáveis. |
| 400/401/403/413/415 | Dados/chave inválidos, autenticação, destino bloqueado, corpo excedido, Content-Type inválido. |

O POST retorna inicialmente 202. Para consultar, repita **a mesma chave e o mesmo body** (por exemplo após 5–10 segundos, com backoff). Mantenha chave e texto originais no outbox do backend. Não crie automaticamente nova chave para um item pending/unknown: isso pode duplicar avisos. Um erro de transporte também exige retry com a mesma chave. Para `failed`, uma nova tentativa é decisão explícita do operador após conferir o status; a chave antiga permanece terminal.

Há somente um envio em execução. Após 30 segundos ele fica unknown, mas o gateway aguarda a chamada original terminar antes de iniciar outro envio. Se resolver depois, atualiza para sent; se nunca resolver, a fila permanece parada e exige intervenção. Reiniciar converte todos os itens pending/sending em unknown e **não os reenvia**. Itens ainda na fila podem ter sido perdidos com segurança conservadora. Histórico SQLite persiste apenas chave, hash SHA-256 do payload, estado e data; texto fica na memória durante a fila. Não há expiração automática de chaves, nem garantia de exactly-once se o volume for apagado/restaurado. Não há reconexão automática após estado disconnected: reinicie e, se necessário, vincule novamente.

## Verificação

`node --test` roda 10 testes HTTP/SQLite sem WhatsApp, Chromium ou dependências npm. Para produção use `npm ci` e `npm start`, preferencialmente via Docker. Nenhum teste envia mensagens. Validação local em 10/09/2026: testes passaram, Compose válido, build Docker concluído e smoke test Chromium/Puppeteer/SQLite/importação whatsapp-web.js passou em container sem rede com 768 MB/1 CPU/256 PIDs. O smoke test abriu somente conteúdo HTML local, sem inicializar cliente WhatsApp. Pareamento, conectividade e entrega real ainda precisam ser validados na VPS antes de ativar avisos.

Auditoria npm em 10/09/2026: 5 ocorrências high na cadeia `whatsapp-web.js → puppeteer → @puppeteer/browsers → extract-zip`, originadas em path traversal ao extrair ZIP ([aviso oficial](https://github.com/advisories/GHSA-7pqw-9j4j-h8q3)). O pacote afetado não tem versão corrigida segundo o aviso. Mantivemos o Puppeteer fixado pelo upstream para não presumir compatibilidade com um override major. O Docker desativa download de navegador (`PUPPETEER_SKIP_DOWNLOAD=true`) e usa Chromium do Debian; não há endpoint de upload/extração. Isso reduz a exposição ao caminho afetado, mas **a auditoria não está limpa**. Reavalie upstream e lockfile antes de publicar; não rode `npm audit fix --force` sem validar compatibilidade.

Fontes oficiais: [npm whatsapp-web.js](https://www.npmjs.com/package/whatsapp-web.js), [LocalAuth](https://docs.wwebjs.dev/LocalAuth.html), [Client/getNumberId](https://docs.wwebjs.dev/Client.html#getNumberId), [guia de autenticação](https://wwebjs.dev/guide/creating-your-bot/authentication).
