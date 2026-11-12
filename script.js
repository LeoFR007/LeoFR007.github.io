/* ==========================================================================
   Portfólio — script.js
   Melhoria progressiva: o conteúdo principal já está no HTML. Este arquivo
   adiciona menu móvel, dados pessoais configuráveis, integração com o GitHub
   e animações discretas. Cada parte roda isolada; uma falha não derruba as outras.
   ========================================================================== */

'use strict';

/* --------------------------------------------------------------------------
   CONFIGURAÇÃO — edite apenas este bloco para personalizar o site.
   Campos vazios ("") são tratados como "não informado" e não aparecem na página.
   O nome é editado diretamente no index.html (busque por "Seu Nome").
   -------------------------------------------------------------------------- */
const CONFIG = {
  // Foto profissional. Ex.: "assets/foto.jpg" (caminho relativo, sem "/" no início).
  // Informe a largura e a altura reais da imagem, em pixels.
  photo: {
    src: '',
    width: 480,
    height: 480,
  },

  // Currículo em PDF. Ex.: "assets/curriculo.pdf"
  resume: '',

  contact: {
    linkedin: 'https://www.linkedin.com/in/leonardo-rodrigues007/', // Ex.: "https://www.linkedin.com/in/seu-perfil/"
    email: 'leofr2007@outlook.com', // Ex.: "voce@exemplo.com"
    whatsapp: '', // Com código do país e DDD. Ex.: "+55 51 99999-9999"
  },

  // Links de comprovação (URL https ou arquivo em assets/). Vazio = sem link.
  certificationLinks: {
    'ciberseguranca-senai': '',
    'iot-senai': '',
    'mecanica-automotiva': '',
  },

  // Datas dos marcos da formação: "AAAA" ou "AAAA-MM".
  // Quando TODOS tiverem data, a lista passa a ser ordenada cronologicamente.
  milestones: {
    'mecanica-automotiva': '',
    'cursos-senai': '',
    pucrs: '',
    projetos: '',
  },

  github: {
    username: 'LeoFR007', // Ex.: "seu-usuario". Também gera o link de contato do GitHub.
    // Repositórios em destaque, na ordem desejada. Têm prioridade sobre a seleção automática.
    featured: [], // Ex.: ["estacao-meteorologica-esp32", "braco-robotico"]
    autoSelect: true, // Sem destaques: mostra os repositórios atualizados mais recentemente.
    limit: 6,
    cacheMinutes: 60,
  },
};

/* --------------------------------------------------------------------------
   Constantes internas
   -------------------------------------------------------------------------- */
const SVG_NS = 'http://www.w3.org/2000/svg';
const NAME_PLACEHOLDER = 'Seu Nome';
const GITHUB_API = 'https://api.github.com';
const GITHUB_USER_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const EMAIL_PATTERN = /^[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[a-z]{2,}$/i;
const MILESTONE_PATTERN = /^(\d{4})(?:-(0[1-9]|1[0-2]))?$/;
// Caminho relativo seguro: sem "/" inicial, sem "..", sem esquema (javascript:, data: etc.).
const RELATIVE_PATH_PATTERN = /^(?!\/)(?!.*\.\.)(?![a-z][a-z\d+.-]*:)[\w\-./%]+$/i;
const CACHE_PREFIX = 'portfolio:github:v1:';
const FETCH_TIMEOUT_MS = 10000;

/* --------------------------------------------------------------------------
   Utilidades
   -------------------------------------------------------------------------- */

/** Considera vazio também marcadores como "[SEU USUARIO]". */
function isConfigured(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed !== '' && !/^\[.*\]$/.test(trimmed);
}

/** Retorna uma URL segura (https ou caminho relativo permitido) ou null. */
function toSafeUrl(value, { allowRelative = false } = {}) {
  if (!isConfigured(value)) return null;
  const trimmed = value.trim();
  if (allowRelative && RELATIVE_PATH_PATTERN.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function isValidGitHubUser(value) {
  return isConfigured(value) && GITHUB_USER_PATTERN.test(value.trim());
}

/** Cria elementos sempre com textContent — dados externos nunca passam por innerHTML. */
function el(tag, { className, text, attrs } = {}, children = []) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  if (attrs) {
    Object.entries(attrs).forEach(([key, value]) => {
      if (value != null && value !== false) node.setAttribute(key, value === true ? '' : String(value));
    });
  }
  children.forEach((child) => child && node.append(child));
  return node;
}

function icon(id) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `#${id}`);
  svg.append(use);
  return svg;
}

