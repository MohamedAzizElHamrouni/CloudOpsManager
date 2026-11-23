# ---------- Étape 1 : build ----------
FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate && npm run build

# ---------- Étape 2 : exécution ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 3001
# Démarrage : applique les migrations si elles existent, sinon crée le schéma (db push), puis lance l'API
CMD ["sh", "-c", "if [ -d prisma/migrations ]; then npx prisma migrate deploy; else npx prisma db push --skip-generate; fi && node dist/main"]
