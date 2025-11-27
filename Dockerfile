# Imagem base Node
FROM node:20-alpine

# Diretório da aplicação
WORKDIR /app

# --- ETAPA 1: INSTALAÇÃO DE DEPENDÊNCIAS (CACHE) ---
# Copia SÓ os package.json primeiro para otimizar o cache do Docker
COPY package*.json ./

# Instala dependências do backend
RUN npm install --legacy-peer-deps

# --- ETAPA 2: BUILD DO FRONTEND (COM CÓDIGO-FONTE) ---
# AGORA sim, copia todo o código-fonte (backend e frontend)
COPY . .

# Entra na pasta do cliente, instala dependências e executa o build
WORKDIR /app/client
RUN if [ -f ./package.json ]; then \
			npm install --legacy-peer-deps && \
			if npm run build --silent; then exit 0; else echo "npm run build failed, trying npx vite build" && npx --yes vite build || true; fi; \
		else \
			echo "No client/package.json found — skipping frontend build"; \
		fi
WORKDIR /app

# Expor porta (Render define $PORT)
ENV PORT=10000
EXPOSE $PORT

# Comando para iniciar a app
CMD ["node", "src/index.js"]