/** Link externo que abre em nova aba, com aviso para leitores de tela. */
function externalLink(href, text, { className, iconId } = {}) {
  const link = el('a', { className, attrs: { href, target: '_blank', rel: 'noopener noreferrer' } });
  if (iconId) link.append(icon(iconId));
  link.append(document.createTextNode(text));
  link.append(el('span', { className: 'visually-hidden', text: ' (abre em nova aba)' }));
  return link;
}

function getOwnerName() {
  const name = document.querySelector('.hero-name')?.textContent.trim() ?? '';
  return name && name !== NAME_PLACEHOLDER ? name : '';
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-BR');
}

/* --------------------------------------------------------------------------
   Menu móvel
   -------------------------------------------------------------------------- */
function initMenu() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;

  const desktop = window.matchMedia('(min-width: 60em)');
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  function setOpen(open, { returnFocus = false } = {}) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    if (open) {
      nav.querySelector('a')?.focus();
    } else if (returnFocus) {
      toggle.focus();
    }
  }

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) setOpen(false, { returnFocus: true });
  });

  // Fecha ao escolher um destino; o foco segue para a seção de destino pela navegação por âncora.
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a') && isOpen()) setOpen(false);
  });

  // Fecha ao tocar fora do cabeçalho.
  document.addEventListener('click', (event) => {
    if (isOpen() && !event.target.closest('.site-header')) setOpen(false);
  });

  // Fecha quando o foco sai do menu pelo teclado (Tab após o último link).
  nav.addEventListener('focusout', (event) => {
    if (isOpen() && event.relatedTarget && !nav.contains(event.relatedTarget) && event.relatedTarget !== toggle) {
      setOpen(false);
    }
  });

  desktop.addEventListener('change', (event) => {
    if (event.matches && isOpen()) setOpen(false);
  });
}

/* --------------------------------------------------------------------------
   Rodapé: ano atual (o HTML já traz um valor inicial)
   -------------------------------------------------------------------------- */
function initYear() {
  const year = String(new Date().getFullYear());
  document.querySelectorAll('[data-year]').forEach((node) => {
    node.textContent = year;
  });
}

/* --------------------------------------------------------------------------
   Foto e currículo
   -------------------------------------------------------------------------- */
function initPhoto() {
  const slot = document.querySelector('[data-photo-slot]');
  const src = toSafeUrl(CONFIG.photo.src, { allowRelative: true });
  if (!slot || !src) return;

  const placeholder = slot.querySelector('.portrait-placeholder');
  const name = getOwnerName();
  // Imagem principal visível no carregamento: sem lazy loading.
  const img = el('img', {
    attrs: {
      src,
      alt: name ? `Foto de ${name}` : 'Foto profissional',
      width: CONFIG.photo.width,
      height: CONFIG.photo.height,
      decoding: 'async',
      fetchpriority: 'high',
    },
  });

  // Se o arquivo não existir, mantém o espaço reservado em vez de mostrar uma imagem quebrada.
  img.addEventListener('error', () => {
    img.remove();
    if (placeholder) placeholder.hidden = false;
  });

  if (placeholder) placeholder.hidden = true;
  slot.prepend(img);
}

function initResume() {
  const slot = document.querySelector('[data-resume-slot]');
  if (!slot) return;

  const href = toSafeUrl(CONFIG.resume, { allowRelative: true });
  if (!href) {
    slot.replaceChildren(el('span', { className: 'status-msg', text: 'Currículo em PDF disponível em breve.' }));
    return;
  }

  const link = el('a', {
    className: 'btn btn-secondary',
    attrs: { href, type: 'application/pdf', target: '_blank', rel: 'noopener' },
  });
  link.append(icon('i-file'), document.createTextNode('Ver currículo (PDF)'));
  link.append(el('span', { className: 'visually-hidden', text: ' (abre em nova aba)' }));
  slot.replaceChildren(link);
}

/* --------------------------------------------------------------------------
   Contato e redes
   -------------------------------------------------------------------------- */
