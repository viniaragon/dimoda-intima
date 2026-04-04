# Di' Moda Íntima — Estrutura do Projeto

## Visão Geral

```
dimoda-intima-main/
├── backend/            ← API REST (Express + Firebase)
├── frontend/           ← SPA React (Vite + TailwindCSS)
├── DEPLOY.md           ← Instruções de deploy
├── README.md           ← Documentação geral
└── RECURSOS.md         ← Recursos e referências
```

---

## Backend — `backend/`

```
backend/
├── server.js                    ← Ponto de entrada: inicializa DB e registra rotas
├── database-firebase.js         ← Camada de dados (Firestore): todas as queries
├── database.js                  ← Camada de dados alternativa (SQLite, legado)
├── init-database.js             ← Script standalone para popular banco SQLite
├── package.json                 ← Dependências e scripts (dev, start, init-db)
├── .env.example                 ← Modelo de variáveis de ambiente
├── .env                         ← Variáveis de ambiente locais (não versionado)
├── railway.json                 ← Configuração de deploy Railway
├── vercel.json                  ← Configuração de deploy Vercel
│
├── middleware/
│   └── auth.js                  ← Middleware JWT (autenticação e autorização)
│
├── routes/
│   ├── auth.js                  ← Login, registro, dados do usuário logado
│   ├── products.js              ← CRUD de produtos (admin protegido)
│   ├── categories.js            ← CRUD de categorias (admin protegido)
│   ├── orders.js                ← Criar/listar/atualizar/arquivar pedidos
│   ├── pix.js                   ← PIX manual + Stripe Checkout + Webhook
│   ├── upload.js                ← Upload de imagens (Cloudinary)
│   ├── config.js                ← Configurações visuais do site
│   └── users.js                 ← Listar usuários e alterar role (admin)
│
└── services/
    ├── emailNotification.js     ← Envio de email ao admin (Resend API)
    └── whatsappNotification.js  ← Notificação WhatsApp (CallMeBot API)
```

### Como os arquivos do backend se relacionam

```
server.js
  │
  ├──► database-firebase.js     (importa como 'db' — acesso a TODAS as coleções do Firestore)
  │
  ├──► routes/auth.js           → usa db (getUserByEmail, createUser)
  │                              → usa middleware/auth.js (generateToken)
  │
  ├──► routes/products.js       → usa db (getAllProducts, createProduct, etc.)
  │                              → usa middleware/auth.js (authMiddleware, adminMiddleware)
  │
  ├──► routes/categories.js     → usa db (getAllCategories, createCategory, etc.)
  │                              → usa middleware/auth.js
  │
  ├──► routes/orders.js         → usa db (getAllOrders, createOrder, archiveOrder, etc.)
  │                              → usa middleware/auth.js
  │                              → usa services/emailNotification.js (notifyAdminEmail)
  │
  ├──► routes/pix.js            → usa db (updateOrderPayment)
  │                              → usa Stripe SDK diretamente (checkout sessions, webhooks)
  │
  ├──► routes/upload.js         → usa Cloudinary SDK + Multer (memory storage)
  │
  ├──► routes/config.js         → usa db (getSiteConfig, updateSiteConfig)
  │
  └──► routes/users.js          → usa db (getAllUsers, updateUserRole)
                                 → usa middleware/auth.js
```

### Função de cada arquivo do backend

| Arquivo | Função |
|---------|--------|
| `server.js` | Inicializa Express, configura CORS/JSON, monta rotas em `/api/*`, expõe endpoint `/api/stats` e `/api/health`, inicia o servidor |
| `database-firebase.js` | Conecta ao Firebase Admin SDK, define TODAS as funções CRUD (products, categories, orders, users, config), cria dados padrão na inicialização (admin user, categorias, produtos de exemplo) |
| `database.js` | Implementação alternativa com SQLite (sql.js). **Não é usado em produção** — mantido como fallback/legado |
| `init-database.js` | Script independente (`npm run init-db`) que popula o SQLite com tabelas, admin e dados de exemplo. **Legado** |
| `middleware/auth.js` | Valida token JWT do header `Authorization: Bearer`, extrai `userId/email/role`, exporta `authMiddleware`, `adminMiddleware` e `generateToken` |
| `routes/auth.js` | POST `/login` (valida credenciais, retorna JWT), POST `/register` (cria cliente), GET `/me` (dados do usuário) e GET `/me/orders` (pedidos do usuário) |
| `routes/products.js` | GET `/` (listar com filtros), GET `/:id`, POST `/` (criar, admin), PUT `/:id` (editar, admin), DELETE `/:id` (excluir, admin). Suporta arrays de imagens |
| `routes/categories.js` | CRUD padrão. GET `/` (público), GET `/:slug`, POST/PUT/DELETE (admin) |
| `routes/orders.js` | POST `/` (criar pedido público + dispara email), GET `/` (admin), PUT `/:id/status` (admin), DELETE `/:id`, POST `/:id/archive`, POST `/archive-all`, GET `/archived`, GET `/archives` |
| `routes/pix.js` | POST `/create` (gera dados PIX estático), POST `/card/create` (cria Stripe Checkout Session), GET `/status/:sessionId` (consulta Stripe), POST `/webhook` (recebe eventos Stripe) |
| `routes/upload.js` | POST `/` (upload imagem para Cloudinary via Multer, max 10MB, auto-otimiza), DELETE `/:publicId` (remove do Cloudinary) |
| `routes/config.js` | GET `/` (público — config visual do site), PUT `/` (admin — atualizar config) |
| `routes/users.js` | GET `/` (admin — listar usuários sem expor senhas), PUT `/:id/role` (admin — trocar role) |
| `services/emailNotification.js` | Formata HTML do pedido e envia via Resend API para o ADMIN_EMAIL. Log no console como fallback |
| `services/whatsappNotification.js` | Formata mensagem de pedido e envia via CallMeBot API. Gera link manual wa.me como fallback |

