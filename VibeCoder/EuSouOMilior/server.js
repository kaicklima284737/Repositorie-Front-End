import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#')) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
  }
} catch {}
const validKey = value => value && !value.startsWith('COLE_') ? value : '';
const FD_KEY = validKey(process.env.FOOTBALL_DATA_KEY);
const GN_KEY = validKey(process.env.GNEWS_KEY);
const PORT = Number(process.env.PORT || 3000);
const FD = 'https://api.football-data.org/v4';
const GN = 'https://gnews.io/api/v4';

const COMPETITIONS = [
  { code: 'BSA', name: 'Brasileirão Série A', area: 'Brasil' },
  { code: 'PL', name: 'Premier League', area: 'Inglaterra' },
  { code: 'PD', name: 'La Liga', area: 'Espanha' },
  { code: 'SA', name: 'Serie A', area: 'Itália' },
  { code: 'BL1', name: 'Bundesliga', area: 'Alemanha' },
  { code: 'FL1', name: 'Ligue 1', area: 'França' },
  { code: 'PPL', name: 'Primeira Liga', area: 'Portugal' },
  { code: 'DED', name: 'Eredivisie', area: 'Países Baixos' },
  { code: 'ELC', name: 'Championship', area: 'Inglaterra' },
  { code: 'CL', name: 'UEFA Champions League', area: 'Europa' },
  { code: 'EC', name: 'Eurocopa', area: 'Europa' },
  { code: 'WC', name: 'Copa do Mundo', area: 'Mundo' }
];
const NEWS_CATEGORIES = {
  'Todas': 'futebol',
  'Brasileirão': 'Brasileirão',
  'Futebol Europeu': '"Premier League" OR "La Liga" OR "Champions League"',
  'Seleções': 'seleção futebol',
  'Mercado da Bola': '"mercado da bola" OR transferência futebol',
  'Futebol Feminino': '"futebol feminino"'
};
const cache = new Map();
const fail = (status, message) => Object.assign(new Error(message), { status });
const dateOffset = days => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

async function requestCached(url, options = {}, ttl = 60) {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.time < ttl * 1000) return cached.data;
  try {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(12000) });
    if (!response.ok) {
      if (response.status === 429) throw fail(429, 'Limite da API atingido. Aguarde antes de tentar novamente.');
      if (response.status === 403) throw fail(403, 'Recurso não disponível no plano gratuito da API.');
      if (response.status === 401) throw fail(502, 'Chave de API inválida. Confira o arquivo .env.');
      throw fail(502, `A API respondeu com erro ${response.status}.`);
    }
    const data = await response.json();
    cache.set(url, { time: Date.now(), data });
    return data;
  } catch (error) {
    if (cached) return cached.data;
    if (error.status) throw error;
    throw fail(502, 'Falha ao conectar à API. Confira sua conexão e tente novamente.');
  }
}
async function football(endpoint, ttl = 120) {
  if (!FD_KEY) throw fail(503, 'Configure FOOTBALL_DATA_KEY no arquivo .env.');
  return requestCached(FD + endpoint, { headers: { 'X-Auth-Token': FD_KEY } }, ttl);
}
const safeTeam = team => team ? ({
  id: team.id, name: team.shortName || team.name || 'A definir',
  tla: team.tla || '', crest: team.crest || ''
}) : ({ name: 'A definir', tla: '', crest: '' });
const safeMatch = m => ({
  id: m.id, utc: m.utcDate, status: m.status, matchday: m.matchday,
  stage: m.stage, venue: m.venue || '',
  competition: m.competition?.name || '',
  compCode: m.competition?.code || '',
  home: safeTeam(m.homeTeam), away: safeTeam(m.awayTeam),
  score: {
    home: m.score?.fullTime?.home ?? null,
    away: m.score?.fullTime?.away ?? null,
    halfHome: m.score?.halfTime?.home ?? null,
    halfAway: m.score?.halfTime?.away ?? null
  }
});

