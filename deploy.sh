#!/bin/bash

# ===========================================
# Meu Regional - Script de Deploy
# ===========================================
# Uso: ./deploy.sh [deploy|run-unit-tests|build|scan|restart|stop|logs|status|export_db|import]
# Flags (deploy): --skip-trivy           (pula scan Trivy)
#                 --trivy-severity=LEVEL (default: CRITICAL)
# ===========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$HOME/deploys/meu-regional"

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCESSO]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[ATENÇÃO]${NC} $1"; }
log_error()   { echo -e "${RED}[ERRO]${NC} $1"; }
log_step()    { echo -e "${CYAN}==>${NC} $1"; }

check_dependencies() {
    local missing_deps=()

    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi

    if ! command -v trivy &> /dev/null; then
        missing_deps+=("trivy")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Dependências não encontradas: ${missing_deps[*]}"
        log_info "Instale com:"
        log_info "  sudo apt install ${missing_deps[*]}"
        log_info "  Trivy: https://trivy.dev/latest/getting-started/installation/"
        exit 1
    fi

    log_success "Todas as dependências verificadas!"
}

check_env_file() {
    if [ ! -f ".env" ]; then
        log_warning ".env não encontrado!"
        log_info "Copie .env.example para .env e configure:"
        echo "  cp .env.example .env && nano .env"
        exit 1
    fi
}

cd_to_deploy() {
    if [ -d "$DEPLOY_DIR" ] && [ -f "$DEPLOY_DIR/docker-compose.yml" ]; then
        cd "$DEPLOY_DIR"
    else
        log_info "Usando diretório atual como deploy..."
        cd "$SCRIPT_DIR"
    fi
}

sync_files() {
    log_step "Atualizando repositório..."
    cd "$SCRIPT_DIR"
    git pull

    log_step "Criando diretório de deploy..."
    mkdir -p "$DEPLOY_DIR"

    log_step "Sincronizando arquivos..."
    rsync -avz \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='**/node_modules' \
        --exclude='.qwen' \
        --exclude='*.log' \
        --exclude='back/data' \
        --exclude='*.db' \
        --exclude='deploy.sh' \
        --exclude='.env' \
        "$SCRIPT_DIR/" "$DEPLOY_DIR/"

    log_success "Arquivos sincronizados!"
    cd "$DEPLOY_DIR"
}

run_unit_tests() {
    cd_to_deploy
    cd back
    
    log_step "Build da imagem de testes..."
    if ! sudo docker build \
        -f Dockerfile.test \
        -t meu-regional-unit-tests:latest \
        .; then
        log_error "Falha no build da imagem de testes!"
        exit 1
    fi

    log_step "Executando testes unitários..."
    echo "────────────────────────────────────────"
    sudo docker run --rm \
        --cap-drop=ALL \
        --read-only \
        --tmpfs /tmp \
        meu-regional-unit-tests:latest 2>&1
    local exit_code=$?
    echo "────────────────────────────────────────"

    if [ "$exit_code" -ne 0 ]; then
        log_error "Testes unitários falharam — abortando."
        exit 1
    fi
    log_success "Todos os testes unitários passaram!"
}

build_all() {
    log_step "Build de todos os serviços..."
    if ! sudo docker compose build; then
        log_error "Build falhou!"
        exit 1
    fi
    log_success "Build concluído!"
}

scan_vulnerabilities() {
    local flags="${1:-}"

    if [[ " $flags " == *" --skip-trivy "* ]]; then
        log_info "Trivy scan pulado (--skip-trivy)"
        return 0
    fi

    local severity="CRITICAL"
    if [[ "$flags" =~ --trivy-severity=([^ ]+) ]]; then
        severity="${BASH_REMATCH[1]}"
    fi

    log_step "Scan vulnerabilidades Trivy (severidade: $severity)..."

    local imagens=(
        "meu-regional-frontend:latest;Frontend"
        "meu-regional-backend:latest;Backend"
    )

    local has_vulns=false

    for entry in "${imagens[@]}"; do
        IFS=';' read -r image_tag display_name <<< "$entry"

        if ! sudo docker image inspect "$image_tag" &>/dev/null; then
            log_warning "  [$display_name] Imagem não encontrada — pulando"
            continue
        fi

        log_step "  [$display_name] Escaneando..."

        if sudo trivy image --exit-code 1 --severity "$severity" --no-progress "$image_tag" 2>&1 | tail -5; then
            log_success "  [$display_name] Nenhuma vulnerabilidade $severity encontrada."
        else
            log_error "  [$display_name] Vulnerabilidade(s) $severity encontrada(s)!"
            has_vulns=true
        fi
    done

    if $has_vulns; then
        log_error "Trivy scan falhou — interrompendo."
        exit 1
    fi

    log_success "Trivy scan concluído — nenhuma CVE $severity detectada."
}

