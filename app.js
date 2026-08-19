// ===============================
// FALA PAVÃO — APP V2
// ===============================
// Quando criarmos a API oficial do Instagram na Cloudflare,
// cole a URL do Worker abaixo. O Worker deve retornar:
// { data: [{id, caption, permalink, timestamp, media_url, thumbnail_url, media_type}] }
const INSTAGRAM_API_URL = "";

// Preencha estes links quando quiser ativá-los.
const LINKS = {
  instagram: "https://www.instagram.com/falapavao/",
  whatsapp: "",
  enviarNoticia: "",
  mercadoLivre: "",
  shopee: "",
  tiktok: "",
  anunciar: ""
};

const CATS = [
  { id: "todas", label: "Todas", icon: "⌂" },
  { id: "urgente", label: "Urgente", icon: "🚨" },
  { id: "cidade", label: "Vila Pavão", icon: "📍" },
  { id: "regiao", label: "Região", icon: "🌐" },
  { id: "policia", label: "Polícia", icon: "🛡" },
  { id: "cultura", label: "Cultura", icon: "♫" },
  { id: "esporte", label: "Esporte", icon: "⚽" }
];

let ARTICLES = [
  { id:"1", cat:"urgente", title:"PM morre baleado durante ocorrência em Cachoeiro de Itapemirim", dek:"Confira os detalhes completos na publicação do Fala Pavão.", time:"há 12 h", link:"https://www.instagram.com/reel/DcFD0TIRyPN/", image:"" },
  { id:"2", cat:"urgente", title:"Temporal com granizo causa estragos em Ibituba, zona rural de Baixo Guandu", dek:"Chuva forte veio acompanhada de rajadas de vento no Noroeste do ES.", time:"há 23 h", link:"https://www.instagram.com/reel/DcD7DKVtDct/", image:"" },
  { id:"3", cat:"policia", title:"Briga entre mulheres termina em tentativa de homicídio em Boa Esperança", dek:"Veja as informações publicadas pelo Fala Pavão no Instagram.", time:"ontem", link:"https://www.instagram.com/reel/DcBa1R1NXZT/", image:"" },
  { id:"4", cat:"regiao", title:"Dois jovens morrem em batida de moto contra caminhão na BR-259", dek:"Acidente aconteceu em Mascarenhas, zona rural de Baixo Guandu.", time:"há 5 dias", link:"https://www.instagram.com/reel/Db4-3wyNQyI/", image:"" },
  { id:"5", cat:"cidade", title:"Ventos fortes derrubam árvores em estradas rurais de Vila Pavão", dek:"Atenção redobrada para quem trafega pelas vias rurais.", time:"há 6 dias", link:"https://www.instagram.com/reel/Db2wBXJt13R/", image:"" },
  { id:"6", cat:"cultura", title:"27ª Pomitafro movimenta Vila Pavão com cultura e gastronomia", dek:"Tradições pomerana, italiana e afro-brasileira em destaque.", time:"há 1 sem", link:"https://www.instagram.com/falapavao/", image:"" }
];

let activeCat = "todas";
let searchTerm = "";
let menuOpen = false;
let searchOpen = false;

function safeLink(url, fallback = LINKS.instagram) {
  return url && url.trim() ? url : fallback;
}

