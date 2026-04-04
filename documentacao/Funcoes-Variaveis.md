# Di' Moda Íntima — Índice de Funções e Variáveis

> Este documento lista as **principais funções e variáveis** do projeto, explicando o que fazem e onde estão localizadas. Não contém o código das funções — apenas seus nomes e descrições.

---

## BACKEND

---

### `server.js`

| Nome | Tipo | Descrição |
|------|------|-----------|
| `app` | Variável | Instância do Express principal |
| `PORT` | Variável | Porta do servidor (env ou 3001) |
| `startServer()` | Função | Inicializa o banco, registra todas as rotas e inicia o servidor HTTP |

---

### `database-firebase.js`

#### Variáveis

| Nome | Descrição |
|------|-----------|
| `serviceAccount` | Objeto com credenciais do Firebase (lido de JSON local ou variáveis de ambiente) |
| `db` | Instância do Firestore (`admin.firestore()`) usada em todas as queries |

#### Funções — Produtos

| Nome | Descrição |
|------|-----------|
| `getAllProducts(options)` | Retorna todos os produtos com filtros opcionais: `featured`, `category`, `limit` |
| `getProductById(id)` | Retorna um produto pelo ID do documento Firestore |
| `createProduct(product)` | Cria um novo produto no Firestore com timestamp automático |
| `updateProduct(id, product)` | Atualiza campos de um produto existente |
| `deleteProduct(id)` | Remove um produto do Firestore |

#### Funções — Categorias

| Nome | Descrição |
|------|-----------|
| `getAllCategories()` | Retorna todas as categorias cadastradas |
| `getCategoryBySlug(slug)` | Busca uma categoria pelo seu slug (ex: `vibrador`) |
| `createCategory(category)` | Cria uma nova categoria |
| `updateCategory(id, category)` | Atualiza uma categoria existente |
| `deleteCategory(id)` | Remove uma categoria |

#### Funções — Pedidos

| Nome | Descrição |
|------|-----------|
| `getAllOrders()` | Retorna todos os pedidos ordenados por data (mais recente primeiro) |
| `getOrderById(id)` | Retorna um pedido pelo ID |
| `createOrder(order)` | Cria um novo pedido com status `pending` e timestamp |
| `updateOrderStatus(id, status)` | Atualiza apenas o status de um pedido |
| `updateOrderPayment(id, paymentData)` | Atualiza `payment_id` e `payment_status` do pedido |
| `deleteOrder(id)` | Remove um pedido permanentemente |
| `archiveOrder(id)` | Move um pedido para a coleção `archivedOrders` e remove dos ativos |
| `archiveAllOrders()` | Cria um snapshot de todos os pedidos em `orderArchives` e limpa a coleção `orders` |
| `getArchivedOrders()` | Retorna pedidos individuais arquivados |
| `getOrderArchives()` | Retorna snapshots/lotes de arquivamento |
| `getStats(startDate, endDate)` | Calcula e retorna: totalProducts, totalOrders, pendingOrders, totalRevenue (com filtro de data) |

#### Funções — Usuários

| Nome | Descrição |
|------|-----------|
| `getUserByEmail(email)` | Busca usuário por email (usado no login) |
| `createUser(user)` | Cria novo usuário com timestamp |
| `getAllUsers()` | Retorna todos os usuários (sem expor senhas) |
| `updateUserRole(id, role)` | Altera role de um usuário (admin/client) |
| `getOrdersByEmail(email)` | Retorna pedidos de um usuário específico pelo email |

#### Funções — Configuração

| Nome | Descrição |
|------|-----------|
| `getSiteConfig()` | Retorna configurações visuais do site (doc `config/site`) |
| `updateSiteConfig(config)` | Atualiza configurações do site (merge) |
| `initDatabase()` | Verifica e cria admin padrão, categorias padrão, produtos de exemplo e config inicial |

---

### `middleware/auth.js`

| Nome | Tipo | Descrição |
|------|------|-----------|
| `JWT_SECRET` | Variável | Segredo JWT (env ou fallback hardcoded) |
| `authMiddleware(req, res, next)` | Função | Valida token Bearer do header, injeta `req.userId`, `req.userEmail`, `req.userRole` |
| `adminMiddleware(req, res, next)` | Função | Verifica se `req.userRole === 'admin'`, bloqueia com 403 se não |
| `generateToken(user)` | Função | Gera JWT com payload `{id, email, role}` e expiração de 7 dias |

---