function normalizeWhatsApp(value) {
  if (!isConfigured(value)) return null;
  const digits = value.replace(/\D/g, '').replace(/^00/, '');
  // E.164: até 15 dígitos incluindo o código do país.
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

function getContactChannels() {
  const { contact, github } = CONFIG;
  const channels = [];

  const linkedin = toSafeUrl(contact.linkedin);
  if (linkedin && /(^|\.)linkedin\.com$/i.test(new URL(linkedin).hostname)) {
    channels.push({ label: 'LinkedIn', detail: 'Perfil profissional', href: linkedin, iconId: 'i-linkedin', external: true });
  }

  if (isValidGitHubUser(github.username)) {
    const user = github.username.trim();
    channels.push({ label: 'GitHub', detail: `@${user}`, href: `https://github.com/${user}`, iconId: 'i-branch', external: true });
  }

  const email = isConfigured(contact.email) ? contact.email.trim() : '';
  if (EMAIL_PATTERN.test(email)) {
    channels.push({ label: 'E-mail', detail: email, href: `mailto:${email}`, iconId: 'i-mail', external: false });
  }

  const whatsapp = normalizeWhatsApp(contact.whatsapp);
  if (whatsapp) {
    channels.push({ label: 'WhatsApp', detail: `+${whatsapp}`, href: `https://wa.me/${whatsapp}`, iconId: 'i-chat', external: true });
  }

  return channels;
}

function buildContactLink(channel) {
  const attrs = { href: channel.href };
  if (channel.external) Object.assign(attrs, { target: '_blank', rel: 'noopener noreferrer' });

  const text = el('span', { className: 'contact-text' }, [
    el('span', { className: 'contact-label', text: channel.label }),
    el('span', { className: 'contact-detail', text: channel.detail }),
  ]);
  if (channel.external) text.append(el('span', { className: 'visually-hidden', text: ' (abre em nova aba)' }));

  return el('a', { className: 'contact-link', attrs }, [icon(channel.iconId), text]);
}

function initContacts() {
  const channels = getContactChannels();
  const list = document.querySelector('[data-contact-list]');
  const empty = document.querySelector('[data-contact-empty]');
  const social = document.querySelector('[data-social-list]');

  if (list) list.replaceChildren(...channels.map((channel) => el('li', {}, [buildContactLink(channel)])));
  if (empty) empty.hidden = channels.length > 0;

  if (social) {
    social.replaceChildren(
      ...channels.map((channel) => {
        const attrs = { href: channel.href };
        if (channel.external) Object.assign(attrs, { target: '_blank', rel: 'noopener noreferrer' });
        return el('li', {}, [el('a', { text: channel.label, attrs })]);
      }),
    );
  }
}

/* --------------------------------------------------------------------------
   Comprovantes de certificações
   -------------------------------------------------------------------------- */
function initCertificationLinks() {
  document.querySelectorAll('[data-cert-link]').forEach((slot) => {
    const href = toSafeUrl(CONFIG.certificationLinks[slot.dataset.certLink], { allowRelative: true });
    if (href) slot.replaceChildren(externalLink(href, 'Ver comprovante', { className: 'text-link', iconId: 'i-external' }));
  });
}

/* --------------------------------------------------------------------------
   Marcos da formação: datas opcionais e ordenação
   -------------------------------------------------------------------------- */
function formatMilestone(match) {
  const [, year, month] = match;
  if (!month) return year;
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function initMilestones() {
  const list = document.querySelector('[data-milestones]');
  if (!list) return;

  const items = Array.from(list.querySelectorAll('[data-milestone]'));
  let datedCount = 0;

  items.forEach((item) => {
    const raw = (CONFIG.milestones[item.dataset.milestone] || '').trim();
    const match = MILESTONE_PATTERN.exec(raw);
    const slot = item.querySelector('[data-milestone-date]');
    if (!match || !slot) return;

    slot.replaceChildren(el('time', { text: formatMilestone(match), attrs: { datetime: raw } }));
    slot.hidden = false;
    item.dataset.sortKey = raw;
    datedCount += 1;
  });

  // Só ordena quando todas as datas foram informadas, para não sugerir uma cronologia parcial.
  if (items.length > 1 && datedCount === items.length) {
    items
      .sort((a, b) => a.dataset.sortKey.localeCompare(b.dataset.sortKey))
      .forEach((item) => list.append(item));
    const note = document.querySelector('[data-milestones-note]');
    if (note) note.textContent = 'Etapas que compõem minha formação, em ordem cronológica.';
  }
}

/* --------------------------------------------------------------------------
   GitHub
   -------------------------------------------------------------------------- */
class GitHubError extends Error {
  constructor(kind, details = {}) {
    super(kind);
    this.kind = kind;
    Object.assign(this, details);
  }
}

function readCache(key) {
  try {
    const data = JSON.parse(window.localStorage.getItem(key));
    if (data && typeof data.savedAt === 'number' && Array.isArray(data.repos)) return data;
  } catch {
    // Armazenamento bloqueado ou dados corrompidos: segue sem cache.
  }
  return null;
}

function writeCache(key, repos) {
  try {
    window.localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), repos }));
  } catch {
    // Modo privado ou cota excedida: o cache é apenas uma otimização.
  }
}

