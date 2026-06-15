.PHONY: setup up up-host build preview lint lint-fix typecheck clean release help

# ── Setup ─────────────────────────────────────────────────────────────────────

setup: ## Install dependencies and create .env from .env.example
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo ".env created from .env.example"; \
	else \
		echo ".env already exists, skipping"; \
	fi
	pnpm install

# ── Dev ───────────────────────────────────────────────────────────────────────

dev: ## Start dev server on localhost only (PORT env var supported, fallback 3000)
	pnpm dev --host 127.0.0.1

host: ## Start dev server exposed on 0.0.0.0 (LAN / Docker)
	pnpm dev --host 0.0.0.0

# ── Build & preview ───────────────────────────────────────────────────────────

build: ## Build for production
	pnpm build

preview: ## Preview production build locally
	pnpm preview

# ── Code quality ──────────────────────────────────────────────────────────────

lint: ## Run ESLint (no auto-fix)
	pnpm eslint .

lint-fix: ## Run ESLint with auto-fix
	pnpm eslint . --fix

typecheck: ## Type-check via nuxi
	pnpm nuxi typecheck

# ── Release ───────────────────────────────────────────────────────────────────

release: ## Bump versione, commit e tag git (uso: make release V=1.2.3 [PUSH=1])
	@test -n "$(V)" || { echo "Specifica la versione: make release V=1.2.3 [PUSH=1]"; exit 1; }
	@grep -q '"version"' package.json || { echo "Campo 'version' non trovato in package.json"; exit 1; }
	@node -e "const p=require('./package.json'); p.version='$(V)'; require('fs').writeFileSync('./package.json', JSON.stringify(p, null, 2)+'\n');"
	git add package.json
	git commit -m "chore(release): v$(V)"
	git tag -a "v$(V)" -m "v$(V)"
	@if [ "$(PUSH)" = "1" ]; then \
		git push && git push --tags; \
	else \
		echo "Release v$(V) creata. Esegui 'git push && git push --tags' per pubblicare."; \
	fi

# ── Cleanup ───────────────────────────────────────────────────────────────────

clean: ## Remove build artifacts and Nuxt cache
	rm -rf .nuxt .output dist

# ── Help ──────────────────────────────────────────────────────────────────────

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*##"}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
