FROM node:20-slim AS build
WORKDIR /app
# node:20-slim ships no OpenSSL at all — without it, `prisma generate` can't
# detect the system's libssl version and silently guesses wrong (defaults to
# openssl-1.1.x), which then fails to load at runtime with "libssl.so.1.1:
# cannot open shared object file". Installing it lets Prisma detect the
# real version (openssl-3.0.x on this Debian bookworm base) and fetch the
# matching query engine.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
RUN npx prisma generate
EXPOSE 4000
CMD ["node", "dist/index.js"]
