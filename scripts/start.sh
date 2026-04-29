#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

API_DIR="$PROJECT_DIR/api"
WEB_DIR="$PROJECT_DIR/web"
API_PORT=3000
WEB_PORT=5173

API_LOG="/tmp/events-hub-api.log"
WEB_LOG="/tmp/events-hub-web.log"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

is_port_open() {
  local port="$1"
  ss -tlnp 2>/dev/null | grep -q ":$port " || netstat -tlnp 2>/dev/null | grep -q ":$port "
}

# 1. Start Docker Compose (PostgreSQL)
print_info "Starting PostgreSQL via Docker Compose..."
cd "$PROJECT_DIR"
docker compose up -d

# 2. Wait for PostgreSQL to be ready
print_info "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if docker compose exec -T postgres pg_isready -U events_hub -d events_hub >/dev/null 2>&1; then
    print_info "PostgreSQL is ready."
    break
  fi
  sleep 1
  if [ "$i" -eq 30 ]; then
    print_error "PostgreSQL did not become ready in time."
    exit 1
  fi
done

# 3. Install dependencies if needed
if [ ! -d "$API_DIR/node_modules" ]; then
  print_info "Installing API dependencies..."
  cd "$API_DIR"
  corepack pnpm install
fi

if [ ! -d "$WEB_DIR/node_modules" ]; then
  print_info "Installing Web dependencies..."
  cd "$WEB_DIR"
  corepack pnpm install
fi

# 4. Run migrations
print_info "Running database migrations..."
cd "$API_DIR"
corepack pnpm db:migrate || true

# 5. Start API if not running
if is_port_open "$API_PORT"; then
  print_warn "API is already running on port $API_PORT."
else
  print_info "Starting API server on port $API_PORT..."
  cd "$API_DIR"
  nohup corepack pnpm dev < /dev/null > "$API_LOG" 2>&1 &
  API_PID=$!
  sleep 2
  if kill -0 "$API_PID" 2>/dev/null; then
    print_info "API server started (PID: $API_PID)."
  else
    print_error "API server failed to start. Check logs: $API_LOG"
    exit 1
  fi
fi

# 6. Start Web if not running
if is_port_open "$WEB_PORT"; then
  print_warn "Web app is already running on port $WEB_PORT."
else
  print_info "Starting Web dev server on port $WEB_PORT..."
  cd "$WEB_DIR"
  nohup corepack pnpm dev < /dev/null > "$WEB_LOG" 2>&1 &
  WEB_PID=$!
  sleep 2
  if kill -0 "$WEB_PID" 2>/dev/null; then
    print_info "Web server started (PID: $WEB_PID)."
  else
    print_error "Web server failed to start. Check logs: $WEB_LOG"
    exit 1
  fi
fi

# 7. Final status
sleep 2
echo ""
print_info "Events Hub is running!"
echo ""
echo -e "  API:  ${GREEN}http://localhost:$API_PORT${NC}"
echo -e "  Web:  ${GREEN}http://localhost:$WEB_PORT${NC}"
echo ""
echo -e "  API logs: $API_LOG"
echo -e "  Web logs: $WEB_LOG"
echo ""
echo "Use ./scripts/stop.sh to stop all services."
