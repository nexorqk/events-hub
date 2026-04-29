#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

API_PORT=3000
WEB_PORT=5173

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

kill_process_on_port() {
  local port="$1"
  local pid
  pid=$(ss -tlnp 2>/dev/null | grep ":$port " | sed -n 's/.*pid=\([0-9]*\).*/\1/p' | head -n1)
  if [ -z "$pid" ]; then
    pid=$(netstat -tlnp 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1 | head -n1)
  fi
  if [ -n "$pid" ] && [ "$pid" != "-" ]; then
    print_info "Stopping process on port $port (PID: $pid)..."
    kill "$pid" 2>/dev/null || true
    sleep 1
    kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null || true
  else
    print_warn "No process found on port $port."
  fi
}

print_info "Stopping Web server..."
kill_process_on_port "$WEB_PORT"

print_info "Stopping API server..."
kill_process_on_port "$API_PORT"

print_info "Stopping PostgreSQL..."
cd "$PROJECT_DIR"
docker compose down || true

print_info "All services stopped."