deploy() {
    log_info "Iniciando deploy completo..."
    mkdir -p "$DEPLOY_DIR"

    log_step "Sincronizando arquivos (git pull + rsync)..."
    sync_files

    check_env_file

    log_step "Executando testes unitários..."
    run_unit_tests

    log_step "Build dos serviços..."
    build_all

    log_step "Verificando vulnerabilidades (Trivy)..."
    scan_vulnerabilities "$*"

    log_step "Subindo serviços..."
    sudo docker compose up -d

    log_step "Verificando status dos containers..."
    sudo docker compose ps

    log_success "Deploy concluído!"
    log_info ""
    log_info "Acesso:"
    log_info "  Frontend: http://localhost:7000"
    log_info "  Domínio: https://meureg.mateusfonseca.me"
    log_info ""
    log_info "Para ver logs: ./deploy.sh logs"
}

restart() { cd_to_deploy && sudo docker compose restart && log_success "Containers reiniciados!"; }
stop()    { cd_to_deploy && sudo docker compose down && log_success "Containers parados!"; }
logs()    { cd_to_deploy && sudo docker compose logs -f; }
status()  { cd_to_deploy && sudo docker compose ps; }

build() {
    cd_to_deploy
    check_env_file
    build_all
}

scan() {
    cd_to_deploy
    check_dependencies
    scan_vulnerabilities "$*"
}

run_tests() {
    cd_to_deploy
    run_unit_tests
}

export_db() {
    check_dependencies

    log_info "Exportando banco de dados..."
    cd_to_deploy

    VOLUME_PATH=$(sudo docker volume inspect meu-regional_backend_data | jq -r '.[0].Mountpoint')

    if ! sudo ls "$VOLUME_PATH" | grep -q "meu-regional.db"; then
        log_error "Banco de dados não encontrado em $VOLUME_PATH"
        sudo ls -la "$VOLUME_PATH" || true
        exit 1
    fi

    EXPORT_FILE="$HOME/meu-regional-backup-$(date +%Y%m%d-%H%M%S).db"
    sudo cp "$VOLUME_PATH/meu-regional.db" "$EXPORT_FILE"
    sudo chown "$USER:$USER" "$EXPORT_FILE"

    log_success "Banco exportado para: $EXPORT_FILE"
}

import_db() {
    check_dependencies

    local DB_PATH="${1:-}"

    if [ -z "$DB_PATH" ]; then
        log_error "Uso: ./deploy.sh import <caminho-do-banco>"
        exit 1
    fi

    if ! ls "$DB_PATH" | grep -q "$(basename "$DB_PATH")"; then
        log_error "Arquivo não encontrado: $DB_PATH"
        exit 1
    fi

    log_info "Importando banco de dados de: $DB_PATH"
    cd_to_deploy

    VOLUME_PATH=$(sudo docker volume inspect meu-regional_backend_data | jq -r '.[0].Mountpoint')

    BACKUP_FILE="$VOLUME_PATH/meu-regional.db.backup-$(date +%Y%m%d-%H%M%S)"
    if sudo ls "$VOLUME_PATH" | grep -q "meu-regional.db"; then
        sudo cp "$VOLUME_PATH/meu-regional.db" "$BACKUP_FILE"
        log_info "Backup do banco atual: $BACKUP_FILE"
    fi

    sudo cp "$DB_PATH" "$VOLUME_PATH/meu-regional.db"
    sudo chown root:root "$VOLUME_PATH/meu-regional.db"

    log_success "Banco importado com sucesso!"
    log_info "Reiniciando backend..."
    sudo docker compose restart backend
    log_success "Backend reiniciado!"
}

show_help() {
    echo "Uso: ./deploy.sh [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  deploy        - Deploy completo (sync, tests, build, trivy, up)"
    echo "  run-unit-tests - Executa testes unitários em container"
    echo "  build         - Build de todos os serviços"
    echo "  scan          - Scan vulnerabilidades com Trivy"
    echo "  restart       - Reinicia containers"
    echo "  stop          - Para containers"
    echo "  logs          - Logs em tempo real"
    echo "  status        - Status dos containers"
    echo "  export_db     - Exporta banco SQLite para ~/"
    echo "  import        - Importa banco SQLite (./deploy.sh import <caminho>)"
    echo ""
    echo "Flags (deploy):"
    echo "  --skip-trivy              Pula scan de vulnerabilidades"
    echo "  --trivy-severity=LEVEL    Severidade mínima (default: CRITICAL)"
    echo ""
    echo "Diretórios:"
    echo "  Script: $SCRIPT_DIR"
    echo "  Deploy: $DEPLOY_DIR"
}

case "${1:-}" in
    deploy)
        deploy "$@"
        ;;
    run-unit-tests)
        run_tests
        ;;
    build)
        build
        ;;
    scan)
        scan "$@"
        ;;
    restart)
        restart
        ;;
    stop)
        stop
        ;;
    logs)
        logs
        ;;
    status)
        status
        ;;
    export_db)
        export_db
        ;;
    import)
        import_db "${2:-}"
        ;;
    *)
        show_help
        ;;
esac
