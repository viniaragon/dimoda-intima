# Di' Moda Íntima - E-commerce

Site comercial completo para loja de produtos íntimos com painel administrativo visual.

## 🚀 Como Rodar o Projeto

### Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

### Instalação

1. **Instalar dependências do Backend**

```bash
cd backend
npm install
```

2. **Inicializar o Banco de Dados**

```bash
npm run init-db
```

Isso criará o banco de dados SQLite com:
- Usuário admin padrão
- Categorias
- Produtos de exemplo

3. **Instalar dependências do Frontend**

```bash
cd ../frontend
npm install
```

### Executando o Projeto

1. **Iniciar o Backend** (Terminal 1)

```bash
cd backend
npm run dev
```

O servidor estará disponível em: http://localhost:3001

2. **Iniciar o Frontend** (Terminal 2)

```bash
cd frontend
npm run dev
```

O site estará disponível em: http://localhost:5173

---

## 🔐 Credenciais de Admin

| Email | Senha |
|-------|-------|
| admin@dimoda.com | admin123 |

Acesse o painel admin em: http://localhost:5173/admin

---

## 📁 Estrutura do Projeto

```
Di' Moda Intima/
├── frontend/              # React + Vite
│   ├── src/
│   │   ├── admin/         # Páginas do painel admin
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── contexts/      # React Context (Cart, Auth)
│   │   ├── layouts/       # Layouts (Public, Admin)
│   │   ├── pages/         # Páginas públicas
│   │   └── services/      # API client
│   └── index.html
├── backend/               # Node.js + Express
│   ├── routes/            # Rotas da API
│   ├── middleware/        # Auth middleware
│   ├── database.js        # Conexão SQLite
│   └── server.js          # Servidor Express
└── uploads/               # Imagens de produtos
```

---

## 💳 Métodos de Pagamento

| Método | Status |
|--------|--------|
| PIX | ✅ Funcionando |
| Dinheiro | ✅ Funcionando |
| Cartão de Crédito | 🚧 Em breve (requer integração com gateway) |

---

## 🛠️ Funcionalidades

### Site Público
- ✅ Home page com hero e produtos em destaque
- ✅ Listagem por categorias
- ✅ Página de produto individual
- ✅ Carrinho de compras (localStorage)
- ✅ Checkout multi-step
- ✅ Página de confirmação com PIX
- ✅ Dark mode

### Painel Administrativo
- ✅ Dashboard com estatísticas
- ✅ CRUD de Produtos
- ✅ CRUD de Categorias
- ✅ Gerenciamento de Pedidos
- ✅ Editor Visual do site

---

## 📱 Contato

- **WhatsApp**: (75) 98318-5141
- **Email**: contato@dimodaintima.com.br

---

## 🔄 Próximos Passos

1. Integrar gateway de pagamento (Mercado Pago)
2. Upload de imagens para produtos
3. Sistema de notificações por email
4. Integração com API de frete (Correios/Melhor Envio)
