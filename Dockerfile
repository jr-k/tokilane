# Multi-stage build to optimize final image size

# Step 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy configuration files
COPY package.json package-lock.json ./
COPY web/ ./web/

# Install dependencies and build
RUN npm ci && npm run build

# Step 2: Build backend
FROM golang:1.22-alpine AS backend-builder

# Install system dependencies
RUN apk add --no-cache git gcc musl-dev

WORKDIR /app

# Copy Go files
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build application
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o tokilane cmd/server/main.go

# Step 3: Final image
FROM alpine:3.18

# Install runtime dependencies
RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    sqlite \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

# Copy executable
COPY --from=backend-builder /app/tokilane .

# Copy frontend build assets
COPY --from=frontend-builder /app/dist ./dist

# Copy index.html for Inertia
COPY --from=frontend-builder /app/web/index.html ./web/

# Create necessary directories with the correct permissions
RUN mkdir -p data/thumbs files && \
    chown -R appuser:appgroup /app

# Change to non-root user
USER appuser

# Expose port
EXPOSE 1323

# Default environment variables
ENV PORT=1323
ENV FILES_ROOT=/app/files
ENV APP_LANG=en
ENV DB_PATH=/app/data/app.db
ENV DEBUG=false

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/ || exit 1

# Default command
CMD ["./tokilane"]
