#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

ASSUME_YES=0
REMOVE_DEPS=0

for arg in "$@"; do
  case "$arg" in
    --yes|-y)
      ASSUME_YES=1
      ;;
    --deps)
      REMOVE_DEPS=1
      ;;
    -h|--help)
      printf "Usage: ./scripts/reset.sh [--yes] [--deps]\n"
      printf "\n"
      printf "Stops services, removes Docker volumes, clears runtime files, and optionally removes node_modules.\n"
      printf "This does not run git reset or modify source files.\n"
      exit 0
      ;;
    *)
      die "Unknown option: $arg"
      ;;
  esac
done

confirm_reset() {
  if [[ "$ASSUME_YES" -eq 1 ]]; then
    return 0
  fi

  printf "This will stop Events Hub, delete the PostgreSQL Docker volume, and clear runtime logs/PID files.\n"
  if [[ "$REMOVE_DEPS" -eq 1 ]]; then
    printf "It will also remove api/node_modules and web/node_modules.\n"
  fi
  printf "It will not run git reset or delete source files.\n"
  printf "\n"
  printf "Type 'reset-events-hub' to continue: "

  local answer
  read -r answer

  if [[ "$answer" != "reset-events-hub" ]]; then
    die "Reset cancelled."
  fi
}

confirm_reset

print_info "Stopping app services while keeping Docker available for volume removal..."
"$SCRIPT_DIR/stop.sh" --keep-db

require_command docker

print_info "Removing PostgreSQL container and volume..."
(cd "$PROJECT_DIR" && docker compose down -v --remove-orphans)

print_info "Clearing runtime files..."
rm -rf "$RUNTIME_DIR"

if [[ "$REMOVE_DEPS" -eq 1 ]]; then
  print_info "Removing installed dependencies..."
  rm -rf "$API_DIR/node_modules" "$WEB_DIR/node_modules"
fi

print_info "Project runtime state has been reset."
printf "Run ./scripts/start.sh to recreate the database and start services.\n"
