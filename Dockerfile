# Imagem base Node
FROM node:20-alpine

# Diretório da aplicação
WORKDIR /app

# Garante que a pasta do cliente exista antes do COPY (evita inconsistências de layer)
RUN mkdir -p /app/client

# --- ETAPA 1: INSTALAÇÃO DE DEPENDÊNCIAS (CACHE) ---
# Copia SÓ os manifests para otimizar o cache do Docker (evita wildcard inconsistências do BuildKit)
COPY package.json package-lock.json ./
COPY client/package.json client/package-lock.json ./client/

# Instala dependências do backend
RUN npm install --legacy-peer-deps

# Instala dependências do frontend (em /app/client)
WORKDIR /app/client
RUN npm install --legacy-peer-deps
WORKDIR /app

# --- ETAPA 2: BUILD DO FRONTEND (COM CÓDIGO-FONTE) ---
# AGORA sim, copia todo o código-fonte (backend e frontend)
COPY . .

# Entra na pasta do cliente, que agora tem o código-fonte
WORKDIR /app/client
# Executa o build (agora o Vite vai encontrar o index.html)
RUN npm run build
WORKDIR /app

# Expor porta (Render define $PORT)
ENV PORT=10000
EXPOSE $PORT

# Comando para iniciar a app
CMD ["node", "src/index.js"]