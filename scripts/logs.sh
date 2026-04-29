#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

SERVICE="all"
LINES=80
FOLLOW=1

usage() {
  printf "Usage: ./scripts/logs.sh [api|web|all] [--lines N] [--no-follow]\n"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    api|web|all)
      SERVICE="$1"
      shift
      ;;
    --lines|-n)
      [[ $# -ge 2 ]] || die "--lines requires a number"
      LINES="$2"
      [[ "$LINES" =~ ^[0-9]+$ ]] || die "--lines must be a positive integer"
      shift 2
      ;;
    --no-follow)
      FOLLOW=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown option: $1"
      ;;
  esac
done

require_command tail

log_files=()

case "$SERVICE" in
  api)
    log_files+=("$API_LOG")
    ;;
  web)
    log_files+=("$WEB_LOG")
    ;;
  all)
    log_files+=("$API_LOG" "$WEB_LOG")
    ;;
esac

for log_file in "${log_files[@]}"; do
  if [[ ! -f "$log_file" ]]; then
    print_warn "Log file does not exist yet: $log_file"
    print_warn "Run ./scripts/start.sh first."
  fi
done

if [[ "$FOLLOW" -eq 1 ]]; then
  tail -n "$LINES" -F "${log_files[@]}"
else
  tail -n "$LINES" "${log_files[@]}"
fi
