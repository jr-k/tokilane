.PHONY: dev build lint test clean install deps-go deps-js

# Variables
GO_FILES := $(shell find . -name '*.go' -not -path './vendor/*')
TS_FILES := $(shell find web/src -name '*.ts' -o -name '*.tsx' 2>/dev/null || true)


echo APP_LANG: $(APP_LANG)

# Commandes principales
dev: deps
	@echo "🚀 Démarrage en mode développement..."
	@make -j2 dev-backend dev-frontend

dev-backend:
	@echo "🔧 Démarrage du backend Go..."
	@cd cmd/server && go run main.go

dev-frontend:
	@echo "⚛️  Démarrage du frontend React..."
	npm run dev

build: deps
	@echo "🏗️  Build de production..."
	@npm run build
	@go build -o bin/tokilane cmd/server/main.go
	@echo "✅ Build terminé"

# Build pour toutes les architectures
build-all: deps build-web
	@echo "🏗️  Build pour toutes les architectures..."
	@make build-linux-amd64
	@make build-linux-arm64
	@make build-windows-amd64
	@make build-windows-arm64
	@make build-darwin-amd64
	@make build-darwin-arm64
	@echo "✅ Tous les builds terminés"

# Build web uniquement (commun à tous)
build-web:
	@echo "⚛️  Build du frontend..."
	@npm run build

# Linux AMD64
build-linux-amd64: build-web
	@echo "🐧 Build Linux AMD64..."
	@mkdir -p bin/linux-amd64
	@GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o bin/linux-amd64/tokilane cmd/server/main.go
	@cp -r dist bin/linux-amd64/
	@echo "✅ Linux AMD64 build terminé"

# Linux ARM64
build-linux-arm64: build-web
	@echo "🐧 Build Linux ARM64..."
	@mkdir -p bin/linux-arm64
	@GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o bin/linux-arm64/tokilane cmd/server/main.go
	@cp -r dist bin/linux-arm64/
	@echo "✅ Linux ARM64 build terminé"

# Windows AMD64
build-windows-amd64: build-web
	@echo "🪟 Build Windows AMD64..."
	@mkdir -p bin/windows-amd64
	@GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o bin/windows-amd64/tokilane.exe cmd/server/main.go
	@cp -r dist bin/windows-amd64/
	@echo "✅ Windows AMD64 build terminé"

# Windows ARM64
build-windows-arm64: build-web
	@echo "🪟 Build Windows ARM64..."
	@mkdir -p bin/windows-arm64
	@GOOS=windows GOARCH=arm64 go build -ldflags="-s -w" -o bin/windows-arm64/tokilane.exe cmd/server/main.go
	@cp -r dist bin/windows-arm64/
	@echo "✅ Windows ARM64 build terminé"

# macOS AMD64 (Intel)
build-darwin-amd64: build-web
	@echo "🍎 Build macOS AMD64 (Intel)..."
	@mkdir -p bin/darwin-amd64
	@GOOS=darwin GOARCH=amd64 go build -ldflags="-s -w" -o bin/darwin-amd64/tokilane cmd/server/main.go
	@cp -r dist bin/darwin-amd64/
	@echo "✅ macOS AMD64 build terminé"

# macOS ARM64 (Apple Silicon)
build-darwin-arm64: build-web
	@echo "🍎 Build macOS ARM64 (Apple Silicon)..."
	@mkdir -p bin/darwin-arm64
	@GOOS=darwin GOARCH=arm64 go build -ldflags="-s -w" -o bin/darwin-arm64/tokilane cmd/server/main.go
	@cp -r dist bin/darwin-arm64/
	@echo "✅ macOS ARM64 build terminé"

# Création des archives de release
package: build-all
	@echo "📦 Création des archives de release..."
	@mkdir -p releases
	@cd bin/linux-amd64 && tar -czf ../../releases/tokilane-linux-amd64.tar.gz *
	@cd bin/linux-arm64 && tar -czf ../../releases/tokilane-linux-arm64.tar.gz *
	@cd bin/windows-amd64 && zip -r ../../releases/tokilane-windows-amd64.zip *
	@cd bin/windows-arm64 && zip -r ../../releases/tokilane-windows-arm64.zip *
	@cd bin/darwin-amd64 && tar -czf ../../releases/tokilane-darwin-amd64.tar.gz *
	@cd bin/darwin-arm64 && tar -czf ../../releases/tokilane-darwin-arm64.tar.gz *
	@echo "✅ Archives créées dans le dossier releases/"

install: deps-go deps-js

deps: deps-go deps-js

deps-go:
	@echo "📦 Installation des dépendances Go..."
	@go mod tidy
	@go mod download

deps-js:
	@echo "📦 Installation des dépendances JS..."
	@npm install

lint: lint-go lint-js

lint-go:
	@echo "🔍 Lint Go..."
	@golangci-lint run

lint-js:
	@echo "🔍 Lint TypeScript..."
	@npm run lint

format: format-go format-js

format-go:
	@echo "🎨 Format Go..."
	@gofmt -s -w $(GO_FILES)

format-js:
	@echo "🎨 Format TypeScript..."
	@npm run format

test:
	@echo "🧪 Tests..."
	@go test ./...

clean:
	@echo "🧹 Nettoyage..."
	@rm -rf bin/
	@rm -rf dist/
	@rm -rf releases/
	@rm -rf node_modules/
	@rm -rf data/
	@go clean

# Initialisation des dossiers
init-dirs:
	@mkdir -p data/thumbs
	@mkdir -p files
	@touch data/.gitkeep
	@touch files/.gitkeep

# Docker
docker-build:
	@docker build -t tokilane .

docker-run:
	@docker-compose up

# Build Docker multi-architecture (nécessite Docker Buildx)
docker-buildx-setup:
	@echo "🔧 Configuration de Docker Buildx..."
	@docker buildx create --name tokilane-builder --use 2>/dev/null || true
	@docker buildx inspect --bootstrap

docker-build-multiarch: docker-buildx-setup
	@echo "🐳 Build Docker multi-architecture..."
	@docker buildx build \
		--platform linux/amd64,linux/arm64,linux/arm/v7 \
		--tag tokilane:latest \
		--load \
		.

docker-build-multiarch-push: docker-buildx-setup
	@echo "🐳 Build et push Docker multi-architecture..."
	@docker buildx build \
		--platform linux/amd64,linux/arm64,linux/arm/v7,linux/ppc64le,linux/s390x \
		--tag tokilane:latest \
		--push \
		.

# Par défaut
all: build
