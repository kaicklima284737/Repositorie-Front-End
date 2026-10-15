const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const state = { competitions: [], competition: null, sub: 'standings', matchTab: 'today', newsCategory: 'Todas', goals: 0, saves: 0, shots: 0, gameOver: false };
const statusNames = {
  SCHEDULED: 'Agendado', TIMED: 'Agendado', IN_PLAY: 'Em andamento',
  LIVE: 'Ao vivo', PAUSED: 'Intervalo', FINISHED: 'Encerrado',
  POSTPONED: 'Adiado', SUSPENDED: 'Suspenso', CANCELLED: 'Cancelado'
};
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const dateTime = value => value ? new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Horário a definir';
let toastTimer;
function toast(message) {
  const node = $('#toast');
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('show'), 3200);
}
async function api(url) {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Não foi possível carregar os dados.');
  return data;
}
function showError(target, message) {
  target.innerHTML = `<div class="empty-state error-state">${esc(message)}</div>`;
}
function teamHtml(team, score) {
  const logo = team?.crest ? `<img src="${esc(team.crest)}" alt="" loading="lazy" onerror="this.style.display='none'">` : '';
  return `<div class="team-row"><div class="team-info">${logo}<span>${esc(team?.name || 'A definir')}</span></div><strong class="team-score">${score ?? '—'}</strong></div>`;
}
function matchCard(match) {
  return `<article class="match-card"><div class="match-meta"><span>${esc(match.competition || 'Competição')}</span><span class="status-pill">${esc(statusNames[match.status] || match.status || 'Agendado')}</span></div>${teamHtml(match.home, match.score?.home)}${teamHtml(match.away, match.score?.away)}<div class="match-bottom">${esc(dateTime(match.utc))}${match.venue ? ` · ${esc(match.venue)}` : ''}</div></article>`;
}
async function loadMatches(tab = state.matchTab) {
  state.matchTab = tab;
  $$('#matchTabs [data-tab]').forEach(button => button.classList.toggle('active', button.dataset.tab === tab));
  const container = $('#matches');
  container.innerHTML = '<div class="empty-state">Buscando partidas…</div>';
  try {
    const data = await api(`/api/matches?tab=${encodeURIComponent(tab)}`);
    $('#matchUpdate').textContent = `Atualizado ${new Date(data.updated).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})}`;
    container.innerHTML = data.matches.length ? data.matches.map(matchCard).join('') : '<div class="empty-state">Nenhuma partida encontrada neste período. Tente outra aba.</div>';
  } catch (error) { showError(container, `${error.message} Configure a chave no .env para carregar dados reais.`); }
}
function renderCompetitionList() {
  const container = $('#competitionList');
  container.innerHTML = state.competitions.map(comp => `<button class="competition-choice ${comp.code === state.competition ? 'active' : ''}" data-code="${esc(comp.code)}">${esc(comp.name)}<span>↗</span></button>`).join('');
}
async function selectCompetition(code) {
  state.competition = code;
  renderCompetitionList();
  const comp = state.competitions.find(item => item.code === code);
  $('#competitionTitle').innerHTML = `<div><span class="kicker">${esc(comp?.area || 'COMPETIÇÃO')}</span><h3>${esc(comp?.name || code)}</h3></div>`;
  await loadCompetitionPanel();
}
async function loadCompetitionPanel() {
  const panel = $('#competitionPanel');
  panel.innerHTML = '<div class="empty-state">Consultando competição…</div>';
  $$('#competitionTabs [data-sub]').forEach(button => button.classList.toggle('active', button.dataset.sub === state.sub));
  try {
    const data = await api(`/api/competitions/${state.competition}/${state.sub}`);
    if (state.sub === 'standings') {
      const rows = (data.tables || []).flatMap(table => table.rows || []);
      panel.innerHTML = rows.length ? `<table><thead><tr><th>#</th><th>CLUBE</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th><th>PTS</th></tr></thead><tbody>${rows.map(row => `<tr><td>${row.pos}</td><td><div class="club-cell">${row.team.crest ? `<img src="${esc(row.team.crest)}" alt="" loading="lazy" onerror="this.style.display='none'">` : ''}<strong>${esc(row.team.name)}</strong></div></td><td>${row.played}</td><td>${row.wins}</td><td>${row.draws}</td><td>${row.losses}</td><td>${row.goalDifference > 0 ? '+' : ''}${row.goalDifference}</td><td class="points">${row.points}</td></tr>`).join('')}</tbody></table>` : '<div class="empty-state">A classificação não está disponível para esta competição.</div>';
    } else if (state.sub === 'matches') {
      panel.innerHTML = data.matches?.length ? `<div class="match-grid">${data.matches.map(matchCard).join('')}</div>` : '<div class="empty-state">Não há jogos disponíveis neste intervalo.</div>';
    } else {
      panel.innerHTML = data.scorers?.length ? `<table><thead><tr><th>#</th><th>JOGADOR</th><th>CLUBE</th><th>JOGOS</th><th>ASSIST.</th><th>GOLS</th></tr></thead><tbody>${data.scorers.map((player, index) => `<tr><td>${index + 1}</td><td><strong>${esc(player.name)}</strong></td><td>${esc(player.team.name)}</td><td>${player.played}</td><td>${player.assists}</td><td class="points">${player.goals}</td></tr>`).join('')}</tbody></table>` : '<div class="empty-state">Artilharia indisponível neste plano ou competição.</div>';
    }
  } catch (error) { showError(panel, error.message); }
}
async function loadNews(category = state.newsCategory, query = '') {
  state.newsCategory = category;
  $$('#newsCategories [data-cat]').forEach(button => button.classList.toggle('active', button.dataset.cat === category));
  const grid = $('#newsGrid');
  grid.innerHTML = '<div class="empty-state">Buscando notícias…</div>';
  const params = new URLSearchParams(query ? { q: query } : { cat: category });
  try {
    const data = await api(`/api/news?${params}`);
    grid.innerHTML = data.articles?.length ? data.articles.map(article => `<article class="news-card">${article.image ? `<img class="news-image" src="${esc(article.image)}" alt="" loading="lazy" onerror="this.style.display='none'">` : '<div class="news-image"></div>'}<div class="news-body"><div class="news-meta"><span>${esc(article.source)}</span><span>${article.date ? esc(new Date(article.date).toLocaleDateString('pt-BR')) : ''}</span></div><h3>${esc(article.title)}</h3><p>${esc(article.description || 'Leia a matéria completa na fonte original.')}</p><a class="news-link" href="${esc(article.url)}" target="_blank" rel="noopener noreferrer">Ler matéria completa ↗</a></div></article>`).join('') : '<div class="empty-state">Nenhuma notícia encontrada. Tente outra pesquisa.</div>';
  } catch (error) { showError(grid, `${error.message} Configure GNEWS_KEY no .env.`); }
}
function initGame() {
  const zones = $$('.goal-zone');
  const keeper = $('#keeper');
  const ball = $('#football');
  zones.forEach(zone => zone.addEventListener('click', () => {
    if (state.gameOver) return;
    const choice = zone.dataset.shot;
    const directions = ['left', 'center', 'right'];
    const keeperChoice = directions[Math.floor(Math.random() * directions.length)];
    const xPositions = { left: '20%', center: '50%', right: '80%' };
    state.shots += 1;
    const scored = choice !== keeperChoice;
    if (scored) state.goals += 1;
    else state.saves += 1;
    keeper.style.setProperty('--keeper-x', xPositions[keeperChoice]);
    keeper.style.setProperty('--keeper-tilt', keeperChoice === 'left' ? '-18deg' : keeperChoice === 'right' ? '18deg' : '0deg');
    keeper.style.left = xPositions[keeperChoice];
    ball.style.setProperty('--shot-x', xPositions[choice]);
    ball.style.animation = 'none';
    void ball.offsetWidth;
    ball.style.animation = 'kickBall .55s ease-out forwards';
    $('#goals').textContent = state.goals;
    $('#saves').textContent = state.saves;
    $('#shots').textContent = `${state.shots}/5`;
    $('#gameStatus').textContent = scored ? 'GOOOOL! A rede balançou!' : 'Defendeu! O goleiro levou a melhor.';
    zones.forEach(item => item.disabled = true);
    setTimeout(() => {
      ball.style.animation = 'none';
      if (state.shots >= 5) {
        state.gameOver = true;
        $('#gameStatus').textContent = `Fim de jogo: ${state.goals} gol(s) em 5 cobranças.`;
        $('#resetGame').hidden = false;
      } else {
        zones.forEach(item => item.disabled = false);
      }
    }, 700);
  }));
  $('#resetGame').addEventListener('click', () => {
    state.goals = 0; state.saves = 0; state.shots = 0; state.gameOver = false;
    $('#goals').textContent = '0'; $('#saves').textContent = '0'; $('#shots').textContent = '0/5';
    $('#gameStatus').textContent = 'A torcida está esperando. Escolha seu canto!';
    $('#resetGame').hidden = true;
    keeper.style.left = '50%'; ball.style.animation = 'none';
    zones.forEach(item => item.disabled = false);
  });
}

