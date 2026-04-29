#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

print_service_status() {
  local label="$1"
  local port="$2"
  local pid_file="$3"
  local log_file="$4"
  local pid
  local port_owner

  printf "\n%s\n" "$label"

  if pid="$(read_pid_file "$pid_file")"; then
    printf "  PID file: %sactive%s (PID %s)\n" "$GREEN" "$NC" "$pid"
  else
    printf "  PID file: %snot active%s\n" "$YELLOW" "$NC"
  fi

  if port_owner="$(port_pid "$port")"; then
    printf "  Port %s:  %sopen%s (PID %s)\n" "$port" "$GREEN" "$NC" "$port_owner"
  else
    printf "  Port %s:  %sclosed%s\n" "$port" "$YELLOW" "$NC"
  fi

  if [[ -f "$log_file" ]]; then
    printf "  Log:      %s\n" "$log_file"
  else
    printf "  Log:      not created yet\n"
  fi
}

print_info "Events Hub status"
printf "Project: %s\n" "$PROJECT_DIR"
printf "Runtime: %s\n" "$RUNTIME_DIR"

if command_exists docker; then
  printf "\nPostgreSQL\n"
  (cd "$PROJECT_DIR" && docker compose ps postgres 2>/dev/null) || print_warn "Docker Compose status unavailable."
else
  printf "\nPostgreSQL\n"
  print_warn "Docker is not installed or not available in PATH."
fi

print_service_status "API server" "$API_PORT" "$API_PID_FILE" "$API_LOG"
print_service_status "Web dev server" "$WEB_PORT" "$WEB_PID_FILE" "$WEB_LOG"
