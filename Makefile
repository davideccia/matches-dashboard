.PHONY: dev lint lint-fix typecheck release clean help

# ── Dev ───────────────────────────────────────────────────────────────────────

dev:
	pnpm dev --host 0.0.0.0

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
