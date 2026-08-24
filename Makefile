.PHONY: dev lint lint-fix typecheck clean help

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

# ── Cleanup ───────────────────────────────────────────────────────────────────

clean: ## Remove build artifacts and Nuxt cache
	rm -rf .nuxt .output dist

# ── Help ──────────────────────────────────────────────────────────────────────

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*##"}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
