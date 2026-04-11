.PHONY: help

help: ## Display help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

lint: ## Execute linting
	$(call run_linter,)

lint-fix: ## Execute linting and fix
	$(call run_linter, \
		-e FIX_JSON_PRETTIER=true \
		-e FIX_JAVASCRIPT_PRETTIER=true \
		-e FIX_YAML_PRETTIER=true \
		-e FIX_MARKDOWN=true \
		-e FIX_MARKDOWN_PRETTIER=true \
		-e FIX_NATURAL_LANGUAGE=true)

deps-audit-fix: ## Execute dependency audit fix
	@set -u; \
	overall_status=0; \
	packages="$$(find tests -type f -name package.json -not -path '*/node_modules/*' -print | sort)"; \
	echo "Running dependency audit/fix for package.json files under tests/ ..."; \
	for pkg in $$packages; do \
		pkg_dir="$$(dirname "$$pkg")"; \
		pm_field="$$(sed -n 's/.*"packageManager"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$$pkg" | head -n 1)"; \
		pm=""; \
		case "$$pm_field" in \
			pnpm@*) pm="pnpm" ;; \
			yarn@*) pm="yarn" ;; \
			npm@*) pm="npm" ;; \
			*) \
				if [ -f "$$pkg_dir/pnpm-lock.yaml" ]; then \
					pm="pnpm"; \
				elif [ -f "$$pkg_dir/yarn.lock" ]; then \
					pm="yarn"; \
				else \
					pm="npm"; \
				fi; \
				;; \
		esac; \
		echo "---"; \
		echo "Detected $$pm in $$pkg_dir"; \
		case "$$pm" in \
			npm) \
				npm install --prefix "$$pkg_dir"; \
				echo "npm audit fix in $$pkg_dir"; \
				if ! npm --prefix "$$pkg_dir" audit fix; then \
					overall_status=1; \
				fi; \
				;; \
			pnpm) \
				corepack pnpm install --dir "$$pkg_dir"; \
				echo "pnpm audit --fix in $$pkg_dir"; \
				if ! corepack pnpm audit --dir "$$pkg_dir" --fix; then \
					overall_status=1; \
				fi; \
				;; \
			yarn) \
				corepack yarn --cwd "$$pkg_dir" install; \
				echo "yarn audit in $$pkg_dir"; \
				if ! corepack yarn --cwd "$$pkg_dir" audit; then \
					overall_status=1; \
				fi; \
				;; \
		esac; \
	done; \
	exit $$overall_status

ci: ## Execute CI tasks
	$(MAKE) deps-audit-fix || true
	$(MAKE) lint-fix

define run_linter
	DEFAULT_WORKSPACE="$(CURDIR)"; \
	LINTER_IMAGE="linter:latest"; \
	VOLUME="$$DEFAULT_WORKSPACE:$$DEFAULT_WORKSPACE"; \
	docker build --build-arg UID=$(shell id -u) --build-arg GID=$(shell id -g) --tag $$LINTER_IMAGE .; \
	docker run \
		-e DEFAULT_WORKSPACE="$$DEFAULT_WORKSPACE" \
		-e FILTER_REGEX_INCLUDE="$(filter-out $@,$(MAKECMDGOALS))" \
		-e IGNORE_GITIGNORED_FILES=true \
		$(1) \
		-v $$VOLUME \
		--rm \
		$$LINTER_IMAGE
endef

#############################
# Argument fix workaround
#############################
%:
	@: