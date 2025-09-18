# Usar imagem base oficial do Node
FROM node:18-alpine

# Criar diretório da aplicação
WORKDIR /app

# Copiar dependências e instalar
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts

# Copiar restante do código
COPY . .

# Expor porta (Render define a porta via env $PORT)
ENV PORT=10000
EXPOSE $PORT

# Comando para iniciar a app
CMD ["node", "src/index.js"]
