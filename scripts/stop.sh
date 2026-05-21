#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

STOP_DB=1
FORCE_PORTS=0

for arg in "$@"; do
  case "$arg" in
    --keep-db)
      STOP_DB=0
      ;;
    --force-ports)
      FORCE_PORTS=1
      ;;
    -h|--help)
      printf "Usage: ./scripts/stop.sh [--keep-db] [--force-ports]\n"
      printf "\n"
      printf "Stops processes tracked by .runtime PID files.\n"
      printf "Use --force-ports to also kill unknown processes listening on project ports.\n"
      exit 0
      ;;
    *)
      die "Unknown option: $arg"
      ;;
  esac
done

ensure_runtime_dirs

stop_service() {
  local label="$1"
  local default_port="$2"
  local pid_file="$3"
  local port_file="$4"
  local pid
  local port="$default_port"

  if actual_port="$(read_port_file "$port_file" 2>/dev/null)"; then
    port="$actual_port"
  fi

  print_info "Stopping $label..."
  stop_pid_file "$pid_file" "$label" || true

  if is_port_open "$port"; then
    if [[ "$FORCE_PORTS" -eq 1 ]]; then
      stop_port_process "$port" "$label"
    else
      pid="$(port_pid "$port")"
      print_warn "$label port $port is still in use by PID $pid. Use --force-ports to stop it."
    fi
  else
    print_info "$label is stopped."
  fi
}

stop_service "Web dev server" "$WEB_PORT" "$WEB_PID_FILE" "$WEB_PORT_FILE"
stop_service "API server" "$API_PORT" "$API_PID_FILE" "$API_PORT_FILE"

if [[ "$STOP_DB" -eq 1 ]]; then
  require_command docker
  print_info "Stopping PostgreSQL..."
  (cd "$PROJECT_DIR" && docker compose down)
else
  print_info "Leaving PostgreSQL running because --keep-db was provided."
fi

print_info "Services stopped."