function initScrollEffects() {
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  progress.innerHTML = '<span class="scroll-progress-fill"></span>';
  document.body.appendChild(progress);
  const fill = progress.firstElementChild;

  const revealItems = $$('.section-heading, .match-card, .competition-layout, .news-card, .game-layout, .closing-inner');
  revealItems.forEach((item, index) => {
    item.classList.add('reveal-on-scroll');
    if (item.classList.contains('section-heading')) item.classList.add('section-heading-reveal');
    item.style.transitionDelay = `${Math.min(index % 4, 3) * 65}ms`;
  });
  document.body.classList.add('motion-ready');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
  revealItems.forEach(item => observer.observe(item));

  let ticking = false;
  function updateProgress() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const percent = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
    fill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    ticking = false;
  }
  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateProgress);
  }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  updateProgress();
}

function initNavigation() {
  const toggle = $('#menuToggle');
  const nav = $('#mainNav');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? '✕' : '☰';
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = '☰';
  }));
  $$('#matchTabs [data-tab]').forEach(button => button.addEventListener('click', () => loadMatches(button.dataset.tab)));
  $$('#competitionTabs [data-sub]').forEach(button => button.addEventListener('click', () => { state.sub = button.dataset.sub; loadCompetitionPanel(); }));
  $('#competitionList').addEventListener('click', event => {
    const button = event.target.closest('[data-code]');
    if (button) selectCompetition(button.dataset.code);
  });
  $$('#newsCategories [data-cat]').forEach(button => button.addEventListener('click', () => {
    $('#newsQuery').value = ''; loadNews(button.dataset.cat);
  }));
  $('#newsForm').addEventListener('submit', event => {
    event.preventDefault();
    const query = $('#newsQuery').value.trim();
    if (!query) { toast('Digite um time, campeonato ou jogador.'); return; }
    loadNews(state.newsCategory, query);
  });
}
async function init() {
  initNavigation();
  initGame();
  initScrollEffects();
  loadMatches();
  loadNews();
  try {
    const config = await api('/api/config');
    state.competitions = config.competitions || [];
    if (!config.football) toast('Configure FOOTBALL_DATA_KEY no .env para ativar os resultados.');
    if (!config.news) toast('Configure GNEWS_KEY no .env para ativar as notícias.');
    renderCompetitionList();
    if (state.competitions.length) selectCompetition(state.competitions[0].code);
  } catch (error) {
    $('#competitionList').innerHTML = `<p class="muted">${esc(error.message)}</p>`;
  }
}
document.addEventListener('DOMContentLoaded', init);
