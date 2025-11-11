# 🎨 Frontend - SecretarIA Client

Frontend em React + Vite para o projeto SecretarIA - Sistema de gerenciamento de projetos com LLM.

## 📦 Tecnologias

- **React 19** - Biblioteca UI
- **Vite** - Build tool e dev server
- **React Calendar** - Componente de calendário

## 🚀 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Criar arquivo .env (copie de .env.example)
cp .env.example .env

# Edite o .env com a URL do backend
# VITE_API_URL=http://localhost:10000

# Iniciar dev server
npm run dev

# Acessar
# http://localhost:5173
```

## 🏗️ Build para Produção

```bash
npm run build
```

Os arquivos estáticos serão gerados em `dist/`.

## 🔌 Conectando com o Backend

### Usando o ApiClient

```javascript
import { api } from './utils/api.js';

// GET request
const response = await api.get('/calendar/events');
const events = await response.json();

// POST request
const response = await api.post('/llm/consulta', {
  message: 'Olá, LLM!'
});
```

### Exemplo em Componente React

```javascript
import { useState, useEffect } from 'react';
import { api } from './utils/api';

function CalendarEvents() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const response = await api.get('/calendar/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  }

  return (
    <div>
      {events.map(event => (
        <div key={event.id}>{event.title}</div>
      ))}
    </div>
  );
}
```

## 🌍 Variáveis de Ambiente

```bash
# .env local
VITE_API_URL=http://localhost:10000

# .env produção (Render)
VITE_API_URL=https://seu-backend.onrender.com
```

⚠️ **Importante**: Variáveis devem ter prefixo `VITE_` para serem acessíveis no código.

## 📁 Estrutura

```
client/
├── src/
│   ├── features/          # Features da aplicação
│   │   ├── auth/          # Autenticação Google
│   │   ├── calendar/      # Visualização de calendário
│   │   ├── chat/          # Chat com LLM
│   │   └── projects/      # Gerenciamento de projetos
│   ├── utils/             # Utilitários
│   │   ├── api.js         # Cliente API (novo!)
│   │   └── env.js         # Gerenciador de env vars
│   ├── App.jsx            # Componente principal
│   └── main.jsx           # Entry point
└── vite.config.js         # Configuração Vite
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Preview da build
- `npm run lint` - Linter ESLint

## 🚀 Deploy no Render

Ver instruções completas em: [../DEPLOY.md](../DEPLOY.md)

**Quick Start:**
1. Criar **Static Site** no Render
2. Root Directory: `client`
3. Build: `npm install && npm run build`
4. Publish: `dist`
5. Adicionar: `VITE_API_URL=<URL_DO_BACKEND>`
