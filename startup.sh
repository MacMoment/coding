#!/usr/bin/env bash
#
# ForgeCraft AI - Advanced Startup Script
# =======================================
# This script automates the complete setup and startup of the ForgeCraft AI platform.
#
# Usage:
#   ./startup.sh [OPTIONS]
#
# Options:
#   --dev              Start in development mode (default)
#   --prod             Start in production mode
#   --skip-docker      Skip Docker services startup
#   --skip-db          Skip database setup
#   --reset-db         Reset database (drop and recreate)
#   --fresh            Fresh install (clean install dependencies)
#   --help             Show this help message
#

set -e

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Default options
MODE="dev"
SKIP_DOCKER=false
SKIP_DB=false
RESET_DB=false
FRESH_INSTALL=false

# Required versions
REQUIRED_NODE_VERSION="18"
REQUIRED_DOCKER_COMPOSE_VERSION="2"

# Service ports
WEB_PORT=3000
API_PORT=3001
POSTGRES_PORT=5432
REDIS_PORT=6379
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001

# Timeout settings (in seconds)
DOCKER_STARTUP_TIMEOUT=120
DB_READY_TIMEOUT=60

# ============================================================================
# COLORS AND STYLING
# ============================================================================

# Check if terminal supports colors
if [ -t 1 ] && command -v tput &>/dev/null && [ "$(tput colors)" -ge 8 ]; then
    COLORS_SUPPORTED=true
else
    COLORS_SUPPORTED=false
fi

