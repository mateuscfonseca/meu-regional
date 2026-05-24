import * as cheerio from 'cheerio'

export interface AcervoSearchResult {
  nome: string
  autor: string
  genero: string
}

export interface AcervoSearchResponse {
  query: string
  page: number
  results: AcervoSearchResult[]
  total: number
}

function log(...args: any[]) {
  console.log(`[CasaDoChoro]`, ...args)
}

export async function searchAcervo(query: string, page: number = 1): Promise<AcervoSearchResponse> {
  const url = `https://acervo.casadochoro.com.br/Works/index?title=${encodeURIComponent(query)}&page=${page}`
  log(`Buscando: ${url}`)

  const response = await fetch(url)
  log(`Status HTTP: ${response.status}`)

  if (!response.ok) {
    throw new Error(`Erro ao buscar no Acervo Casa do Choro: ${response.status}`)
  }

  const html = await response.text()
  log(`HTML recebido: ${html.length} caracteres`)

  const $ = cheerio.load(html)
  const results: AcervoSearchResult[] = []

  // Estrutura real do HTML (confirmado via debug):
  // <ul class="listing">
  //   <li>
  //     <a href="/works/view/3576" class="transition">
  //       <span>Escorregando</span>
  //       <ul>
  //         <li>Ernesto Nazareth</li>           ← autor
  //         <li>∙ Tango Brasileiro</li>         ← gênero
  //       </ul>
  //     </a>
  //   </li>
  // </ul>

  $('ul.listing > li').each((_i, liEl) => {
    const $li = $(liEl)
    const $a = $li.find('a[href^="/works/view"]')
    if (!$a.length) return

    const nome = $a.find('span').first().text().trim()
    if (!nome) return

    const nestedLis = $a.find('ul li')
    const autor = $(nestedLis[0]).text().trim()
    const generoRaw = $(nestedLis[1]).text().trim()
    const genero = generoRaw.replace(/^∙\s*/, '').trim()

    log(`Resultado: nome="${nome}", autor="${autor}", genero="${genero}"`)
    results.push({ nome, autor, genero })
  })

  log(`Total de resultados encontrados: ${results.length}`)

  return {
    query,
    page,
    results,
    total: results.length,
  }
}