async function route(url) {
  const { pathname, searchParams } = url;
  if (pathname === '/api/config') {
    return { competitions: COMPETITIONS, football: Boolean(FD_KEY), news: Boolean(GN_KEY) };
  }
  if (pathname === '/api/matches') {
    const tab = searchParams.get('tab') || 'today';
    let query = `competitions=${COMPETITIONS.map(c => c.code).join(',')}`;
    if (tab === 'live') query += '&status=LIVE,IN_PLAY,PAUSED';
    else if (tab === 'upcoming') query += `&dateFrom=${dateOffset(0)}&dateTo=${dateOffset(7)}&status=SCHEDULED,TIMED`;
    else if (tab === 'finished') query += `&dateFrom=${dateOffset(-3)}&dateTo=${dateOffset(0)}&status=FINISHED`;
    else if (tab === 'today') query += `&dateFrom=${dateOffset(0)}&dateTo=${dateOffset(0)}`;
    else throw fail(400, 'Filtro de partidas inválido.');
    const data = await football(`/matches?${query}`, tab === 'live' ? 30 : 120);
    return { matches: (data.matches || []).map(safeMatch), updated: new Date().toISOString() };
  }
  const comp = pathname.match(/^\/api\/competitions\/([A-Z0-9]+)\/(standings|matches|scorers)$/);
  if (comp) {
    const [, code, kind] = comp;
    if (!COMPETITIONS.some(item => item.code === code)) throw fail(404, 'Competição não cadastrada.');
    if (kind === 'standings') {
      const data = await football(`/competitions/${code}/standings`, 300);
      return {
        season: data.season ? { start: data.season.startDate, end: data.season.endDate, matchday: data.season.currentMatchday } : null,
        tables: (data.standings || []).filter(s => s.type === 'TOTAL').map(s => ({
          group: s.group, stage: s.stage,
          rows: (s.table || []).map(r => ({
            pos: r.position, team: safeTeam(r.team), points: r.points,
            played: r.playedGames, wins: r.won, draws: r.draw, losses: r.lost,
            goalsFor: r.goalsFor, goalsAgainst: r.goalsAgainst,
            goalDifference: r.goalDifference, form: r.form || ''
          }))
        }))
      };
    }
    if (kind === 'matches') {
      const from = searchParams.get('from') || dateOffset(-7);
      const to = searchParams.get('to') || dateOffset(7);
      const data = await football(`/competitions/${code}/matches?dateFrom=${encodeURIComponent(from)}&dateTo=${encodeURIComponent(to)}`, 120);
      return { matches: (data.matches || []).map(safeMatch) };
    }
    const data = await football(`/competitions/${code}/scorers?limit=15`, 600);
    return { scorers: (data.scorers || []).map(s => ({
      name: s.player?.name || 'Jogador', team: safeTeam(s.team),
      goals: s.goals ?? 0, assists: s.assists ?? 0, penalties: s.penalties ?? 0,
      played: s.playedMatches ?? 0
    })) };
  }
  if (pathname === '/api/news') {
    if (!GN_KEY) throw fail(503, 'Configure GNEWS_KEY no arquivo .env.');
    const term = (searchParams.get('q') || '').trim().slice(0, 80);
    const category = searchParams.get('cat') || 'Todas';
    const query = term || NEWS_CATEGORIES[category] || NEWS_CATEGORIES.Todas;
    const apiUrl = `${GN}/search?q=${encodeURIComponent(query)}&lang=pt&max=10&sortby=publishedAt&apikey=${encodeURIComponent(GN_KEY)}`;
    const data = await requestCached(apiUrl, {}, 1800);
    return { articles: (data.articles || []).map(a => ({
      title: a.title, description: a.description || '', url: a.url,
      image: a.image || '', date: a.publishedAt, source: a.source?.name || 'Fonte externa'
    })) };
  }
  throw fail(404, 'Rota não encontrada.');
}

const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.ico': 'image/x-icon'
};
http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (url.pathname.startsWith('/api/')) {
    try {
      const data = await route(url);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(data));
    } catch (error) {
      res.writeHead(error.status || 500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: error.message || 'Erro inesperado.' }));
    }
    return;
  }
  let requested;
  try { requested = decodeURIComponent(url.pathname); } catch {
    res.writeHead(400); res.end('URL inválida'); return;
  }
  const publicRoot = path.resolve(ROOT, 'public');
  const file = path.resolve(publicRoot, requested === '/' ? 'index.html' : `.${requested}`);
  if (!file.startsWith(publicRoot + path.sep) && file !== path.join(publicRoot, 'index.html')) {
    res.writeHead(403); res.end('Acesso negado'); return;
  }
  fs.readFile(file, (error, buffer) => {
    if (error) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Arquivo não encontrado'); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(buffer);
  });
}).listen(PORT, () => console.log(`EuSouOMilior disponível em http://localhost:${PORT}`));
