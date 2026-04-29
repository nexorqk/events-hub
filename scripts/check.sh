#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

RUN_API=1
RUN_WEB=1

for arg in "$@"; do
  case "$arg" in
    --api)
      RUN_API=1
      RUN_WEB=0
      ;;
    --web)
      RUN_API=0
      RUN_WEB=1
      ;;
    -h|--help)
      printf "Usage: ./scripts/check.sh [--api|--web]\n"
      printf "\n"
      printf "Runs API typecheck/tests and web production build by default.\n"
      exit 0
      ;;
    *)
      die "Unknown option: $arg"
      ;;
  esac
done

require_command corepack

if [[ "$RUN_API" -eq 1 ]]; then
  print_info "Checking API types..."
  (cd "$API_DIR" && pnpm_exec typecheck)

  print_info "Running API tests..."
  (cd "$API_DIR" && pnpm_exec test)
fi

if [[ "$RUN_WEB" -eq 1 ]]; then
  print_info "Building web app..."
  (cd "$WEB_DIR" && pnpm_exec build)
fi

print_info "Checks completed successfully."
