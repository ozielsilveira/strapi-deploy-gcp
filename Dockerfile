FROM node:18

WORKDIR /app

COPY . .

RUN npm install -g pnpm && pnpm install

EXPOSE 1337

CMD ["pnpm", "run", "develop"]
