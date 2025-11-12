# 🔧 Guia de Deploy - Render

## ⚠️ IMPORTANTE: Configuração Separada

Este projeto tem **2 aplicações separadas**:

### 1️⃣ Backend (API) - Web Service
- **Localização**: Raiz do projeto
- **Root Directory**: `.` ou deixe em branco
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Variáveis de Ambiente**:
  ```
  NODE_ENV=production
  PORT=10000
  GROQ_API_KEY=sua-chave
  GOOGLE_CLIENT_ID=seu-client-id
  GOOGLE_CLIENT_SECRET=seu-secret
  REDIRECT_URI=https://seu-backend.onrender.com/calendar/oauth2callback
  FRONTEND_URL=https://seu-frontend.onrender.com
  ```

### 2️⃣ Frontend (Client) - Static Site
- **Localização**: Pasta `client/`
- **Root Directory**: `client`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Variáveis de Ambiente**:
  ```
  VITE_BACKEND_URL=https://seu-backend.onrender.com
  ```

---

## 📝 Passo a Passo

### Backend

1. No Render Dashboard, clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório GitHub
3. Configure:
   - **Name**: `secretaria-backend` (ou outro nome)
   - **Root Directory**: `.` (ou deixe vazio)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Branch**: `prod` (ou sua branch principal)

4. Adicione as variáveis de ambiente (ver acima)
5. Clique em **"Create Web Service"**
6. **Aguarde o deploy terminar**
7. **Copie a URL do backend** (ex: `https://secretaria-backend.onrender.com`)

### Frontend

1. No Render Dashboard, clique em **"New +"** → **"Static Site"**
2. Conecte o **mesmo repositório**
3. Configure:
   - **Name**: `secretaria-frontend` (ou outro nome)
   - **Root Directory**: `client` ⚠️ **IMPORTANTE**
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Branch**: `prod` (ou sua branch principal)

4. Adicione a variável de ambiente:
   ```
   VITE_BACKEND_URL=https://SEU-BACKEND.onrender.com
   ```
   ⚠️ **Substitua pela URL real do seu backend!**

5. Clique em **"Create Static Site"**

---

## ✅ Checklist Pós-Deploy

- [ ] Backend está rodando sem erros
- [ ] Frontend carregou corretamente
- [ ] Atualizou `VITE_BACKEND_URL` no frontend com URL do backend
- [ ] Atualizou Google OAuth Console:
  - Redirect URI: `https://SEU-BACKEND.onrender.com/calendar/oauth2callback`
  - JavaScript Origins: `https://SEU-FRONTEND.onrender.com`
- [ ] Testou login com Google
- [ ] Testou carregar eventos do calendário
- [ ] Testou chat com LLM

---

## 🐛 Troubleshooting

### Erro: "Cannot find module '/opt/render/project/src/client/index.js'"

**Causa**: Root Directory configurado incorretamente no backend.

**Solução**: No serviço do backend:
1. Vá em **Settings**
2. **Root Directory** deve estar vazio ou `.`
3. **Start Command** deve ser `npm start`
4. Salve e aguarde redeploy

---

### Erro: Frontend não consegue acessar backend (CORS/Network)

**Causa**: `VITE_BACKEND_URL` não configurado ou incorreto.

**Solução**:
1. No Static Site, vá em **Environment**
2. Certifique-se que `VITE_BACKEND_URL` está com a URL completa do backend
3. Salve e aguarde redeploy

---

### Erro: Autenticação OAuth não funciona

**Causa**: Redirect URIs não configurados no Google Console.

**Solução**:
1. Acesse [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Edite suas credenciais OAuth 2.0
3. Adicione em **Authorized redirect URIs**:
   - `https://SEU-BACKEND.onrender.com/calendar/oauth2callback`
4. Adicione em **Authorized JavaScript origins**:
   - `https://SEU-FRONTEND.onrender.com`
   - `https://SEU-BACKEND.onrender.com`

---

### Backend demora para responder (primeira requisição)

**Causa**: Plano Free do Render hiberna após 15 min de inatividade.

**Solução**: Normal no plano gratuito. Primeira requisição leva ~30s para "acordar" o serviço.

---

## 📚 Estrutura de Diretórios no Render

### Backend (Root Directory: `.`)
```
/opt/render/project/src/
├── src/
│   ├── index.js        ← Start Command executa isso
│   ├── app.js
│   └── ...
├── package.json
└── ...
```

### Frontend (Root Directory: `client`)
```
/opt/render/project/src/client/
├── src/
│   └── ...
├── dist/              ← Publish Directory
├── package.json
└── ...
```

---

## 🔗 URLs Importantes

- **Render Dashboard**: https://dashboard.render.com
- **Google Cloud Console**: https://console.cloud.google.com/apis/credentials
- **Render Docs**: https://render.com/docs

---

## 💡 Dicas

1. ⏱️ Deploy leva 3-5 minutos geralmente
2. 📊 Veja logs em tempo real no Dashboard
3. 🔄 Git push automático faz redeploy
4. 💰 Plano Free hiberna após 15 min (primeiro acesso leva ~30s)
5. 🌍 Sempre use URLs completas (com https://) nas variáveis de ambiente
