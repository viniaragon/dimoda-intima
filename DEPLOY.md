# Deploy do Di' Moda Íntima

## Opção 1: Railway (Recomendado - Mais Fácil)

### Passo a Passo:

1. **Crie uma conta no Railway**
   - Acesse: https://railway.app/
   - Faça login com GitHub

2. **Faça upload do projeto para o GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/SEU_USUARIO/dimoda-intima.git
   git push -u origin main
   ```

3. **Deploy do Backend**
   - No Railway, clique em "New Project"
   - Selecione "Deploy from GitHub repo"
   - Escolha o repositório
   - Configure o **Root Directory**: `backend`
   - Adicione as variáveis de ambiente:
     - `PORT`: deixe vazio (Railway define automaticamente)
     - `JWT_SECRET`: uma senha forte aleatória
   - Clique em "Deploy"
   - Copie a URL gerada (ex: `https://dimoda-backend.railway.app`)

4. **Deploy do Frontend**
   - Crie outro serviço no mesmo projeto
   - Configure o **Root Directory**: `frontend`
   - Adicione variável de ambiente:
     - `VITE_API_URL`: cole a URL do backend
   - Deploy!

---

## Opção 2: Vercel (Frontend) + Railway (Backend)

### Frontend no Vercel:
1. Acesse https://vercel.com/
2. Importe o repositório do GitHub
3. Configure Root Directory: `frontend`
4. Adicione variável: `VITE_API_URL` = URL do backend

### Backend no Railway:
- Siga os passos da Opção 1 para o backend

---

## Opção 3: Render (100% Gratuito)

1. Acesse https://render.com/
2. Crie um **Web Service** para o backend
3. Crie um **Static Site** para o frontend

---

## Configuração Importante

Antes de fazer deploy, atualize o arquivo do frontend para usar a URL do backend em produção:

No arquivo `frontend/src/services/api.js`, a URL já está configurada para funcionar tanto local quanto em produção.

Você só precisa definir a variável de ambiente `VITE_API_URL` no serviço de hospedagem.
