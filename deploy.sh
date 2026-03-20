#!/bin/bash

# ===========================================
# Meu Regional - Script de Deploy
# ===========================================
# Uso: ./deploy.sh [deploy|restart|stop|logs|status|export_db|import]
# ===========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DEPLOY_DIR="$HOME/deploys/meu-regional"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCESSO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[ATENÇÃO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

# Verificar dependências
check_dependencies() {
    if ! command -v jq &> /dev/null; then
        log_error "jq não encontrado. Instale com: sudo apt install jq"
        exit 1
    fi
}

deploy() {
    log_info "Iniciando deploy..."
    cd "$SCRIPT_DIR"
    
    git pull
    
    mkdir -p "$DEPLOY_DIR"
    
    log_info "Sincronizando arquivos..."
    rsync -avz \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='.qwen' \
        --exclude='*.log' \
        --exclude='back/data' \
        "$SCRIPT_DIR/" "$DEPLOY_DIR/"
    
    log_info "Build e deploy..."
    cd "$DEPLOY_DIR"
    
    if [ ! -f ".env" ]; then
        log_warning ".env não encontrado!"
        log_info "Copie .env.example para .env e configure:"
        echo "  cp .env.example .env && nano .env"
        exit 1
    fi
    
    log_info "Build do frontend (com containers antigos rodando)..."
    sudo docker compose build frontend
    
    log_info "Build do backend (com containers antigos rodando)..."
    sudo docker compose build backend
    
    log_info "Build do scraper (com containers antigos rodando)..."
    sudo docker compose build scraper
        
    log_info "Subindo serviços com novas imagens..."
    sudo docker compose up -d
    
    log_info "Verificando status dos containers..."
    sudo docker compose ps
    
    log_success "Deploy concluído!"
    log_info ""
    log_info "Acesso:"
    log_info "  Frontend: http://localhost:7000"
    log_info "  Domínio: https://meureg.mateusfonseca.me"
    log_info ""
    log_info "Para ver logs: ./deploy.sh logs"
}

restart() {
    cd "$DEPLOY_DIR" && sudo docker compose restart
    log_success "Containers reiniciados!"
}

stop() {
    cd "$DEPLOY_DIR" && sudo docker compose down
    log_success "Containers parados!"
}

logs() {
    cd "$DEPLOY_DIR" && sudo docker compose logs -f
}

status() {
    cd "$DEPLOY_DIR" && sudo docker compose ps
}

export_db() {
    check_dependencies

    log_info "Exportando banco de dados..."
    cd "$DEPLOY_DIR"

    # Descobrir path do volume
    VOLUME_PATH=$(sudo docker volume inspect meu-regional_backend_data | jq -r '.[0].Mountpoint')

    # Verificar se o banco existe (usando sudo ls com grep para pastas protegidas)
    if ! sudo ls "$VOLUME_PATH" | grep -q "meu-regional.db"; then
        log_error "Banco de dados não encontrado em $VOLUME_PATH"
        log_error "Conteúdo do diretório:"
        sudo ls -la "$VOLUME_PATH" || true
        exit 1
    fi

    # Copiar banco para ~/
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

    # Verificar se arquivo existe (usando ls normal para arquivo do usuário)
    if ! ls "$DB_PATH" | grep -q "$(basename "$DB_PATH")"; then
        log_error "Arquivo não encontrado: $DB_PATH"
        exit 1
    fi

    log_info "Importando banco de dados de: $DB_PATH"
    cd "$DEPLOY_DIR"

    # Descobrir path do volume
    VOLUME_PATH=$(sudo docker volume inspect meu-regional_backend_data | jq -r '.[0].Mountpoint')

    # Backup do banco atual
    BACKUP_FILE="$VOLUME_PATH/meu-regional.db.backup-$(date +%Y%m%d-%H%M%S)"
    if sudo ls "$VOLUME_PATH" | grep -q "meu-regional.db"; then
        sudo cp "$VOLUME_PATH/meu-regional.db" "$BACKUP_FILE"
        log_info "Backup do banco atual: $BACKUP_FILE"
    fi

    # Copiar novo banco
    sudo cp "$DB_PATH" "$VOLUME_PATH/meu-regional.db"
    sudo chown root:root "$VOLUME_PATH/meu-regional.db"

    log_success "Banco importado com sucesso!"
    log_info "Reiniciando backend..."
    sudo docker compose restart backend
    log_success "Backend reiniciado!"
}

case "${1:-}" in
    deploy)
        deploy
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
        echo "Uso: ./deploy.sh [deploy|restart|stop|logs|status|export_db|import]"
        echo ""
        echo "  deploy     - Deploy completo (git pull, rsync, build, migrate, up)"
        echo "  restart    - Reinicia containers"
        echo "  stop       - Para containers"
        echo "  logs       - Logs em tempo real"
        echo "  status     - Status dos containers"
        echo "  export_db  - Exporta banco SQLite para ~/"
        echo "  import     - Importa banco SQLite (./deploy.sh import <caminho>)"
        ;;
esac
