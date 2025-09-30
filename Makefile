# Makefile for Azura AI NoteTaker development

# Add Deno to PATH if it exists
export PATH := $(HOME)/.deno/bin:$(PATH)

.PHONY: help install dev dev-backend dev-frontend db-reset db-migrate db-seed test test-backend test-frontend build deploy clean

# Colors for output
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
NC=\033[0m # No Color

help: ## Show this help message
	@echo "$(GREEN)Azura AI NoteTaker - Development Commands$(NC)"
	@echo ""
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Install all dependencies
	@echo "$(GREEN)Installing backend dependencies...$(NC)"
	cd supabase/functions && deno cache --reload api/index.ts
	@echo "$(GREEN)Installing frontend dependencies...$(NC)"
	cd Frontend && npm install
	@echo "$(GREEN)Dependencies installed!$(NC)"

dev: ## Start full development environment
	@echo "$(GREEN)Starting development environment...$(NC)"
	@make -j 2 dev-backend dev-frontend

dev-backend: ## Start backend services (Supabase + Edge Functions)
	@echo "$(GREEN)Starting Supabase...$(NC)"
	supabase start
	@echo "$(GREEN)Starting Edge Functions...$(NC)"
	deno task dev:functions

dev-frontend: ## Start frontend development server
	@echo "$(GREEN)Starting frontend server...$(NC)"
	cd Frontend && npm run dev

db-reset: ## Reset database with migrations
	@echo "$(YELLOW)Resetting database...$(NC)"
	supabase db reset
	@echo "$(GREEN)Database reset complete!$(NC)"

db-migrate: ## Run pending migrations
	@echo "$(GREEN)Running migrations...$(NC)"
	supabase db push
	@echo "$(GREEN)Migrations applied!$(NC)"

db-seed: ## Seed database with sample data
	@echo "$(GREEN)Seeding database...$(NC)"
	supabase db seed
	@echo "$(GREEN)Database seeded!$(NC)"

test: ## Run all tests
	@make test-backend
	@make test-frontend

test-backend: ## Run backend tests
	@echo "$(GREEN)Running backend tests...$(NC)"
	cd supabase/functions && deno test --allow-all
	@echo "$(GREEN)Linting backend code...$(NC)"
	deno task lint

test-frontend: ## Run frontend tests
	@echo "$(GREEN)Running frontend tests...$(NC)"
	cd Frontend && npm test --if-present
	@echo "$(GREEN)Linting frontend code...$(NC)"
	cd Frontend && npm run lint --if-present

build: ## Build for production
	@echo "$(GREEN)Building frontend...$(NC)"
	cd Frontend && npm run build
	@echo "$(GREEN)Build complete!$(NC)"

deploy: ## Deploy to Supabase
	@echo "$(GREEN)Deploying Edge Functions...$(NC)"
	supabase functions deploy api
	@echo "$(GREEN)Pushing database changes...$(NC)"
	supabase db push
	@echo "$(GREEN)Deployment complete!$(NC)"

types: ## Generate TypeScript types from database
	@echo "$(GREEN)Generating TypeScript types...$(NC)"
	supabase gen types typescript --local > Frontend/src/types/supabase.ts
	@echo "$(GREEN)Types generated!$(NC)"

logs: ## Show Edge Function logs
	@echo "$(GREEN)Showing Edge Function logs...$(NC)"
	supabase functions logs

clean: ## Clean build artifacts and dependencies
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	rm -rf Frontend/build Frontend/dist Frontend/node_modules
	rm -rf supabase/.temp
	@echo "$(GREEN)Clean complete!$(NC)"

stop: ## Stop all services
	@echo "$(YELLOW)Stopping services...$(NC)"
	supabase stop
	@echo "$(GREEN)Services stopped!$(NC)"

status: ## Check service status
	@echo "$(GREEN)Checking service status...$(NC)"
	supabase status
	
env: ## Copy environment files
	@echo "$(GREEN)Setting up environment files...$(NC)"
	@if [ ! -f .env.local ]; then cp .env.example .env.local && echo "Created .env.local"; fi
	@if [ ! -f Frontend/.env.local ]; then cp Frontend/.env.example Frontend/.env.local && echo "Created Frontend/.env.local"; fi
	@echo "$(GREEN)Environment files ready!$(NC)"
	@echo "$(YELLOW)Please update the .env.local files with your actual values$(NC)"

curl-health: ## Test health endpoint
	@echo "$(GREEN)Testing health endpoint...$(NC)"
	curl http://localhost:54321/functions/v1/api/health | jq

curl-auth: ## Test auth endpoint (requires JWT token)
	@echo "$(GREEN)Testing auth endpoint...$(NC)"
	@echo "$(YELLOW)Note: Replace <JWT> with an actual token$(NC)"
	@echo "curl -H 'Authorization: Bearer <JWT>' http://localhost:54321/functions/v1/api/auth/profile | jq"