-- Schema do banco de dados Meu Regional

-- Tabela de regionais
CREATE TABLE IF NOT EXISTS regionais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de membros
CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    regional_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    instrumento TEXT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (regional_id) REFERENCES regionais(id) ON DELETE CASCADE
);

-- Tabela de itens do repertório
CREATE TABLE IF NOT EXISTS repertoire_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    regional_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    autor TEXT,
    descricao TEXT,
    links TEXT, -- JSON array com links (YouTube, Spotify, Tidal, etc.)
    metadados TEXT, -- JSON com metadados da música
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (regional_id) REFERENCES regionais(id) ON DELETE CASCADE
);

-- Tabela de seleções (setlists)
CREATE TABLE IF NOT EXISTS selections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    regional_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    data_evento DATE,
    max_musicas INTEGER DEFAULT 30,
    criada_por INTEGER NOT NULL,
    status TEXT DEFAULT 'votacao', -- 'votacao', 'finalizada'
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (regional_id) REFERENCES regionais(id) ON DELETE CASCADE,
    FOREIGN KEY (criada_por) REFERENCES members(id) ON DELETE CASCADE
);

-- Tabela de votos nas seleções
CREATE TABLE IF NOT EXISTS selection_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    selection_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    repertoire_item_id INTEGER NOT NULL,
    votado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (selection_id) REFERENCES selections(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (repertoire_item_id) REFERENCES repertoire_items(id) ON DELETE CASCADE,
    UNIQUE(selection_id, member_id, repertoire_item_id)
);

-- Tabela de músicas selecionadas (mais votadas)
CREATE TABLE IF NOT EXISTS selection_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    selection_id INTEGER NOT NULL,
    repertoire_item_id INTEGER NOT NULL,
    posicao INTEGER NOT NULL,
    total_votos INTEGER NOT NULL,
    FOREIGN KEY (selection_id) REFERENCES selections(id) ON DELETE CASCADE,
    FOREIGN KEY (repertoire_item_id) REFERENCES repertoire_items(id) ON DELETE CASCADE,
    UNIQUE(selection_id, repertoire_item_id)
);

-- Tabela de logs de estudo
CREATE TABLE IF NOT EXISTS study_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    repertoire_item_id INTEGER NOT NULL,
    tipo TEXT NOT NULL, -- 'individual', 'grupo'
    duracao_minutos INTEGER,
    notas TEXT,
    estudado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (repertoire_item_id) REFERENCES repertoire_items(id) ON DELETE CASCADE
);

-- Índice para buscas
CREATE INDEX IF NOT EXISTS idx_repertoire_nome ON repertoire_items(nome);
CREATE INDEX IF NOT EXISTS idx_members_username ON members(username);
CREATE INDEX IF NOT EXISTS idx_study_logs_member ON study_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_study_logs_repertoire ON study_logs(repertoire_item_id);
