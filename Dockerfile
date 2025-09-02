# Alternative Dockerfile using Debian-based images to avoid musl-libc SQLite issues
# Use this if Alpine continues to have SQLite compilation problems

# Step 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy all frontend related files
COPY package.json package-lock.json vite.config.ts ./
COPY web/ ./web/

# Install dependencies and build
RUN npm ci && npm run build

# Step 2: Build backend (using Debian instead of Alpine)
FROM golang:1.22-bullseye AS backend-builder

# Install system dependencies including development tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libc6-dev \
    libsqlite3-dev \
    build-essential \
    curl \
    tar \
    bash \
    wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install SQLite from source for better compatibility and latest version
RUN curl -L https://www.sqlite.org/2024/sqlite-autoconf-3470000.tar.gz | tar xz \
    && cd sqlite-autoconf-3470000 \
    && ./configure --prefix=/usr/local \
    && make \
    && make install \
    && cd .. \
    && rm -rf sqlite-autoconf-3470000

WORKDIR /app

# Copy Go files
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build application with proper SQLite linking
RUN CGO_ENABLED=1 GOOS=linux \
    PKG_CONFIG_PATH=/usr/local/lib/pkgconfig \
    go build -a -installsuffix cgo \
    -tags "sqlite_omit_load_extension sqlite_foreign_keys sqlite_stat4" \
    -o tokilane cmd/server/main.go

# Step 3: Final image (using Debian slim for glibc compatibility)
FROM debian:bullseye-slim

# Install runtime dependencies including SQLite libraries and gosu
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    tzdata \
    sqlite3 \
    libsqlite3-0 \
    wget \
    gosu \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup -s /bin/bash -m appuser

WORKDIR /app

# Copy executable
COPY --from=backend-builder /app/tokilane .

# Copy frontend build assets
COPY --from=frontend-builder /app/dist ./dist

# Copy index.html for Inertia
COPY --from=frontend-builder /app/web/index.html ./web/

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create necessary directories with the correct permissions
RUN mkdir -p data/thumbs files && \
    chown -R appuser:appgroup /app

# Don't change to non-root user here - let entrypoint handle it

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
ENTRYPOINT ["/entrypoint.sh"]
CMD ["./tokilane"]
