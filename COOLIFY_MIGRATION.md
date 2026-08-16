# Migração Zeabur/Vercel → Coolify

## Fonte correta

- Aplicação implantada no Zeabur: `https://github.com/viniaragon/dimoda-intima`
- Branch: `main`
- Commit verificado: `e5b83c96360422be6b24e6077b190d7ab967778e`
- O repositório `dimoda-intima-main` está desatualizado e não deve ser usado no corte.

## Topologia

- Frontend: Vite/React estático no Coolify, publicado em `https://dimodaintima.cloud`.
- Backend: Node.js 20 no Coolify, publicado em `https://api.dimodaintima.cloud`.
- Banco: Firebase Firestore externo; não há banco ou volume para copiar.
- Arquivos: Cloudinary externo; o serviço do Zeabur não possui volumes.
- Porta interna: `8080`.
- Healthcheck: `GET /api/health`, retorno HTTP `200`.

## Configuração do recurso no Coolify

- Projeto: `Di Moda Íntima`
- Ambiente: `production`
- Aplicação: `dimoda-intima-backend`
- Repositório: `https://github.com/viniaragon/dimoda-intima.git`
- Branch: `main`
- Build pack: `Nixpacks`
- Base directory: `/backend`
- Exposed port: `8080`
- `NIXPACKS_NODE_VERSION=20`
- `NODE_ENV=production`
- `PORT=8080`

### Frontend

- Aplicação: `dimoda-intima-frontend`
- Repositório: `https://github.com/viniaragon/dimoda-intima.git`
- Branch: `migration/coolify`
- Build pack: `Nixpacks`
- Base directory: `/frontend`
- Aplicação estática/SPA: habilitado
- Publish directory: `/dist`
- Exposed port: `80`
- `NIXPACKS_NODE_VERSION=22`
- `VITE_API_URL=https://api.dimodaintima.cloud` (build time)

## Variáveis vindas do Zeabur

Importar como segredos de runtime:

- `ADMIN_EMAIL`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `FIREBASE_CERT_URL`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_CLIENT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_PRIVATE_KEY_ID`
- `FIREBASE_PROJECT_ID`
- `FRONTEND_URL`
- `JWT_SECRET`
- `PASSWORD` (legada; o código atual não a lê)
- `RESEND_API_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`

Variáveis opcionais suportadas pelo código, mas ausentes no Zeabur:

- `RESEND_FROM_EMAIL`
- `STRIPE_WEBHOOK_SECRET`
- `CALLMEBOT_API_KEY`

## Corte realizado

1. Segredos do Zeabur importados no backend do Coolify.
2. Backend implantado e validado em `https://api.dimodaintima.cloud/api/health`.
3. Frontend implantado no Coolify com `VITE_API_URL` apontando para a nova API.
4. DNS de `dimodaintima.cloud`, `www` e `api` apontado para `187.77.44.198`.
5. HTTPS emitido pelo Let's Encrypt para os três nomes.
6. Página inicial, rota SPA, catálogo e configuração da API validados com HTTP 200.
7. Vercel e Zeabur mantidos temporariamente como rollback; não fazem parte do tráfego do domínio novo.

## Observações

- O backend foi validado localmente e em contêiner Node 20, conectando ao Firestore e respondendo `status=ok`.
- A instalação atual reporta vulnerabilidades em dependências; tratar isso em uma etapa separada para não misturar atualização de pacotes com a migração.
- Nunca versionar `backend/.env`; ele está ignorado pelo Git e pelo contexto Docker.