---

## Frontend — `frontend/`

```
frontend/
├── index.html                   ← HTML base (meta tags, Google Fonts, TailwindCSS CDN)
├── package.json                 ← Dependências React/Vite
├── vite.config.js               ← Config Vite (proxy para backend em dev)
├── tailwind.config.js           ← Tema personalizado (cores, fontes, dark mode)
├── postcss.config.js            ← Config PostCSS (TailwindCSS + Autoprefixer)
├── vercel.json                  ← Rewrite SPA para Vercel
├── railway.json                 ← Config Railway
│
├── public/
│   ├── favicon.svg              ← Ícone do site
│   ├── robots.txt               ← Regras para crawlers
│   └── sitemap.xml              ← Sitemap para SEO
│
└── src/
    ├── main.jsx                 ← Ponto de entrada React (BrowserRouter + Providers)
    ├── App.jsx                  ← Definição de todas as rotas (public + admin)
    ├── index.css                ← Estilos globais e classes utilitárias
    │
    ├── contexts/
    │   ├── AuthContext.jsx       ← Estado global de autenticação (login/register/logout)
    │   └── CartContext.jsx       ← Estado global do carrinho (add/remove/update/clear)
    │
    ├── services/
    │   └── api.js               ← Instância Axios configurada (baseURL, interceptors)
    │
    ├── layouts/
    │   ├── PublicLayout.jsx      ← Header + nav + footer + dark mode toggle da loja
    │   └── AdminLayout.jsx      ← Sidebar + header mobile do painel admin
    │
    ├── components/
    │   ├── ProductCard.jsx       ← Card de produto (imagem, preço, botão comprar)
    │   ├── ImageGallery.jsx      ← Galeria com thumbnails, setas, zoom e modal fullscreen
    │   ├── MultiImageUpload.jsx  ← Upload drag-and-drop de múltiplas imagens (admin)
    │   ├── Logo.jsx              ← Logo SVG animado "Di' Moda Íntima"
    │   ├── SEO.jsx               ← Componente que injeta meta tags dinamizamente no <head>
    │   └── ProtectedRoute.jsx    ← Guarda de rota (redireciona se não admin)
    │
    ├── pages/
    │   ├── HomePage.jsx          ← Banner hero + produtos destaque + features
    │   ├── CategoryPage.jsx      ← Listagem de produtos por categoria
    │   ├── ProductPage.jsx       ← Detalhe do produto (galeria + info + add to cart)
    │   ├── CartPage.jsx          ← Carrinho de compras com quantidades editáveis
    │   ├── CheckoutPage.jsx      ← Checkout em 3 etapas (dados → pagamento → revisão)
    │   ├── OrderConfirmationPage.jsx ← Confirmação (PIX/Stripe/Dinheiro) com WhatsApp
    │   ├── RegisterPage.jsx      ← Cadastro de cliente
    │   └── MyAccountPage.jsx     ← Área do cliente (dados + histórico de pedidos)
    │
    └── admin/
        ├── AdminLogin.jsx        ← Tela de login do admin
        ├── AdminDashboard.jsx    ← Dashboard com stats e gráficos
        ├── AdminProducts.jsx     ← CRUD de produtos (modal, upload de imagens)
        ├── AdminOrders.jsx       ← Gerenciamento de pedidos (status, arquivar)
        ├── AdminCategories.jsx   ← CRUD de categorias
        ├── AdminUsers.jsx        ← Gestão de usuários (listar, alterar role)
        └── AdminVisualEditor.jsx ← Editor visual da homepage (textos, imagens)
```

### Como os arquivos do frontend se relacionam

