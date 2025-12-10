# 🤖 SecretarIA

> Plataforma de gerenciamento de projetos estilo Kanban com assistente de IA integrado

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Funcionalidades

- 📋 **Kanban Board** - Gerencie tarefas em colunas (To-Do, In Progress, Done)
- 🤖 **Chat com IA** - Controle tarefas e agenda via conversa natural
- 📅 **Google Calendar** - Sincronização automática de eventos
- 📧 **Gmail** - Criação de rascunhos de email pelo chat
- 🏷️ **Tags** - Organize tarefas com etiquetas coloridas
- 🌙 **Dark Mode** - Interface adaptável

## 🏗️ Arquitetura

```
├── client/          # Frontend React + Vite
│   ├── src/
│   │   ├── features/    # Componentes por funcionalidade
│   │   ├── shared/      # Componentes compartilhados
│   │   └── App.jsx
│   └── package.json
│
├── src/             # Backend Node.js + Express
│   ├── modules/
│   │   ├── auth/        # Autenticação Google OAuth + JWT
│   │   ├── calendar/    # Integração Google Calendar/Gmail
│   │   ├── llm/         # Agente LangChain + Groq
│   │   ├── projects/    # CRUD de projetos
│   │   └── tasks/       # CRUD de tarefas + tags
│   ├── shared/
│   │   ├── config/      # Variáveis de ambiente
│   │   ├── database/    # Pool PostgreSQL
│   │   └── middleware/  # Auth middleware
│   └── app.js
│
└── test/            # Testes unitários (node:test)
```

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- PostgreSQL 15+
- Conta Google Cloud (OAuth)
- API Key do Groq

### Instalação

```bash
# Clone
git clone https://github.com/seu-usuario/EngenhariaDeSoftware.git
cd EngenhariaDeSoftware

# Backend
npm install

# Frontend
cd client && npm install && cd ..

# Configurar variáveis
cp .env.example .env
# Edite o .env com suas credenciais
```

### Variáveis de Ambiente

```env
# API Keys
GROQ_API_KEY=gsk_xxx
HFTOKEN=hf_xxx

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Server
PORT=3000
```

### Executar

```bash
# Desenvolvimento (backend + frontend)
npm run dev          # Backend: localhost:3000
cd client && npm run dev  # Frontend: localhost:5173

# Testes
npm test                    # Teste placeholder
node --test test/*.test.js  # Todos os testes unitários (41 testes)
```

## 📡 API Endpoints

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/auth/login` | Inicia OAuth Google |
| GET | `/auth/callback` | Callback OAuth |
| GET | `/auth/verify` | Verifica token JWT |
| POST | `/auth/logout` | Logout |

### Projetos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/projects` | Lista projetos |
| GET | `/api/projects/:id` | Busca projeto |
| POST | `/api/projects` | Cria projeto |
| DELETE | `/api/projects/:id` | Remove projeto |

### Tarefas
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/tasks?projectId=X` | Lista tarefas |
| POST | `/api/tasks` | Cria tarefa |
| PUT | `/api/tasks/:id` | Atualiza tarefa |
| DELETE | `/api/tasks/:id` | Remove tarefa |

### LLM
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/llm/consulta` | Envia prompt para IA |

### Calendar
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/calendar/events` | Lista eventos |
| POST | `/calendar/events` | Cria evento |
| DELETE | `/calendar/events/:id` | Cancela evento |

## 🧪 Testes

```bash
# Rodar todos os testes
node --test test/*.test.js

# Testes individuais
node --test test/auth.service.test.js      # JWT (12 testes)
node --test test/projects.service.test.js  # Projetos (15 testes)
node --test test/tasks.service.test.js     # Tarefas (14 testes)
```

## ☁️ Deploy (Render)

1. **Web Service** para o backend
   - Build: `npm install`
   - Start: `npm start`

2. **Static Site** para o frontend
   - Build: `cd client && npm install && npm run build`
   - Publish: `client/dist`

3. **PostgreSQL** database no Render

4. Configure as variáveis de ambiente no painel

## 👥 Equipe

| Nome | RA |
|------|-----|
| Felipe Silvestre Cardoso Roberto | 170425 |
| João Vítor de Moura | 168887 |
| Stefani Lumy Miyahara | 169235 |
| Tasso Eliézer Daflon Cicarino Canellas | 169247 |
| Abner Augusto Pereira Diniz | 168476 |

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.