### `routes/auth.js`

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/login` | POST | Valida email+senha via bcrypt, retorna JWT + dados do usuário |
| `/register` | POST | Cria conta de cliente (role `client`), retorna JWT |
| `/me` | GET | Retorna dados do usuário logado (requer auth) |
| `/me/orders` | GET | Retorna pedidos do usuário logado (requer auth) |

---

### `routes/products.js`

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/` | GET | Lista produtos (filtros: `category`, `featured`, `limit`) — público |
| `/:id` | GET | Retorna um produto pelo ID — público |
| `/` | POST | Cria produto (requer admin) — suporta array `images[]` |
| `/:id` | PUT | Atualiza produto (requer admin) |
| `/:id` | DELETE | Remove produto (requer admin) |

---

### `routes/categories.js`

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/` | GET | Lista todas as categorias — público |
| `/:slug` | GET | Retorna categoria pelo slug — público |
| `/` | POST | Cria categoria (requer admin) |
| `/:id` | PUT | Atualiza categoria (requer admin) |
| `/:id` | DELETE | Remove categoria (requer admin) |

---

### `routes/orders.js`

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/` | GET | Lista todos os pedidos (requer admin) |
| `/:id` | GET | Retorna pedido pelo ID — público |
| `/` | POST | Cria pedido — público. Dispara `notifyAdminEmail()` em background |
| `/:id/status` | PUT | Atualiza status do pedido (requer admin). Valores válidos: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled` |
| `/:id` | DELETE | Exclui pedido permanentemente (requer admin) |
| `/:id/archive` | POST | Arquiva pedido individual (requer admin) |
| `/archive-all` | POST | Arquiva todos os pedidos e reseta (requer admin) |
| `/archived` | GET | Lista pedidos arquivados individualmente (requer admin) |
| `/archives` | GET | Lista snapshots de arquivamento em lote (requer admin) |

---

### `routes/pix.js`

| Nome | Tipo | Descrição |
|------|------|-----------|
| `stripe` | Variável | Instância do Stripe SDK (null se chave não configurada) |
| `FRONTEND_URL` | Variável | URL do frontend para redirects pós-pagamento |
| `PIX_KEY` | Variável | Chave PIX estática da loja (`75983185141`) |
| `PIX_BENEFICIARY` | Variável | Nome do beneficiário PIX (`Di' Moda Íntima`) |

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/create` | POST | Gera dados do PIX manual (chave, beneficiário, valor, link WhatsApp) |
| `/card/create` | POST | Cria Stripe Checkout Session com `payment_method_types: ['card']` e line items |
| `/status/:sessionId` | GET | Consulta status do pagamento no Stripe pela session ID |
| `/webhook` | POST | Recebe eventos do Stripe. Se `checkout.session.completed` e `paid`, confirma o pedido |

---

### `routes/upload.js`

| Nome | Tipo | Descrição |
|------|------|-----------|
| `storage` | Variável | Configuração Multer em memória (sem salvar arquivo no disco) |
| `upload` | Variável | Middleware Multer (max 10MB, apenas imagens) |

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/` | POST | Recebe imagem via form-data, faz upload para Cloudinary (pasta `dimoda-intima/products`, otimização automática, max 800x1000), retorna URL |
| `/:publicId` | DELETE | Remove imagem do Cloudinary pelo public ID |

---

### `routes/config.js`

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/` | GET | Retorna configurações do site — público |
| `/` | PUT | Atualiza configurações do site (requer admin) |

---

### `routes/users.js`

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/` | GET | Lista todos os usuários sem senhas (requer admin) |
| `/:id/role` | PUT | Altera role do usuário para `admin` ou `client` (requer admin) |

---

### `services/emailNotification.js`

| Nome | Tipo | Descrição |
|------|------|-----------|
| `RESEND_API_KEY` | Variável | Chave da API Resend (env) |
| `ADMIN_EMAIL` | Variável | Email destino do admin (env ou fallback `dimodaintima@gmail.com`) |
| `FROM_EMAIL` | Variável | Email de remetente (env ou fallback `onboarding@resend.dev`) |
| `FRONTEND_URL` | Variável | URL base do frontend para montar links dinâmicos no email |
| `formatOrderEmail(order, isPaid, isCustomer)` | Função | Monta HTML dinâmico do email de acordo com o status e destinatário |
| `sendOrderEmails(order, isPaid)` | Função | Dispara emails paralelamente para admin e cliente informando status |

---

### `services/whatsappNotification.js`

