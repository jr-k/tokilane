# Multi-stage build pour optimiser la taille de l'image finale

# Étape 1: Build du frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copier les fichiers de configuration
COPY package.json package-lock.json ./
COPY web/ ./web/

# Installer les dépendances et builder
RUN npm ci && npm run build

# Étape 2: Build du backend
FROM golang:1.22-alpine AS backend-builder

# Installer les dépendances système nécessaires
RUN apk add --no-cache git gcc musl-dev

WORKDIR /app

# Copier les fichiers Go
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Builder l'application
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o tokilane cmd/server/main.go

# Étape 3: Image finale
FROM alpine:3.18

# Installer les dépendances runtime
RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    sqlite \
    && rm -rf /var/cache/apk/*

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

# Copier l'exécutable
COPY --from=backend-builder /app/tokilane .

# Copier les assets frontend buildés
COPY --from=frontend-builder /app/dist ./dist

# Copier l'index.html pour Inertia
COPY --from=frontend-builder /app/web/index.html ./web/

# Créer les dossiers nécessaires avec les bonnes permissions
RUN mkdir -p data/thumbs files && \
    chown -R appuser:appgroup /app

# Changer vers l'utilisateur non-root
USER appuser

# Exposer le port
EXPOSE 1323

# Variables d'environnement par défaut
ENV PORT=1323
ENV FILES_ROOT=/app/files
ENV DB_PATH=/app/data/app.db
ENV DEBUG=false

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/ || exit 1

# Commande par défaut
CMD ["./tokilane"]
