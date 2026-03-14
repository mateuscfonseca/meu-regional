import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getDb, dbProvider } from './db-provider';
import { getMigrationManager } from './migration-manager';
import { migrations } from './migrations-registry';
import { authRoutes } from './routes/auth';
import { regionaisRoutes } from './routes/regionais';
import { membersRoutes } from './routes/members';
import { repertoireRoutes } from './routes/repertoire';
import { memberRepertoireRoutes } from './routes/member-repertoire';
import { selectionsRoutes } from './routes/selections';
import { studyLogsRoutes } from './routes/studyLogs';
import { scraperRoutes } from './routes/scraper';
import { authorsRoutes } from './routes/authors';

// Inicializa e aplica migrations automaticamente
async function bootstrap() {
  console.log('🚀 Iniciando banco de dados...\n');
  
  const manager = getMigrationManager();
  manager.registerMany(migrations);
  
  // Aplica todas as migrations pendentes
  await manager.migrate();
}

// Executa bootstrap antes de iniciar o servidor
bootstrap().then(() => {
  console.log('✅ Banco de dados inicializado com sucesso!\n');
}).catch((error) => {
  console.error('❌ Erro ao inicializar banco de dados:', error);
  process.exit(1);
});

const app = new Hono();

// CORS para desenvolvimento e produção local (localhost:7000)
// Em produção real com domínio, o Caddy faz proxy reverso (same-origin)
app.use('/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:7000', 'https://meureg.mateusfonseca.me'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Rotas
app.route('/api/auth', authRoutes);
app.route('/api/regionais', regionaisRoutes);
app.route('/api/members', membersRoutes);
app.route('/api/repertoire', repertoireRoutes);
app.route('/api/member-repertoire', memberRepertoireRoutes);
app.route('/api/selections', selectionsRoutes);
app.route('/api/study-logs', studyLogsRoutes);
app.route('/api/scraper', scraperRoutes);
app.route('/api/authors', authorsRoutes);

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Health check do banco de dados
app.get('/health/db', (c) => {
  try {
    const db = getDb();
    db.exec('SELECT 1');
    return c.json({
      status: 'ok',
      database: 'connected',
      path: dbProvider.getDatabasePath()
    });
  } catch (error: any) {
    return c.json({
      status: 'error',
      database: 'disconnected',
      error: error.message
    }, 500);
  }
});

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
};
