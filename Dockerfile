# Alternative Dockerfile using Debian-based images to avoid musl-libc SQLite issues
# Use this if Alpine continues to have SQLite compilation problems

# Step 1: Build frontend
FROM --platform=$BUILDPLATFORM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy all frontend related files
COPY package.json package-lock.json vite.config.ts ./
COPY web/ ./web/

# Install dependencies and build
RUN npm ci && npm run build

# Step 2: Build backend (using Debian for multi-arch support)
FROM --platform=$BUILDPLATFORM golang:1.22-bullseye AS backend-builder

# Build arguments for cross-compilation
ARG TARGETOS
ARG TARGETARCH

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

# Install cross-compilation tools for different architectures
RUN case "${TARGETARCH}" in \
    amd64) apt-get update && apt-get install -y gcc-x86-64-linux-gnu ;; \
    arm64) apt-get update && apt-get install -y gcc-aarch64-linux-gnu ;; \
    arm) apt-get update && apt-get install -y gcc-arm-linux-gnueabihf ;; \
    ppc64le) apt-get update && apt-get install -y gcc-powerpc64le-linux-gnu ;; \
    s390x) apt-get update && apt-get install -y gcc-s390x-linux-gnu ;; \
    esac && apt-get clean && rm -rf /var/lib/apt/lists/*

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

# Set cross-compilation environment variables
RUN case "${TARGETARCH}" in \
    amd64) export CC=x86_64-linux-gnu-gcc ;; \
    arm64) export CC=aarch64-linux-gnu-gcc ;; \
    arm) export CC=arm-linux-gnueabihf-gcc ;; \
    ppc64le) export CC=powerpc64le-linux-gnu-gcc ;; \
    s390x) export CC=s390x-linux-gnu-gcc ;; \
    esac && \
    CGO_ENABLED=1 GOOS=${TARGETOS} GOARCH=${TARGETARCH} \
    PKG_CONFIG_PATH=/usr/local/lib/pkgconfig \
    go build -a -installsuffix cgo \
    -tags "sqlite_omit_load_extension sqlite_foreign_keys sqlite_stat4" \
    -ldflags="-s -w" \
    -o tokilane cmd/server/main.go

# Step 3: Final image (still using Alpine for size)
FROM alpine:3.18

# Install runtime dependencies including SQLite libraries
RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    sqlite \
    sqlite-libs \
    libc6-compat \
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
