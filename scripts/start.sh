#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

ensure_env_file() {
  local env_file="$API_DIR/.env"
  local example_file="$API_DIR/.env.example"

  if [[ ! -f "$env_file" && -f "$example_file" ]]; then
    print_info "Creating api/.env from api/.env.example..."
    cp "$example_file" "$env_file"
  fi
}

install_dependencies_if_needed() {
  if [[ ! -d "$API_DIR/node_modules" ]]; then
    print_info "Installing API dependencies..."
    (cd "$API_DIR" && pnpm_exec install)
  fi

  if [[ ! -d "$WEB_DIR/node_modules" ]]; then
    print_info "Installing web dependencies..."
    (cd "$WEB_DIR" && pnpm_exec install)
  fi
}

wait_for_postgres() {
  print_info "Waiting for PostgreSQL to be ready..."

  for i in {1..30}; do
    if (cd "$PROJECT_DIR" && docker compose exec -T postgres pg_isready -U events_hub -d events_hub >/dev/null 2>&1); then
      print_info "PostgreSQL is ready."
      return 0
    fi

    sleep 1
  done

  die "PostgreSQL did not become ready in time."
}

start_service() {
  local label="$1"
  local dir="$2"
  local port="$3"
  local log_file="$4"
  local pid_file="$5"
  shift 5
  local pid

  if pid="$(read_pid_file "$pid_file")"; then
    print_warn "$label is already running from PID file (PID: $pid)."
    return 0
  fi

  print_info "Starting $label on port $port..."
  : > "$log_file"
  (
    cd "$dir"
    for var in "$@"; do
      local key="${var%%=*}"
      local value="${var#*=}"
      export "$key=$value"
    done
    if command_exists setsid; then
      nohup setsid corepack pnpm dev < /dev/null > "$log_file" 2>&1 &
    else
      nohup corepack pnpm dev < /dev/null > "$log_file" 2>&1 &
    fi
    printf "%s" "$!" > "$pid_file"
  )

  wait_for_port "$port" "$label" 30
  pid="$(read_pid_file "$pid_file" || true)"

  if [[ -n "$pid" ]]; then
    print_info "$label started (PID: $pid)."
  else
    print_info "$label started."
  fi
}

require_project_tools
ensure_runtime_dirs
ensure_env_file

print_info "Starting PostgreSQL via Docker Compose..."
(cd "$PROJECT_DIR" && docker compose up -d postgres)
wait_for_postgres

install_dependencies_if_needed

print_info "Running database migrations..."
(cd "$API_DIR" && pnpm_exec db:migrate)

ACTUAL_API_PORT=$(resolve_port "API server" "$API_PORT")
printf "%s" "$ACTUAL_API_PORT" > "$API_PORT_FILE"

ACTUAL_WEB_PORT=$(resolve_port "Web dev server" "$WEB_PORT")
printf "%s" "$ACTUAL_WEB_PORT" > "$WEB_PORT_FILE"

start_service "API server" "$API_DIR" "$ACTUAL_API_PORT" "$API_LOG" "$API_PID_FILE" "API_PORT=$ACTUAL_API_PORT"
start_service "Web dev server" "$WEB_DIR" "$ACTUAL_WEB_PORT" "$WEB_LOG" "$WEB_PID_FILE" "WEB_PORT=$ACTUAL_WEB_PORT" "API_PROXY_TARGET=http://localhost:$ACTUAL_API_PORT"

printf "\n"
print_info "Events Hub is running."
printf "\n"
printf "  API:      %shttp://localhost:%s%s\n" "$GREEN" "$ACTUAL_API_PORT" "$NC"
printf "  Web:      %shttp://localhost:%s%s\n" "$GREEN" "$ACTUAL_WEB_PORT" "$NC"
printf "\n"
printf "  API logs: %s\n" "$API_LOG"
printf "  Web logs: %s\n" "$WEB_LOG"
printf "\n"
printf "Use ./scripts/stop.sh to stop services.\n"