| Nome | Tipo | Descrição |
|------|------|-----------|
| `ADMIN_WHATSAPP` | Variável | Número WhatsApp do admin (`5575983185141`) |
| `CALLMEBOT_API_KEY` | Variável | Chave da API CallMeBot (env, opcional) |
| `formatOrderMessage(order)` | Função | Formata mensagem de texto do pedido para WhatsApp |
| `generateWhatsAppUrl(phone, message)` | Função | Gera URL `wa.me` com mensagem pré-preenchida |
| `notifyAdminWhatsApp(order)` | Função | Envia via CallMeBot se configurado, senão gera link manual |

---

## FRONTEND

---

### `main.jsx`

| Nome | Tipo | Descrição |
|------|------|-----------|
| — | Setup | Monta `BrowserRouter > AuthProvider > CartProvider > App` no DOM |

---

### `App.jsx`

| Nome | Tipo | Descrição |
|------|------|-----------|
| `App()` | Componente | Define todas as rotas: públicas (dentro de PublicLayout), auth (/login, /cadastro) e admin (dentro de ProtectedRoute + AdminLayout) |

---

### `services/api.js`

| Nome | Tipo | Descrição |
|------|------|-----------|
| `API_URL` | Variável | Base URL da API (env `VITE_API_URL` ou vazio para proxy local) |
| `api` | Variável | Instância Axios configurada com Content-Type JSON |
| Interceptor request | — | Loga `[API] METHOD url` no console |
| Interceptor response 401 | — | Remove token/user do localStorage e redireciona para `/admin/login` |

---

### `contexts/AuthContext.jsx`

| Nome | Tipo | Descrição |
|------|------|-----------|
| `AuthContext` | Context | Contexto React de autenticação |
| `useAuth()` | Hook | Acessa o contexto (user, login, register, logout, isAdmin, loading) |
| `AuthProvider` | Componente | Restaura sessão do localStorage, expõe funções de auth |
| `login(email, password)` | Função | Chama POST `/api/auth/login`, salva token e user |
| `register(name, email, password)` | Função | Chama POST `/api/auth/register`, salva token e user |
| `logout()` | Função | Limpa localStorage e headers, reseta user para null |
| `isAdmin` | Variável | Boolean derivado: `user?.role === 'admin'` |

---

### `contexts/CartContext.jsx`

| Nome | Tipo | Descrição |
|------|------|-----------|
| `CartContext` | Context | Contexto React do carrinho |
| `useCart()` | Hook | Acessa o contexto (items, addItem, removeItem, updateQuantity, clearCart, total, itemCount) |
| `CartProvider` | Componente | Persiste carrinho no localStorage, calcula total e contagem |
| `addItem(product, quantity)` | Função | Adiciona item ao carrinho (incrementa se já existe) |
| `removeItem(productId)` | Função | Remove item do carrinho pelo ID |
| `updateQuantity(productId, quantity)` | Função | Altera quantidade (remove se ≤ 0) |
| `clearCart()` | Função | Esvazia o carrinho |
| `total` | Variável | Soma calculada: `preço × quantidade` de todos os itens |
| `itemCount` | Variável | Soma de todas as quantidades |

---

### `components/ProductCard.jsx`

| Nome | Tipo | Descrição |
|------|------|-----------|
| `ProductCard({ product })` | Componente | Card de produto reutilizável com imagem, nome, preço e botão comprar |
| `handleAddToCart(e)` | Função | Previne navegação e adiciona produto ao carrinho via CartContext |
| `formatPrice(price)` | Função | Formata número como moeda BRL (`Intl.NumberFormat`) |
| `getImage()` | Função | Retorna primeira imagem do array `images[]` ou fallback `image` |
| `getImageFit()` | Função | Retorna classe CSS `object-cover` ou `object-contain` conforme `image_fit` |

---

### `components/ImageGallery.jsx`

| Nome | Tipo | Descrição |
|------|------|-----------|
| `ImageGallery({ images, productName, imageFit })` | Componente | Galeria interativa com zoom, navegação e modal fullscreen |
| `activeIndex` | Estado | Índice da imagem atualmente exibida |
| `isModalOpen` | Estado | Controla abertura do modal fullscreen |
| `goToNext(e)` | Função | Avança para próxima imagem (circular) |
| `goToPrev(e)` | Função | Volta para imagem anterior (circular) |
| `handleImageClick()` | Função | Abre modal fullscreen |
| `handleTouchStart/End` | Funções | Detecta swipe horizontal para trocar imagem no mobile |

---

### `components/MultiImageUpload.jsx`

