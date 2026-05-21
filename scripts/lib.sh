#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

API_DIR="$PROJECT_DIR/api"
WEB_DIR="$PROJECT_DIR/web"

API_PORT="${API_PORT:-3000}"
WEB_PORT="${WEB_PORT:-5173}"

RUNTIME_DIR="${EVENTS_HUB_RUNTIME_DIR:-$PROJECT_DIR/.runtime}"
LOG_DIR="$RUNTIME_DIR/logs"
PID_DIR="$RUNTIME_DIR/pids"

API_LOG="$LOG_DIR/api.log"
WEB_LOG="$LOG_DIR/web.log"
API_PID_FILE="$PID_DIR/api.pid"
WEB_PID_FILE="$PID_DIR/web.pid"
API_PORT_FILE="$PID_DIR/api.port"
WEB_PORT_FILE="$PID_DIR/web.port"

if [[ -t 1 ]]; then
  RED=$'\033[0;31m'
  GREEN=$'\033[0;32m'
  YELLOW=$'\033[1;33m'
  NC=$'\033[0m'
else
  RED=""
  GREEN=""
  YELLOW=""
  NC=""
fi

print_info() {
  printf "%s[INFO]%s %s\n" "$GREEN" "$NC" "$1"
}

print_warn() {
  printf "%s[WARN]%s %s\n" "$YELLOW" "$NC" "$1"
}

print_error() {
  printf "%s[ERROR]%s %s\n" "$RED" "$NC" "$1" >&2
}

die() {
  print_error "$1"
  exit 1
}

ensure_runtime_dirs() {
  mkdir -p "$LOG_DIR" "$PID_DIR"
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

require_command() {
  command_exists "$1" || die "Required command not found: $1"
}

require_project_tools() {
  require_command docker
  require_command corepack
}

pnpm_exec() {
  corepack pnpm "$@"
}

read_pid_file() {
  local pid_file="$1"

  if [[ ! -f "$pid_file" ]]; then
    return 1
  fi

  local pid
  pid="$(<"$pid_file")"

  if [[ "$pid" =~ ^[0-9]+$ ]] && kill -0 "$pid" 2>/dev/null; then
    printf "%s" "$pid"
    return 0
  fi

  rm -f "$pid_file"
  return 1
}

port_pid() {
  local port="$1"
  local line

  if command_exists ss; then
    while IFS= read -r line; do
      if [[ "$line" == *":$port "* || "$line" == *":$port,"* ]] && [[ "$line" =~ pid=([0-9]+) ]]; then
        printf "%s" "${BASH_REMATCH[1]}"
        return 0
      fi
    done < <(ss -tlnp 2>/dev/null || true)
  fi

  if command_exists netstat; then
    while IFS= read -r line; do
      if [[ "$line" == *":$port "* ]] && [[ "$line" =~ ([0-9]+)/[^[:space:]]+ ]]; then
        printf "%s" "${BASH_REMATCH[1]}"
        return 0
      fi
    done < <(netstat -tlnp 2>/dev/null || true)
  fi

  return 1
}

is_port_open() {
  port_pid "$1" >/dev/null
}

find_free_port() {
  local port="$1"
  while is_port_open "$port"; do
    ((port++))
    if [[ "$port" -gt 65535 ]]; then
      die "Could not find a free port."
    fi
  done
  printf "%s" "$port"
}

read_port_file() {
  local port_file="$1"
  if [[ ! -f "$port_file" ]]; then
    return 1
  fi
  printf "%s" "$(<"$port_file")"
}

resolve_port() {
  local label="$1"
  local desired_port="$2"

  if is_port_open "$desired_port"; then
    local port
    port=$(find_free_port "$((desired_port + 1))")
    print_warn "$label desired port $desired_port is in use; using port $port."
    printf "%s" "$port"
  else
    printf "%s" "$desired_port"
  fi
}

wait_for_port() {
  local port="$1"
  local service_name="$2"
  local timeout_seconds="${3:-30}"

  for ((i = 1; i <= timeout_seconds; i++)); do
    if is_port_open "$port"; then
      return 0
    fi
    sleep 1
  done

  die "$service_name did not open port $port within ${timeout_seconds}s."
}

stop_pid() {
  local pid="$1"
  local label="$2"

  if ! kill -0 "$pid" 2>/dev/null && ! kill -0 "-$pid" 2>/dev/null; then
    return 0
  fi

  print_info "Stopping $label (PID: $pid)..."
  kill "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true

  for _ in {1..10}; do
    if ! kill -0 "$pid" 2>/dev/null && ! kill -0 "-$pid" 2>/dev/null; then
      return 0
    fi
    sleep 1
  done

  print_warn "$label did not stop gracefully; forcing shutdown."
  kill -9 "-$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null || true
}

stop_pid_file() {
  local pid_file="$1"
  local label="$2"
  local pid

  if pid="$(read_pid_file "$pid_file")"; then
    stop_pid "$pid" "$label"
    rm -f "$pid_file"
    return 0
  fi

  return 1
}

stop_port_process() {
  local port="$1"
  local label="$2"
  local pid

  if pid="$(port_pid "$port")"; then
    print_warn "No PID file for $label; stopping process found on port $port."
    stop_pid "$pid" "$label"
  else
    print_warn "No $label process found on port $port."
  fi
}
