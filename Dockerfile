# Imagem base Node
FROM node:18-alpine

# Diretório da aplicação
WORKDIR /app

# --- ETAPA 1: INSTALAÇÃO DE DEPENDÊNCIAS GERAIS E DO BACKEND ---
# Copiar os arquivos de dependência de ambos os módulos
COPY package*.json ./
COPY client/package*.json ./client/

# CORREÇÃO CRÍTICA: Instalar dependências usando --legacy-peer-deps para resolver o erro ERESOLVE
# Usamos 'install' e não 'ci' para maior tolerância a conflitos
RUN npm install --legacy-peer-deps

# --- ETAPA 2: BUILD DO FRONTEND (Vite) ---
WORKDIR /app/client
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