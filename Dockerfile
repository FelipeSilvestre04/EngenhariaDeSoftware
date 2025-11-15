# Imagem base Node
FROM node:18-alpine

# Diretório da aplicação
WORKDIR /app

# Copiar dependências e instalar
COPY package*.json ./
# Instalar dependências
RUN npm ci --production --ignore-scripts --legacy-peer-deps


# Copiar o restante do código
COPY . .

# Expor porta (Render define $PORT)
ENV PORT=10000
EXPOSE $PORT

# Comando para iniciar a app
CMD ["node", "src/index.js"]