```
main.jsx
  │
  ├──► BrowserRouter                 (React Router)
  ├──► AuthProvider (AuthContext)     (estado de autenticação global)
  ├──► CartProvider (CartContext)     (estado do carrinho global)
  └──► App.jsx
        │
        ├── PublicLayout (layout wrapper)
        │     ├── HomePage            → usa api.js, ProductCard, SEO
        │     ├── CategoryPage        → usa api.js, ProductCard, SEO
        │     ├── ProductPage         → usa api.js, ImageGallery, CartContext, SEO
        │     ├── CartPage            → usa CartContext
        │     ├── CheckoutPage        → usa CartContext, api.js
        │     ├── OrderConfirmationPage → usa api.js (status Stripe)
        │     └── MyAccountPage       → usa AuthContext, api.js
        │
        ├── AdminLogin                → usa AuthContext
        ├── RegisterPage              → usa AuthContext
        │
        └── ProtectedRoute → AdminLayout (layout wrapper, protegido)
              ├── AdminDashboard      → usa api.js
              ├── AdminProducts       → usa api.js, MultiImageUpload
              ├── AdminOrders         → usa api.js
              ├── AdminCategories     → usa api.js
              ├── AdminUsers          → usa api.js
              └── AdminVisualEditor   → usa api.js, MultiImageUpload
```

### Função de cada arquivo do frontend

| Arquivo | Função |
|---------|--------|
| `main.jsx` | Monta a árvore React com BrowserRouter, AuthProvider e CartProvider |
| `App.jsx` | Define TODAS as rotas (públicas dentro de PublicLayout, admin dentro de ProtectedRoute+AdminLayout) |
| `index.css` | Estilos globais, classes utilitárias (btn-primary, btn-secondary, input-field, card-product) |
| `api.js` | Cria instância Axios com baseURL dinâmica, interceptor de request (log), interceptor 401 (auto-logout) |
| `AuthContext.jsx` | Gerencia user/token no localStorage, expõe `login()`, `register()`, `logout()`, `isAdmin` |
| `CartContext.jsx` | Gerencia itens do carrinho no localStorage, expõe `addItem()`, `removeItem()`, `updateQuantity()`, `clearCart()`, `total`, `itemCount` |
| `PublicLayout.jsx` | Header com logo, menu desktop/mobile, carrinho, botão dark mode, footer com redes sociais |
| `AdminLayout.jsx` | Sidebar com menu de navegação, info do usuário, botões "Ver Site" e "Sair" |
| `ProductCard.jsx` | Card reutilizável: imagem (contain/cover), badge destaque/esgotado, preço, botão adicionar |
| `ImageGallery.jsx` | Galeria interativa: imagem principal, thumbnails, setas, zoom, modal fullscreen com pinch-to-zoom e swipe |
| `MultiImageUpload.jsx` | Upload de até 5 imagens via Cloudinary, drag-and-drop para reordenar, badge "Principal" |
| `Logo.jsx` | SVG animado com CSS keyframes (fade-in cascata para "Di'" e reveal de "Moda Íntima") |
| `SEO.jsx` | Injeta dinamicamente title, meta description, canonical, Open Graph, Twitter Card e Schema.org no `<head>` |
| `ProtectedRoute.jsx` | Verifica se o usuário está logado e é admin; redireciona para `/admin/login` se não |
| `HomePage.jsx` | Banner hero dinâmico (config do banco), grid de produtos em destaque, seção features |
| `CategoryPage.jsx` | Carrega produtos filtrados por slug da categoria, exibe em grid |
| `ProductPage.jsx` | Detalhe: galeria de imagens + nome, preço, descrição, seletor de quantidade, botão comprar |
| `CartPage.jsx` | Lista itens, edita quantidades, mostra total, botões continuar comprando ou finalizar |
| `CheckoutPage.jsx` | 3 etapas: formulário de dados → seleção de pagamento (PIX/Cartão/Dinheiro) → revisão e confirmação |
| `OrderConfirmationPage.jsx` | Renderiza status dinâmico: chave PIX + WhatsApp, Stripe confirmado, cancelado ou dinheiro |
| `RegisterPage.jsx` | Formulário de cadastro de cliente (nome, email, senha) |
| `MyAccountPage.jsx` | Dados do cliente logado + lista de pedidos anteriores |
| `AdminLogin.jsx` | Formulário de login com redirecionamento para /admin |
| `AdminDashboard.jsx` | Cards de estatísticas, filtro de datas, visão geral da loja |
| `AdminProducts.jsx` | Tabela de produtos + modal de criar/editar com upload de imagens e preview |
| `AdminOrders.jsx` | Lista de pedidos com troca de status, detalhe inline, botões arquivar/excluir |
| `AdminCategories.jsx` | CRUD de categorias com ícones emoji |
| `AdminUsers.jsx` | Lista de usuários registrados, alternância de role admin/client |
| `AdminVisualEditor.jsx` | Edita textos, imagens e configurações visuais da homepage em tempo real |
