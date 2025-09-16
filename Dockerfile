# Usar imagem base oficial do Node
FROM node:18-alpine

# Criar diretório da aplicação
WORKDIR /app

# Copiar dependências e instalar
COPY package*.json ./
RUN npm ci --only=production

# Copiar restante do código
COPY . .

# Porta usada pela app
EXPOSE 3000

# Comando para iniciar a app
CMD ["node", "src/index.js"]
