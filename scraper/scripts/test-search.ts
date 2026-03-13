/**
 * Script de teste de busca no Spotify
 *
 * Uso: bun run scripts/test-search.ts [query]
 *
 * Exemplos:
 *   bun run test:search                    # Usa "The Beatles" (default)
 *   bun run test:search "Led Zeppelin"     # Usa argumento
 *   bun run test:search "Queen"            # Usa argumento
 *
 * Este script testa a funcionalidade de busca sem precisar de login
 */

import { SpotifyScraperService } from '../src/services/SpotifyScraperService.js';

// Logger
const log = {
  info: (msg: string, data?: any) => console.log(`[TEST][INFO] ${new Date().toISOString()} - ${msg}`, data || ''),
  success: (msg: string) => console.log(`\n✅ [TEST] ${msg}\n`),
  error: (msg: string, data?: any) => console.error(`\n❌ [TEST] ${msg}\n`, data || ''),
};

// Capturar query da linha de comando, env ou default
const args = process.argv.slice(2);
const TEST_QUERY = args[0] || process.env.TEST_QUERY || 'The Beatles';
const headless = process.env.HEADLESS !== 'false';

log.info('Configurações:', { query: TEST_QUERY, headless });

/**
 * Testa a busca no Spotify usando o SpotifyScraperService
 */
async function testSearch(): Promise<boolean> {
  const service = new SpotifyScraperService({ headless });

  try {
    log.info('=== INICIANDO TESTE DE BUSCA ===\n');

    // Inicializar browser
    log.info('[TEST] Inicializando browser...');
    await service.initialize();
    log.info('[TEST] Browser inicializado com sucesso\n');

    // Realizar busca
    log.info(`[TEST] Buscando por: "${TEST_QUERY}"...`);
    const results = await service.search(TEST_QUERY);

    log.info(`[TEST] ${results.length} resultado(s) encontrado(s)\n`);

    if (results.length === 0) {
      log.error('Nenhum resultado encontrado!');
      return false;
    }

    // Mostrar resultados
    console.log('='.repeat(60));
    console.log('RESULTADOS DA BUSCA:');
    console.log('='.repeat(60));
    
    results.forEach((track, index) => {
      console.log(`\n${index + 1}. ${track.nome}`);
      console.log(`   Artista: ${track.autor}`);
      if (track.album) console.log(`   Álbum: ${track.album}`);
      if (track.ano) console.log(`   Ano: ${track.ano}`);
    });
    
    console.log('\n' + '='.repeat(60));

    log.success(`Busca realizada com sucesso! ${results.length} resultado(s) encontrado(s).`);
    return true;

  } catch (error: any) {
    log.error('Erro durante o teste', {
      message: error.message,
      stack: error.stack?.substring(0, 500),
    });
    return false;
  } finally {
    // Cleanup
    log.info('\n[TEST] Fechando browser...');
    await service.close();
    log.info('[TEST] Browser fechado');
    log.info('\n=== TESTE FINALIZADO ===\n');
  }
}

// Executar teste
testSearch().then((success) => {
  process.exit(success ? 0 : 1);
}).catch((err) => {
  log.error('Erro fatal', err);
  process.exit(1);
});
