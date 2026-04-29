#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

usage() {
  printf "Usage: ./scripts/db.sh <migrate|revert|reset|shell>\n"
  printf "\n"
  printf "Commands:\n"
  printf "  migrate  Run TypeORM migrations\n"
  printf "  revert   Revert the last TypeORM migration\n"
  printf "  reset    Reset the local PostgreSQL Docker volume\n"
  printf "  shell    Open psql inside the PostgreSQL container\n"
}

command_name="${1:-}"

case "$command_name" in
  migrate)
    require_command corepack
    print_info "Running database migrations..."
    (cd "$API_DIR" && pnpm_exec db:migrate)
    ;;
  revert)
    require_command corepack
    print_info "Reverting last database migration..."
    (cd "$API_DIR" && pnpm_exec db:revert)
    ;;
  reset)
    "$SCRIPT_DIR/reset.sh"
    ;;
  shell)
    require_command docker
    print_info "Opening PostgreSQL shell..."
    (cd "$PROJECT_DIR" && docker compose exec postgres psql -U events_hub -d events_hub)
    ;;
  -h|--help|"")
    usage
    ;;
  *)
    die "Unknown db command: $command_name"
    ;;
esac
