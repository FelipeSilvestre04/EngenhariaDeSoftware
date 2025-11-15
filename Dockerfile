# Imagem base Node
# ATUALIZAÇÃO 1: Mudando para Node 20 para atender aos requisitos do LangChain e Vite
FROM node:20-alpine

# Diretório da aplicação
WORKDIR /app

# --- ETAPA 1: INSTALAÇÃO DE DEPENDÊNCIAS DO BACKEND ---
COPY package*.json ./
# Usando --legacy-peer-deps para resolver o erro ERESOLVE
RUN npm install --legacy-peer-deps

# --- ETAPA 2: INSTALAÇÃO E BUILD DO FRONTEND (Vite) ---
WORKDIR /app/client
COPY client/package*.json ./
# CORREÇÃO CRÍTICA: Instalar dependências do cliente (incluindo 'vite')
RUN npm install --legacy-peer-deps

# Faz o build do React (Vite), gerando a pasta 'dist'
RUN npm run build
WORKDIR /app

# Copiar o restante do código (incluindo a pasta 'dist' recém-criada em client/)
COPY . .

# Expor porta (Render define $PORT)
ENV PORT=10000
EXPOSE $PORT

# Comando para iniciar a app
CMD ["node", "src/index.js"]