# PROJETO ENGENHARIA DE SOFTWARE: SecretarIA

## Ideia Inicial:
Este projeto consiste no desenvolvimento de um site para gerenciamento de projetos, com um modelo similar ao Trello. A plataforma permitirá que o usuário controle as tarefas através de um chat com uma LLM. Adicionalmente, cada tarefa contará com um chat específico para discussões e terá a funcionalidade de adicionar os compromissos no Google Agenda.

## Grupo:
Felipe Silvestre Cardoso Roberto RA:170 425

João Vítor de Moura RA:168 887

Stefani Lumy Miyahara RA:169 235

Tasso Eliézer Daflon Cicarino Canellas RA:169 247

Abner Augusto Pereira Diniz RA: 168 476

---

## 🚀 Deploy no Render

### Passo 1: Preparar o Repositório
1. Commit e push do código para o GitHub
2. Certifique-se que `.env` está no `.gitignore`

### Passo 2: Criar Web Service no Render
1. Acesse: https://dashboard.render.com/
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub
4. Configure:
   - **Name:** `engenharia-software-api`
   - **Region:** Oregon (US West)
   - **Branch:** `main` ou `dev`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

### Passo 3: Configurar Variáveis de Ambiente
No painel do Render, adicione as seguintes variáveis em **Environment**:

```
GROQ_API_KEY=sua_chave_aqui
GOOGLE_CLIENT_ID=6035557284-5edobgt8mt4qkdgcee8heo1mmpechp20.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://seu-app.onrender.com/calendar/oauth2callback
PORT=10000
```

### Passo 4: Atualizar Google Cloud Console
1. Acesse: https://console.cloud.google.com/apis/credentials
2. Adicione o novo redirect URI:
   - `https://seu-app.onrender.com/calendar/oauth2callback`
3. Adicione a origem JavaScript:
   - `https://seu-app.onrender.com`

### Passo 5: Deploy
- Clique em **"Create Web Service"**
- Aguarde o deploy (5-10 minutos)
- Acesse: `https://seu-app.onrender.com`

---

## 📡 Endpoints da API

### Health Check
- `GET /health` - Verifica status do servidor

### Calendário (Google Calendar)
- `GET /calendar` - Rota principal (redireciona para auth ou events)
- `GET /calendar/auth` - Inicia autenticação OAuth
- `GET /calendar/oauth2callback` - Callback OAuth
- `GET /calendar/events` - Lista eventos do calendário
- `GET /calendar/check` - Verifica status de autenticação
- `GET /calendar/logout` - Faz logout

### LLM
- `GET /llm/consulta` - Consulta à LLM

---

## 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Criar arquivo .env com suas credenciais
# Ver exemplo das variáveis na seção Deploy

# Iniciar servidor
npm start

# Acessar
http://localhost:10000
```