/** Guarda só os campos usados, já normalizados como texto. */
function pickRepoFields(repo) {
  return {
    name: typeof repo.name === 'string' ? repo.name : '',
    description: typeof repo.description === 'string' ? repo.description : '',
    url: typeof repo.html_url === 'string' ? repo.html_url : '',
    language: typeof repo.language === 'string' ? repo.language : '',
    fork: Boolean(repo.fork),
    archived: Boolean(repo.archived),
    pushedAt: typeof repo.pushed_at === 'string' ? repo.pushed_at : '',
  };
}

async function fetchRepos(username) {
  const url = `${GITHUB_API}/users/${encodeURIComponent(username)}/repos?per_page=100&type=owner&sort=pushed`;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, { headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal });
  } catch (error) {
    throw new GitHubError(error.name === 'AbortError' ? 'timeout' : 'network');
  } finally {
    window.clearTimeout(timer);
  }

  if (response.status === 404) throw new GitHubError('not-found');

  if (response.status === 403 || response.status === 429) {
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = Number(response.headers.get('x-ratelimit-reset'));
    if (response.status === 429 || remaining === '0') {
      throw new GitHubError('rate-limit', { resetAt: reset ? new Date(reset * 1000) : null });
    }
  }

  if (!response.ok) throw new GitHubError('http', { status: response.status });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new GitHubError('invalid');
  }
  if (!Array.isArray(data)) throw new GitHubError('invalid');

  return data
    .map(pickRepoFields)
    .filter((repo) => repo.name && repo.url.startsWith('https://github.com/'));
}

/** Usa o cache válido; se a rede falhar, recorre ao cache vencido como última opção. */
async function loadRepos(username) {
  const key = CACHE_PREFIX + username.toLowerCase();
  const cached = readCache(key);
  const ttl = Math.max(1, Number(CONFIG.github.cacheMinutes) || 60) * 60 * 1000;

  if (cached && Date.now() - cached.savedAt < ttl) {
    return { repos: cached.repos, savedAt: cached.savedAt, stale: false };
  }

  try {
    const repos = await fetchRepos(username);
    writeCache(key, repos);
    return { repos, savedAt: Date.now(), stale: false };
  } catch (error) {
    if (cached && error.kind !== 'not-found') {
      return { repos: cached.repos, savedAt: cached.savedAt, stale: true };
    }
    throw error;
  }
}

function selectRepos(repos) {
  const { featured, autoSelect, limit } = CONFIG.github;
  const featuredNames = (Array.isArray(featured) ? featured : [])
    .filter(isConfigured)
    .map((name) => name.trim().toLowerCase());

  if (featuredNames.length > 0) {
    const byName = new Map(repos.map((repo) => [repo.name.toLowerCase(), repo]));
    const items = featuredNames.map((name) => byName.get(name)).filter(Boolean);
    const missing = featuredNames.filter((name) => !byName.has(name));
    if (missing.length) console.warn('[portfólio] Repositórios em destaque não encontrados:', missing.join(', '));
    return { items, criteria: 'Repositórios públicos selecionados manualmente.' };
  }

  if (!autoSelect) return { items: [], criteria: '' };

  const max = Math.max(1, Number(limit) || 6);
  // O repositório com o mesmo nome do usuário é o README do perfil, não um projeto.
  const profileRepo = String(CONFIG.github.username).trim().toLowerCase();
  const items = repos
    .filter((repo) => !repo.fork && !repo.archived && repo.name.toLowerCase() !== profileRepo)
    .sort((a, b) => b.pushedAt.localeCompare(a.pushedAt))
    .slice(0, max);

  return {
    items,
    criteria: `Seleção automática: até ${max} repositórios públicos próprios (sem forks, arquivados e o README do perfil), ordenados pela atualização mais recente.`,
  };
}