function escapeHtml(s = "") {
  return String(s).replace(/[&<>'"]/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[c]));
}

function splitCaption(caption = "") {
  const clean = caption.replace(/\s*#[\wÀ-ú]+/g, "").trim();
  const cut = clean.search(/[.!?\n]/);
  let title = cut > 0 ? clean.slice(0, cut + 1) : clean.slice(0, 100);
  let dek = cut > 0 ? clean.slice(cut + 1).trim() : "";
  title = title.replace(/[.!?]$/, "").trim();
  if (title.length > 105) title = title.slice(0, 102) + "…";
  if (!dek) dek = "Confira os detalhes completos no Instagram do Fala Pavão.";
  if (dek.length > 180) dek = dek.slice(0, 177) + "…";
  return { title, dek };
}

function relativeTime(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "agora";
  const m = Math.max(1, Math.floor((Date.now() - d) / 60000));
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h} h`;
  const days = Math.floor(h / 24);
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  return `há ${Math.floor(days / 7)} sem`;
}

function categorize(text = "") {
  const t = text.toLowerCase();
  if (["urgente", "acidente", "morre", "morte", "ferido", "temporal", "alerta", "resgate"].some(k => t.includes(k))) return "urgente";
  if (["polícia", "policia", "preso", "prisão", "crime", "assalto", "operação"].some(k => t.includes(k))) return "policia";
  if (["pomitafro", "cultura", "pomeran", "festa", "show", "evento"].some(k => t.includes(k))) return "cultura";
  if (["vila pavão", "vila pavao"].some(k => t.includes(k))) return "cidade";
  return "regiao";
}

function normalizeMedia(m) {
  const caption = m.caption || "";
  const { title, dek } = splitCaption(caption);
  return {
    id: String(m.id || Math.random()),
    cat: categorize(caption),
    title,
    dek,
    time: relativeTime(m.timestamp),
    link: m.permalink || LINKS.instagram,
    image: m.thumbnail_url || m.media_url || ""
  };
}

function filterArticles() {
  let list = activeCat === "todas" ? ARTICLES : ARTICLES.filter(a => a.cat === activeCat);
  if (searchTerm) {
    const q = searchTerm.toLowerCase();
    list = list.filter(a => `${a.title} ${a.dek}`.toLowerCase().includes(q));
  }
  return list;
}

function categoryLabel(cat) {
  return CATS.find(c => c.id === cat)?.label || cat;
}

function newsCard(a) {
  return `
    <article class="news-card ${a.cat === "urgente" ? "urgent" : ""}">
      <div class="news-card-row">
        <div class="news-thumb ${a.image ? "has-image" : ""}">
          ${a.image ? `<img src="${escapeHtml(a.image)}" alt="">` : `<div class="thumb-fallback"><span>🦚</span></div>`}
        </div>
        <div class="news-body">
          <div class="news-top">
            <span class="tag">${a.cat === "urgente" ? "⚡ URGENTE" : escapeHtml(categoryLabel(a.cat).toUpperCase())}</span>
            <span class="time">${escapeHtml(a.time)}</span>
          </div>
          <h3>${escapeHtml(a.title)}</h3>
          <p>${escapeHtml(a.dek)}</p>
          <a href="${safeLink(a.link)}" target="_blank" rel="noopener">Ver no Instagram →</a>
        </div>
      </div>
    </article>`;
}

function reelCard(a) {
  return `
    <a class="reel" href="${safeLink(a.link)}" target="_blank" rel="noopener">
      <div class="reel-media">
        ${a.image ? `<img src="${escapeHtml(a.image)}" alt="">` : `<div class="reel-fallback"><img src="icons/pavv.png" alt=""></div>`}
        <span class="play">▶</span>
      </div>
      <div class="reel-copy">
        <strong>${escapeHtml(a.title)}</strong>
        <small>${escapeHtml(a.time)}</small>
      </div>
    </a>`;
}

function heroHtml(hero) {
  if (!hero) return "";
  return `
    <section class="hero">
      <div class="hero-media">
        ${hero.image ? `<img src="${escapeHtml(hero.image)}" alt="">` : `<div class="hero-fallback"><img src="icons/pavv.png" alt="Fala Pavão"></div>`}
      </div>
      <div class="hero-overlay"></div>
      <div class="hero-copy">
        <span class="badge">${hero.cat === "urgente" ? "URGENTE ⚡" : "DESTAQUE"}</span>
        <h1>${escapeHtml(hero.title)}</h1>
        <p>${escapeHtml(hero.time)}</p>
        <a class="outline-btn" href="${safeLink(hero.link)}" target="_blank" rel="noopener">VER NO INSTAGRAM <span>◎</span></a>
      </div>
      <div class="hero-dots"><i class="on"></i><i></i><i></i></div>
    </section>`;
}

function menuPanel() {
  return `
    <div class="shade ${menuOpen ? "show" : ""}" onclick="toggleMenu(false)"></div>
    <aside class="drawer ${menuOpen ? "open" : ""}">
      <div class="drawer-head">
        <img src="icons/pavv.png" alt="Fala Pavão">
        <button onclick="toggleMenu(false)">×</button>
      </div>
      <a href="${LINKS.instagram}" target="_blank">Instagram</a>
      <a href="${safeLink(LINKS.whatsapp)}" target="_blank">WhatsApp</a>
      <button onclick="scrollToNews();toggleMenu(false)">Últimas notícias</button>
      <button onclick="scrollToOffers();toggleMenu(false)">Ofertas do dia</button>
      <a href="${safeLink(LINKS.anunciar)}" target="_blank">Anuncie no Fala Pavão</a>
    </aside>`;
}

function searchPanel() {
  return `
    <div class="search-pop ${searchOpen ? "show" : ""}">
      <div class="search-box">
        <span>⌕</span>
        <input id="search-input" value="${escapeHtml(searchTerm)}" placeholder="Pesquisar notícias..." oninput="searchNews(this.value)">
        <button onclick="toggleSearch(false)">×</button>
      </div>
    </div>`;
}

function render() {
  const root = document.getElementById("app");
  const filtered = filterArticles();
  const hero = filtered[0] || ARTICLES[0];
  const rest = filtered.slice(hero ? 1 : 0);

  root.innerHTML = `
    <div class="app">
      ${menuPanel()}
      ${searchPanel()}

      <header class="header">
        <button class="round" aria-label="Menu" onclick="toggleMenu(true)">☰</button>
        <div class="brand">
          <img src="icons/pavv.png" alt="@falapavao notícias">
          <span>VILA PAVÃO • ES E REGIÃO</span>
        </div>
        <button class="round search-round" aria-label="Buscar" onclick="toggleSearch(true)">⌕</button>
      </header>

      <div class="top-ad">
        <span>DIVULGUE SUA MARCA AQUI</span>
        <a href="${safeLink(LINKS.anunciar)}" target="_blank">ANUNCIAR</a>
      </div>

      <div class="ticker">
        <div class="ticker-label"><strong>⚡</strong><span>ÚLTIMAS</span></div>
        <div class="ticker-window">
          <div class="ticker-track">
            ${[...ARTICLES, ...ARTICLES].map(a => `<span><b>●</b>${escapeHtml(a.title)}</span>`).join("")}
          </div>
        </div>
      </div>

      <nav class="categories">
        ${CATS.map(c => `<button class="chip ${activeCat === c.id ? "active" : ""}" onclick="setCategory('${c.id}')"><span>${c.icon}</span>${c.label.toUpperCase()}</button>`).join("")}
      </nav>

      ${heroHtml(hero)}

      <section class="section instagram-section">
        <div class="section-head">
          <h2><span class="instagram-mark">◎</span> ÚLTIMAS DO INSTAGRAM</h2>
          <a href="${LINKS.instagram}" target="_blank">VER TODOS ›</a>
        </div>
        <div class="reels">${ARTICLES.slice(0, 8).map(reelCard).join("")}</div>
      </section>

      <section class="challenge">
        <div class="box-art">🎁<span>?</span></div>
        <div class="challenge-copy">
          <h2>O QUE TEM<br>NA CAIXA?</h2>
          <p>Acerte o que tem dentro da caixa e concorra a um prêmio especial!</p>
        </div>
        <div class="challenge-actions">
          <a class="cta" href="${LINKS.instagram}" target="_blank" rel="noopener">PARTICIPAR AGORA</a>
          <small>Respostas somente no Instagram ◎</small>
        </div>
      </section>

      <section class="quick">
        <a class="quick-card whats" href="${safeLink(LINKS.whatsapp)}" target="_blank">
          <span class="quick-icon">☏</span>
          <div><strong>Fale com o Fala Pavão</strong><span>Clique e fale no WhatsApp</span></div>
          <b>›</b>
        </a>
        <a class="quick-card tip" href="${safeLink(LINKS.enviarNoticia)}" target="_blank">
          <span class="quick-icon">▣</span>
          <div><strong>Envie sua notícia</strong><span>Mande fotos, vídeos e informações</span></div>
          <b>›</b>
        </a>
      </section>

      <section class="section offers-section">
        <div class="section-head"><h2>◇ OFERTAS DO DIA</h2><button onclick="scrollToOffers()">VER TODAS ›</button></div>
        <div class="offers">
          <article class="offer ml">
            <div class="market-logo">mercado<br><b>livre</b></div>
            <p>Ofertas selecionadas e oportunidades.</p>
            <a href="${safeLink(LINKS.mercadoLivre)}" target="_blank">VER OFERTAS</a>
          </article>
          <article class="offer shopee">
            <div class="market-logo">▢ <b>Shopee</b></div>
            <p>Cupons, produtos e promoções.</p>
            <a href="${safeLink(LINKS.shopee)}" target="_blank">VER OFERTAS</a>
          </article>
          <article class="offer tiktok">
            <div class="market-logo">♪ <b>TikTok Shop</b></div>
            <p>Achadinhos e promoções em destaque.</p>
            <a href="${safeLink(LINKS.tiktok)}" target="_blank">VER OFERTAS</a>
          </article>
        </div>
      </section>

      <section class="ad">
        <strong>ANUNCIE AQUI!</strong>
        <span>Sua marca vista por milhares de pessoas em Vila Pavão e região.</span>
        <a href="${safeLink(LINKS.anunciar)}" target="_blank">SAIBA MAIS</a>
      </section>

      <section class="section more-title"><div class="section-head"><h2>▤ MAIS NOTÍCIAS</h2></div></section>
      <section class="feed" id="news-feed">
        ${rest.length ? rest.map(newsCard).join("") : `<div class="empty">Nenhuma notícia encontrada.</div>`}
      </section>

      <nav class="tabbar">
        <button class="active" onclick="setCategory('todas')"><span class="tab-ico">⌂</span>INÍCIO</button>
        <button onclick="scrollToNews()"><span class="tab-ico">▤</span>NOTÍCIAS</button>
        <a href="${LINKS.instagram}" target="_blank"><span class="tab-ico">🎁</span>CAIXA</a>
        <button onclick="scrollToOffers()"><span class="tab-ico">◇</span>OFERTAS</button>
        <a href="${safeLink(LINKS.whatsapp)}" target="_blank"><span class="tab-ico">☏</span>WHATSAPP</a>
      </nav>
    </div>`;

  if (searchOpen) setTimeout(() => document.getElementById("search-input")?.focus(), 0);
}

function setCategory(cat) {
  activeCat = cat;
  searchTerm = "";
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollToNews() {
  document.querySelector("#news-feed")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function scrollToOffers() {
  document.querySelector(".offers-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function toggleMenu(open) {
  menuOpen = open;
  render();
}

function toggleSearch(open) {
  searchOpen = open;
  render();
}

function searchNews(value) {
  searchTerm = value;
  const caret = value.length;
  render();
  setTimeout(() => {
    const input = document.getElementById("search-input");
    if (input) {
      input.focus();
      input.setSelectionRange(caret, caret);
    }
  }, 0);
}

async function loadInstagram() {
  if (!INSTAGRAM_API_URL) return;
  try {
    const r = await fetch(INSTAGRAM_API_URL, { cache: "no-store" });
    if (!r.ok) throw new Error("Instagram API");
    const json = await r.json();
    const media = Array.isArray(json) ? json : (json.data || []);
    const fresh = media.map(normalizeMedia).filter(a => a.title);
    if (fresh.length) {
      ARTICLES = fresh.slice(0, 30);
      render();
    }
  } catch (e) {
    console.warn("Usando notícias locais até a API do Instagram responder.", e);
  }
}

render();
loadInstagram();
setInterval(loadInstagram, 10 * 60 * 1000);

// PWA / instalação
let deferredPrompt = null;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById("install-banner")?.classList.add("show");
});

function installApp() {
  const banner = document.getElementById("install-banner");
  if (isIOS) {
    const text = document.getElementById("install-text");
    const btn = document.getElementById("install-btn");
    if (text) text.textContent = "No iPhone: Compartilhar → Adicionar à Tela de Início";
    if (btn) btn.style.display = "none";
    banner?.classList.add("show");
    return;
  }
  banner?.classList.remove("show");
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt = null;
  }
}

function dismissInstall() {
  document.getElementById("install-banner")?.classList.remove("show");
}

if (isIOS && !window.navigator.standalone) {
  setTimeout(() => {
    const banner = document.getElementById("install-banner");
    const text = document.getElementById("install-text");
    const btn = document.getElementById("install-btn");
    if (text) text.textContent = "No iPhone: Compartilhar → Adicionar à Tela de Início";
    if (btn) btn.style.display = "none";
    banner?.classList.add("show");
  }, 1500);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
}
