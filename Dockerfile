FROM node:18

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

# Copia todo o código
COPY . .

# Executa o build do Strapi dentro da própria imagem
RUN pnpm build

EXPOSE 1337

# Inicia em modo produção (usa o admin estático que acabou de ser gerado)
CMD ["pnpm", "run", "start"]
