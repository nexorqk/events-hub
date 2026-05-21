#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

STOP_ARGS=()
KEEP_DB=0

for arg in "$@"; do
  case "$arg" in
    --keep-db)
      KEEP_DB=1
      STOP_ARGS+=("--keep-db")
      ;;
    --force-ports)
      STOP_ARGS+=("--force-ports")
      ;;
    -h|--help)
      printf "Usage: ./scripts/restart.sh [--keep-db] [--force-ports]\n"
      printf "\n"
      printf "Stops and restarts Events Hub services.\n"
      printf "  --keep-db     Keep PostgreSQL running during restart\n"
      printf "  --force-ports Kill any processes blocking project ports\n"
      exit 0
      ;;
    *)
      printf "Unknown option: %s\n" "$arg" >&2
      printf "Run ./scripts/restart.sh --help for usage.\n" >&2
      exit 1
      ;;
  esac
done

print_info() {
  printf "\033[0;32m[INFO]\033[0m %s\n" "$1"
}

print_info "Restarting Events Hub..."

"$SCRIPT_DIR/stop.sh" "${STOP_ARGS[@]+"${STOP_ARGS[@]}"}"

if [[ "$KEEP_DB" -eq 1 ]]; then
  print_info "Starting services (PostgreSQL already running)..."
else
  print_info "Starting services..."
fi

"$SCRIPT_DIR/start.sh"
