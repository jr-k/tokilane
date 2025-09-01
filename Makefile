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

# Par défaut
all: build