function buildRepoCard(repo) {
  const meta = el('p', { className: 'repo-meta' });
  if (repo.language) meta.append(el('span', { className: 'repo-lang', text: repo.language }));
  const updated = formatDate(repo.pushedAt);
  if (updated) meta.append(el('span', { text: `Atualizado em ${updated}` }));

  const title = el('h3', {}, [externalLink(repo.url, repo.name)]);
  const description = el('p', { className: 'repo-desc', text: repo.description || 'Sem descrição.' });

  return el('li', {}, [el('article', { className: 'card repo-card' }, [title, description, meta])]);
}

function githubErrorMessage(error) {
  switch (error.kind) {
    case 'not-found':
      return 'O usuário do GitHub configurado não foi encontrado.';
    case 'rate-limit': {
      const time = error.resetAt instanceof Date && !Number.isNaN(error.resetAt.getTime())
        ? ` Tente novamente após ${error.resetAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`
        : ' Tente novamente mais tarde.';
      return `O limite de consultas à API pública do GitHub foi atingido.${time}`;
    }
    case 'timeout':
    case 'network':
      return 'Não foi possível conectar ao GitHub agora. Os repositórios podem ser vistos diretamente no perfil.';
    default:
      return 'Não foi possível carregar os repositórios agora. Os repositórios podem ser vistos diretamente no perfil.';
  }
}

function setStatus(node, message, state) {
  if (!node) return;
  node.textContent = message;
  if (state) node.dataset.state = state;
  else delete node.dataset.state;
}

async function initGitHub() {
  const statusNode = document.querySelector('[data-github-status]');
  const list = document.querySelector('[data-github-list]');
  const criteriaNode = document.querySelector('[data-github-criteria]');
  const profileNode = document.querySelector('[data-github-profile]');
  if (!list) return;

  const { username } = CONFIG.github;
  // Sem usuário válido, nenhuma requisição é feita; a mensagem do HTML permanece.
  if (!isValidGitHubUser(username)) return;

  const user = username.trim();
  if (profileNode) {
    profileNode.replaceChildren(
      externalLink(`https://github.com/${user}`, `Ver perfil completo no GitHub (@${user})`, { className: 'text-link', iconId: 'i-branch' }),
    );
  }
  if (criteriaNode) criteriaNode.textContent = 'Repositórios públicos obtidos da API do GitHub.';

  setStatus(statusNode, 'Carregando repositórios públicos…', 'loading');
  list.setAttribute('aria-busy', 'true');

  try {
    const { repos, savedAt, stale } = await loadRepos(user);
    const { items, criteria } = selectRepos(repos);

    if (criteriaNode && criteria) criteriaNode.textContent = criteria;
    list.replaceChildren(...items.map(buildRepoCard));

    if (items.length === 0) {
      setStatus(statusNode, 'Nenhum repositório público para exibir no momento.', 'empty');
    } else if (stale) {
      setStatus(statusNode, `Exibindo dados salvos em ${new Date(savedAt).toLocaleString('pt-BR')}, pois a atualização não foi possível agora.`, 'info');
    } else {
      setStatus(statusNode, '');
    }
  } catch (error) {
    list.replaceChildren();
    setStatus(statusNode, githubErrorMessage(error), 'error');
    if (!(error instanceof GitHubError)) throw error;
  } finally {
    list.removeAttribute('aria-busy');
  }
}

/* --------------------------------------------------------------------------
   Animações de entrada (opcionais)
   -------------------------------------------------------------------------- */
function initReveal() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const elements = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window) || elements.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );

  elements.forEach((element) => observer.observe(element));
  // Só oculta os elementos depois que o observador está ativo.
  document.documentElement.classList.add('reveal-ready');
}

/* --------------------------------------------------------------------------
   Inicialização isolada
   -------------------------------------------------------------------------- */
function safeRun(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.catch === 'function') {
      result.catch((error) => console.error(`[portfólio] ${name}:`, error));
    }
  } catch (error) {
    console.error(`[portfólio] ${name}:`, error);
  }
}

safeRun('menu', initMenu);
safeRun('ano', initYear);
safeRun('foto', initPhoto);
safeRun('currículo', initResume);
safeRun('contatos', initContacts);
safeRun('certificações', initCertificationLinks);
safeRun('marcos', initMilestones);
safeRun('reveal', initReveal);
safeRun('github', initGitHub);