# Color definitions
if [ "$COLORS_SUPPORTED" = true ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[0;33m'
    BLUE='\033[0;34m'
    MAGENTA='\033[0;35m'
    CYAN='\033[0;36m'
    WHITE='\033[1;37m'
    BOLD='\033[1m'
    DIM='\033[2m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    MAGENTA=''
    CYAN=''
    WHITE=''
    BOLD=''
    DIM=''
    NC=''
fi

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

# Print banner
print_banner() {
    echo -e "${CYAN}"
    echo '  ╔═════════════════════════════════════════════════════════════════════════════╗'
    echo '  ║                                                                             ║'
    echo '  ║   ███████╗ ██████╗ ██████╗  ██████╗ ███████╗ ██████╗██████╗  █████╗ ███████╗████████╗  ║'
    echo '  ║   ██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝██╔════╝██╔══██╗██╔══██╗██╔════╝╚══██╔══╝  ║'
    echo '  ║   █████╗  ██║   ██║██████╔╝██║  ███╗█████╗  ██║     ██████╔╝███████║█████╗     ██║     ║'
    echo '  ║   ██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝  ██║     ██╔══██╗██╔══██║██╔══╝     ██║     ║'
    echo '  ║   ██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗╚██████╗██║  ██║██║  ██║██║        ██║     ║'
    echo '  ║   ╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝        ╚═╝     ║'
    echo '  ║                                                                             ║'
    echo '  ║                AI-Powered Builder for Minecraft & Discord                   ║'
    echo '  ║                                                                             ║'
    echo '  ╚═════════════════════════════════════════════════════════════════════════════╝'
    echo -e "${NC}"
}

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "\n${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${WHITE}  $1${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Progress spinner
spinner() {
    local pid=$1
    local message=$2
    local spin='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    local i=0
    
    while kill -0 "$pid" 2>/dev/null; do
        i=$(( (i+1) % ${#spin} ))
        printf "\r${CYAN}[%s]${NC} %s" "${spin:$i:1}" "$message"
        sleep 0.1
    done
    printf "\r"
}

# Check if command exists
command_exists() {
    command -v "$1" &>/dev/null
}

# Get version number from version string
get_major_version() {
    echo "$1" | grep -oE '^[0-9]+' | head -1
}

# Wait for a port to be available
wait_for_port() {
    local port=$1
    local service=$2
    local timeout=${3:-$DOCKER_STARTUP_TIMEOUT}
    local start_time=$(date +%s)
    
    while ! nc -z localhost "$port" 2>/dev/null; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -ge $timeout ]; then
            log_error "Timeout waiting for $service on port $port"
            return 1
        fi
        
        printf "\r${CYAN}[⏳]${NC} Waiting for $service (port $port)... ${elapsed}s"
        sleep 1
    done
    printf "\r${GREEN}[✓]${NC} $service is ready on port $port          \n"
    return 0
}

# Check if Docker container is healthy
wait_for_container_health() {
    local container=$1
    local timeout=${2:-$DOCKER_STARTUP_TIMEOUT}
    local start_time=$(date +%s)
    
    while true; do
        local health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "not_found")
        
        if [ "$health" = "healthy" ]; then
            log_success "Container $container is healthy"
            return 0
        fi
        
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -ge $timeout ]; then
            log_error "Timeout waiting for $container to be healthy"
            return 1
        fi
        
        printf "\r${CYAN}[⏳]${NC} Waiting for $container to be healthy... ${elapsed}s (status: $health)"
        sleep 2
    done
}

# ============================================================================
# PREREQUISITE CHECKS
# ============================================================================

check_prerequisites() {
    log_step "Checking Prerequisites"
    
    local all_ok=true
    
    # Check Node.js
    if command_exists node; then
        local node_version=$(node -v | sed 's/v//')
        local node_major=$(get_major_version "$node_version")
        if [ "$node_major" -ge "$REQUIRED_NODE_VERSION" ]; then
            log_success "Node.js v$node_version"
        else
            log_error "Node.js v$REQUIRED_NODE_VERSION+ required (found v$node_version)"
            all_ok=false
        fi
    else
        log_error "Node.js not found. Please install Node.js v$REQUIRED_NODE_VERSION+"
        all_ok=false
    fi
    
    # Check npm
    if command_exists npm; then
        local npm_version=$(npm -v)
        log_success "npm v$npm_version"
    else
        log_error "npm not found"
        all_ok=false
    fi
    
    # Check Docker
    if command_exists docker; then
        local docker_version=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        log_success "Docker v$docker_version"
        
        # Check if Docker daemon is running
        if ! docker info &>/dev/null; then
            log_error "Docker daemon is not running. Please start Docker."
            all_ok=false
        fi
    else
        log_warning "Docker not found (required for database and services)"
        if [ "$SKIP_DOCKER" = false ]; then
            all_ok=false
        fi
    fi
    
    # Check Docker Compose
    if command_exists docker && docker compose version &>/dev/null; then
        local compose_version=$(docker compose version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        log_success "Docker Compose v$compose_version"
    elif command_exists docker-compose; then
        local compose_version=$(docker-compose --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        log_success "Docker Compose v$compose_version (standalone)"
    else
        log_warning "Docker Compose not found"
        if [ "$SKIP_DOCKER" = false ]; then
            all_ok=false
        fi
    fi
    
    # Check git
    if command_exists git; then
        local git_version=$(git --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        log_success "Git v$git_version"
    else
        log_warning "Git not found (optional but recommended)"
    fi
    
    # Check nc (netcat) for port checking
    if ! command_exists nc; then
        log_warning "netcat (nc) not found - port checking will be limited"
    fi
    
    if [ "$all_ok" = false ]; then
        echo ""
        log_error "Prerequisites check failed. Please install missing dependencies."
        exit 1
    fi
    
    log_success "All prerequisites met!"
}

# ============================================================================
# ENVIRONMENT SETUP
# ============================================================================

setup_environment() {
    log_step "Setting Up Environment"
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            log_info "Creating .env from .env.example..."
            cp .env.example .env
            log_success "Created .env file"
            log_warning "Please review .env and update values as needed"
        else
            log_error ".env.example not found. Cannot create environment file."
            exit 1
        fi
    else
        log_success ".env file already exists"
    fi
    
    # Source environment variables for this script
    if [ -f ".env" ]; then
        set -a
        source .env
        set +a
        log_success "Environment variables loaded"
    fi
}

# ============================================================================
# DEPENDENCY INSTALLATION
# ============================================================================

install_dependencies() {
    log_step "Installing Dependencies"
    
    if [ "$FRESH_INSTALL" = true ]; then
        log_info "Performing fresh install (removing node_modules)..."
        rm -rf node_modules
        rm -rf apps/*/node_modules
        rm -rf packages/*/node_modules
        log_success "Cleaned node_modules directories"
    fi
    
    if [ ! -d "node_modules" ] || [ "$FRESH_INSTALL" = true ]; then
        log_info "Installing npm dependencies..."
        npm install 2>&1 | while read -r line; do
            echo -e "${DIM}  $line${NC}"
        done
        log_success "Dependencies installed"
    else
        log_success "Dependencies already installed (use --fresh to reinstall)"
    fi
}

# ============================================================================
# DOCKER SERVICES
# ============================================================================

start_docker_services() {
    if [ "$SKIP_DOCKER" = true ]; then
        log_info "Skipping Docker services (--skip-docker flag)"
        return 0
    fi
    
    log_step "Starting Docker Services"
    
    # Determine compose command
    local compose_cmd="docker compose"
    if ! docker compose version &>/dev/null; then
        compose_cmd="docker-compose"
    fi
    
    # Check if services are already running (compatible approach)
    local running_services=$($compose_cmd ps -q 2>/dev/null | wc -l)
    
    if [ "$running_services" -gt 0 ]; then
        log_info "Some services are already running. Restarting..."
        $compose_cmd down --remove-orphans 2>/dev/null || true
    fi
    
    # Start services
    log_info "Starting PostgreSQL, Redis, and MinIO..."
    $compose_cmd up -d postgres redis minio minio-setup 2>&1 | while read -r line; do
        echo -e "${DIM}  $line${NC}"
    done
    
    # Wait for services to be ready
    echo ""
    log_info "Waiting for services to be ready..."
    
    # Wait for PostgreSQL
    if ! wait_for_container_health "forgecraft-postgres" "$DOCKER_STARTUP_TIMEOUT"; then
        log_error "PostgreSQL failed to start"
        exit 1
    fi
    
    # Wait for Redis
    if ! wait_for_container_health "forgecraft-redis" "$DOCKER_STARTUP_TIMEOUT"; then
        log_error "Redis failed to start"
        exit 1
    fi
    
    # Wait for MinIO
    if ! wait_for_container_health "forgecraft-minio" "$DOCKER_STARTUP_TIMEOUT"; then
        log_error "MinIO failed to start"
        exit 1
    fi
    
    log_success "All Docker services are running!"
    
    # Display service information
    echo ""
    echo -e "${CYAN}┌─────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│${NC}  ${BOLD}Service Status${NC}                                                ${CYAN}│${NC}"
    echo -e "${CYAN}├─────────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${CYAN}│${NC}  ${GREEN}●${NC} PostgreSQL   : localhost:${POSTGRES_PORT}                           ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  ${GREEN}●${NC} Redis        : localhost:${REDIS_PORT}                              ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  ${GREEN}●${NC} MinIO        : localhost:${MINIO_PORT}                              ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  ${GREEN}●${NC} MinIO Console: localhost:${MINIO_CONSOLE_PORT}                              ${CYAN}│${NC}"
    echo -e "${CYAN}└─────────────────────────────────────────────────────────────────┘${NC}"
}

# ============================================================================
# DATABASE SETUP
# ============================================================================

setup_database() {
    if [ "$SKIP_DB" = true ]; then
        log_info "Skipping database setup (--skip-db flag)"
        return 0
    fi
    
    log_step "Setting Up Database"
    
    # Reset database if requested
    if [ "$RESET_DB" = true ]; then
        log_warning "Resetting database..."
        npm run db:push -- --force-reset 2>&1 | while read -r line; do
            echo -e "${DIM}  $line${NC}"
        done
        log_success "Database reset complete"
    fi
    
    # Generate Prisma client
    log_info "Generating Prisma client..."
    npm run db:generate 2>&1 | while read -r line; do
        echo -e "${DIM}  $line${NC}"
    done
    log_success "Prisma client generated"
    
    # Push schema to database
    log_info "Pushing schema to database..."
    npm run db:push 2>&1 | while read -r line; do
        echo -e "${DIM}  $line${NC}"
    done
    log_success "Database schema synced"
    
    # Run seed script
    log_info "Seeding database with demo data..."
    npm run db:seed 2>&1 | while read -r line; do
        echo -e "${DIM}  $line${NC}"
    done
    log_success "Database seeded"
}

# ============================================================================
# START DEVELOPMENT SERVER
# ============================================================================

start_dev_server() {
    log_step "Starting Development Server"
    
    echo -e "${CYAN}┌─────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│${NC}  ${BOLD}Application URLs${NC}                                              ${CYAN}│${NC}"
    echo -e "${CYAN}├─────────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${CYAN}│${NC}                                                                 ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  ${GREEN}🌐 Frontend${NC}    : http://localhost:${WEB_PORT}                       ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  ${GREEN}🔌 API${NC}         : http://localhost:${API_PORT}                       ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  ${GREEN}📚 API Docs${NC}    : http://localhost:${API_PORT}/api/docs              ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  ${GREEN}💾 MinIO Console${NC}: http://localhost:${MINIO_CONSOLE_PORT}                       ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}                                                                 ${CYAN}│${NC}"
    echo -e "${CYAN}├─────────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${CYAN}│${NC}  ${BOLD}Demo Accounts${NC}                                                 ${CYAN}│${NC}"
    echo -e "${CYAN}├─────────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${CYAN}│${NC}  ${YELLOW}Admin${NC}  : admin@forgecraft.ai / admin123                        ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  ${YELLOW}User${NC}   : demo@forgecraft.ai / demo123                          ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  ${YELLOW}Free${NC}   : free@forgecraft.ai / free123                          ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}                                                                 ${CYAN}│${NC}"
    echo -e "${CYAN}└─────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
    
    log_info "Starting Turbo development server..."
    echo -e "${DIM}Press Ctrl+C to stop${NC}"
    echo ""
    
    # Run the development server
    exec npm run dev
}

start_prod_server() {
    log_step "Starting Production Server"
    
    log_info "Building application..."
    npm run build 2>&1 | while read -r line; do
        echo -e "${DIM}  $line${NC}"
    done
    log_success "Build complete"
    
    echo -e "${CYAN}┌─────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│${NC}  ${BOLD}Production URLs${NC}                                               ${CYAN}│${NC}"
    echo -e "${CYAN}├─────────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${CYAN}│${NC}  ${GREEN}🌐 Frontend${NC}: http://localhost:${WEB_PORT}                           ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  ${GREEN}🔌 API${NC}     : http://localhost:${API_PORT}                           ${CYAN}│${NC}"
    echo -e "${CYAN}└─────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
    
    log_info "Starting production servers..."
    
    # Start API in background (using subshell to preserve working directory)
    (cd apps/api && npm run start:prod) &
    API_PID=$!
    
    # Start Web (using subshell to preserve working directory)
    (cd apps/web && npm run start) &
    WEB_PID=$!
    
    # Wait for both processes
    wait $API_PID $WEB_PID
}

# ============================================================================
# CLEANUP AND SHUTDOWN
# ============================================================================

cleanup() {
    echo ""
    log_info "Shutting down..."
    
    # Kill any background processes with SIGTERM for graceful shutdown
    jobs -p | xargs -r kill -TERM 2>/dev/null || true
    
    log_success "Goodbye!"
}

trap cleanup EXIT INT TERM

# ============================================================================
# HELP
# ============================================================================

show_help() {
    echo -e "${BOLD}ForgeCraft AI - Startup Script${NC}"
    echo ""
    echo -e "${BOLD}Usage:${NC}"
    echo "  ./startup.sh [OPTIONS]"
    echo ""
    echo -e "${BOLD}Options:${NC}"
    echo "  --dev              Start in development mode (default)"
    echo "  --prod             Start in production mode"
    echo "  --skip-docker      Skip Docker services startup"
    echo "  --skip-db          Skip database setup"
    echo "  --reset-db         Reset database (drop and recreate)"
    echo "  --fresh            Fresh install (clean install dependencies)"
    echo "  --help             Show this help message"
    echo ""
    echo -e "${BOLD}Examples:${NC}"
    echo "  ./startup.sh                     # Start in dev mode"
    echo "  ./startup.sh --prod              # Start in production mode"
    echo "  ./startup.sh --fresh             # Clean install and start"
    echo "  ./startup.sh --skip-docker       # Start without Docker services"
    echo "  ./startup.sh --reset-db          # Reset database and start"
    echo ""
    echo -e "${BOLD}Requirements:${NC}"
    echo "  - Node.js 18+"
    echo "  - Docker & Docker Compose"
    echo "  - npm"
    echo ""
}

# ============================================================================
# ARGUMENT PARSING
# ============================================================================

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dev)
                MODE="dev"
                shift
                ;;
            --prod)
                MODE="prod"
                shift
                ;;
            --skip-docker)
                SKIP_DOCKER=true
                shift
                ;;
            --skip-db)
                SKIP_DB=true
                shift
                ;;
            --reset-db)
                RESET_DB=true
                shift
                ;;
            --fresh)
                FRESH_INSTALL=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    parse_arguments "$@"
    
    clear
    print_banner
    
    echo -e "${BOLD}Mode:${NC} $MODE"
    echo -e "${BOLD}Skip Docker:${NC} $SKIP_DOCKER"
    echo -e "${BOLD}Skip DB:${NC} $SKIP_DB"
    echo -e "${BOLD}Fresh Install:${NC} $FRESH_INSTALL"
    echo ""
    
    check_prerequisites
    setup_environment
    install_dependencies
    start_docker_services
    setup_database
    
    if [ "$MODE" = "prod" ]; then
        start_prod_server
    else
        start_dev_server
    fi
}

main "$@"