| Nome | Tipo | Descrição |
|------|------|-----------|
| `MultiImageUpload({ images, onChange })` | Componente | Upload e gerenciamento de até 5 imagens de produto |
| `MAX_IMAGES` | Constante | Limite: 5 imagens por produto |
| `handleFileSelect(e)` | Função | Valida, uploada para Cloudinary via `/api/upload` e atualiza lista |
| `removeImage(index)` | Função | Remove imagem da lista pelo índice |
| `handleDragStart/DragOver/DragEnd` | Funções | Drag-and-drop nativo para reordenar imagens |

---

### `components/Logo.jsx`

| Nome | Tipo | Descrição |
|------|------|-----------|
| `Logo({ className })` | Componente | SVG animado do logo "Di' Moda Íntima" com CSS keyframes |

---

### `components/SEO.jsx`

| Nome | Tipo | Descrição |
|------|------|-----------|
| `SITE_NAME` | Constante | Nome do site: `Di' Moda Íntima` |
| `SITE_URL` | Constante | URL base: `https://dimoda-intima.vercel.app` |
| `SEO({ title, description, canonical, image, type, product, noIndex })` | Componente | Injeta meta tags no `<head>` dinamicamente |
| `updateMetaTag(selector, attribute, value)` | Função | Cria ou atualiza uma meta tag no head |

---

### `components/ProtectedRoute.jsx`

| Nome | Tipo | Descrição |
|------|------|-----------|
| `ProtectedRoute({ children })` | Componente | Verifica `user` e `isAdmin` via AuthContext; redireciona para `/admin/login` se falhar |

---

### `layouts/PublicLayout.jsx`

| Nome | Tipo | Descrição |
|------|------|-----------|
| `categories` | Constante | Array com nomes e slugs das categorias para o menu de navegação |
| `PublicLayout()` | Componente | Layout público: logo, header sticky, menu responsivo, footer, dark mode toggle |
| `mobileMenuOpen` | Estado | Controla visibilidade do menu mobile |
| `darkMode` | Estado | Controla o tema dark/light |
| `isScrolled` | Estado | Detecta scroll para efeito de header sticky com blur |
| `toggleDarkMode()` | Função | Alterna classe `dark` no `<html>` |

---

### `layouts/AdminLayout.jsx`

| Nome | Tipo | Descrição |
|------|------|-----------|
| `menuItems` | Constante | Array com {path, icon, label} dos itens do menu admin |
| `AdminLayout()` | Componente | Layout admin: sidebar, header mobile, area de conteúdo |
| `sidebarOpen` | Estado | Controla visibilidade da sidebar em mobile |
| `handleLogout()` | Função | Faz logout e redireciona para `/admin/login` |

---

### `pages/HomePage.jsx`

| Nome | Tipo | Descrição |
|------|------|-----------|
| `HomePage()` | Componente | Página inicial: hero, produtos destaque, features |
| `featuredProducts` | Estado | Lista de produtos em destaque carregados da API |
| `siteConfig` | Estado | Configurações visuais dinâmicas vindas do backend |
| `heroLoaded` | Estado | Controla fade-in da imagem hero |
| `loadFeaturedProducts()` | Função | Busca `GET /api/products?featured=true&limit=6` |
| `loadSiteConfig()` | Função | Busca `GET /api/site-config` |
| `sampleProducts` | Constante | Array de produtos placeholder caso a API falhe |

---

### `pages/CheckoutPage.jsx`

| Nome | Tipo | Descrição |
|------|------|-----------|
| `paymentMethods` | Constante | Array com as 3 opções de pagamento (pix, cash, card) |
| `CheckoutPage()` | Componente | Checkout em 3 etapas |
| `step` | Estado | Etapa atual (1=dados, 2=pagamento, 3=revisão) |
| `customerData` | Estado | Objeto com name, phone, address, notes |
| `paymentMethod` | Estado | Método selecionado: `pix`, `cash` ou `card` |
| `handleSubmit()` | Função | Cria pedido via API, depois: gera PIX, cria Stripe session, ou confirma dinheiro |
| `isStep1Valid` | Variável | Validação: name + phone + address preenchidos |

---

### `pages/OrderConfirmationPage.jsx`

| Nome | Tipo | Descrição |
|------|------|-----------|
| `OrderConfirmationPage()` | Componente | Página de confirmação com renderização condicional por status |
| `paymentStatus` | Estado | Status atual: `checking`, `pix`, `approved`, `canceled`, `cash`, `pending` |
| `pixKey` | Variável | Chave PIX (do state ou fallback hardcoded) |
| `copyPixKey()` | Função | Copia chave PIX para clipboard |
| `WhatsAppButton` | Componente interno | Botão verde com link wa.me para enviar comprovante |
| `renderContent()` | Função | Renderiza UI diferente para cada status de pagamento |
