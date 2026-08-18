// URL da planilha do Google publicada como CSV (Arquivo > Compartilhar > Publicar na web > CSV).
// Cole aqui o link gerado depois de configurar a exportação automática no Windsor.ai.
const SHEET_CSV_URL = "";

// URL de uma planilha (ou célula publicada) com o número de seguidores atual.
// Configure um segundo destino no Windsor.ai exportando só "followers_count"
// e cole aqui o link CSV publicado para o contador atualizar sozinho.
const FOLLOWERS_CSV_URL = "https://docs.google.com/spreadsheets/d/15lEQwcynEYbdrDdkHC-P3hX-sMXrb2J4VVv4BWCVe0g/export?format=csv&gid=0";
const FALLBACK_FOLLOWERS = 8440;
const FOLLOWERS_GOAL = 10000;

const CATS = [
  { id: "urgente", label: "Urgente", cls: "cat-urgente" },
  { id: "cidade", label: "Cidade", cls: "cat-cidade" },
  { id: "pomitafro", label: "Pomitafro & Cultura", cls: "cat-pomitafro" },
  { id: "fofoca", label: "Fofoca", cls: "cat-fofoca" },
  { id: "servico", label: "Serviço", cls: "cat-servico" },
];

const CAT_COLORS = {
  urgente: "#ED4956",
  cidade: "#0095F6",
  pomitafro: "#C13584",
  fofoca: "#F56040",
  servico: "#405DE6",
};

let ARTICLES = [
  { id: "18160566271485810", cat: "urgente", stamp: true, title: "PM morre baleado durante ocorrência em Cachoeiro de Itapemirim", dek: "Soldado Paulo Henrique Carvalho Faccin, de 28 anos, do 9º Batalhão, não resistiu aos ferimentos. Categoria e colegas de farda lamentam a perda.", time: "há 12 h", reads: "19.5 mil", link: "https://www.instagram.com/reel/DcFD0TIRyPN/" },
  { id: "18063703955764800", cat: "urgente", stamp: true, title: "Temporal com granizo causa estragos em Ibituba, zona rural de Baixo Guandu", dek: "Chuva forte veio acompanhada de rajadas de vento no fim da tarde de sexta-feira no Noroeste do ES.", time: "há 23 h", reads: "3 mil", link: "https://www.instagram.com/reel/DcD7DKVtDct/" },
  { id: "18077322752356333", cat: "urgente", stamp: true, title: "Briga entre mulheres termina em tentativa de homicídio em Boa Esperança", dek: "Discussão dentro de uma academia acabou com uma facada no tórax. Vítima foi socorrida e levada a hospital da região.", time: "ontem", reads: "4.4 mil", link: "https://www.instagram.com/reel/DcBa1R1NXZT/" },
  { id: "18329799937262250", cat: "urgente", stamp: true, title: "Dois jovens morrem em batida de moto contra caminhão na BR-259", dek: "Acidente aconteceu na madrugada de sábado em Mascarenhas, zona rural de Baixo Guandu. Moto teria invadido a contramão.", time: "há 5 dias", reads: "4.2 mil", link: "https://www.instagram.com/reel/Db4-3wyNQyI/" },
  { id: "17900672694520173", cat: "urgente", stamp: true, title: "Ventos fortes derrubam árvores em estradas rurais de Vila Pavão", dek: "Motociclistas e veículos pequenos precisam de atenção redobrada nas vias rurais do município.", time: "há 6 dias", reads: "5.2 mil", link: "https://www.instagram.com/reel/Db2wBXJt13R/" },
  { id: "18109907308969521", cat: "urgente", stamp: true, title: "Acidente é registrado na rodovia entre Nova Venécia e Vila Pavão", dek: "Ainda não há informações oficiais sobre vítimas. Equipes de atendimento podem estar a caminho do local.", time: "há 1 sem", reads: "6.9 mil", link: "https://www.instagram.com/reel/DblLDL5NQcN/" },
  { id: "18123798790680696", cat: "urgente", stamp: true, title: "Moradora de Vila Pavão morre após acidente entre Nova Venécia e São Gabriel da Palha", dek: "Eula Paula Dersan, de 33 anos, estava internada desde o grave acidente na rodovia.", time: "há 3 sem", reads: "43.4 mil", link: "https://www.instagram.com/reel/DbESdlJtdyD/" },
  { id: "18141257971569161", cat: "cidade", stamp: false, title: "Lorenzo Pazolini anuncia vice na disputa pelo Governo do Espírito Santo", dek: "Bispa Eliane Leal, policial militar da reserva e pastora evangélica, foi a escolhida após semana de negociações.", time: "há 13 h", reads: "946", link: "https://www.instagram.com/reel/DcFAat2toRZ/" },
  { id: "18213072520355186", cat: "pomitafro", stamp: false, title: "A Igrejona: o símbolo luterano que carrega a história pomerana de Vila Pavão", dek: "Construção começou em mutirão comunitário, com pedras quebradas a marteladas. Primeiro culto registrado foi em 22 de julho de 1951.", time: "há 13 h", reads: "3.2 mil", link: "https://www.instagram.com/reel/DcE6Izmtjh_/" },
  { id: "18131202541653814", cat: "pomitafro", stamp: false, title: "27ª Pomitafro: Festival Gastronômico movimenta Vila Pavão", dek: "Pratos típicos das culturas pomerana, italiana e afro-brasileira reúnem moradores e visitantes na tradicional festa.", time: "há 16 h", reads: "1.2 mil", link: "https://www.instagram.com/reel/DcErUTONNgi/" },
  { id: "18111427301049312", cat: "cidade", stamp: false, title: "Ataque cibernético derruba sistemas de órgãos públicos no Espírito Santo", dek: "Grupo hacker BLCKORDER é apontado como responsável. Ao menos 20 instituições municipais do estado foram impactadas.", time: "há 3 dias", reads: "1.9 mil", link: "https://www.instagram.com/reel/Db9MjpWtEY0/" },
  { id: "18109221658946320", cat: "pomitafro", stamp: false, title: "Vila Pavão se prepara para 3 dias de celebração na 27ª edição da Pomitafro", dek: "Programação reúne cultura, música e gastronomia, valorizando as tradições pomerana, italiana e afro-brasileira.", time: "há 4 dias", reads: "1.1 mil", link: "https://www.instagram.com/reel/Db7sO0ItllT/" },
  { id: "18207836206360179", cat: "pomitafro", stamp: false, title: "A herança pomerana que ainda molda o dia a dia de Vila Pavão", dek: "Festas, culinária, língua e agricultura familiar seguem vivas na memória das famílias que formaram o município.", time: "há 1 sem", reads: "1.1 mil", link: "https://www.instagram.com/reel/Dbyz38TN6Cb/" },
  { id: "18473954764107610", cat: "cidade", stamp: false, title: "Faixa de pedestre apagada preocupa moradores em Nova Venécia", dek: "Sinalização em frente à Rede Cuidar perdeu eficácia e moradores pedem repintura urgente.", time: "há 1 sem", reads: "3 mil", link: "https://www.instagram.com/reel/Dbtyg1It0w_/" },
  { id: "18110586949813862", cat: "cidade", stamp: false, title: "Perseguição policial termina de forma inusitada em Vila Pavão", dek: "Viatura da PM perseguiu motociclistas pelas ruas da cidade até o desfecho inesperado da ocorrência.", time: "há 1 sem", reads: "20.7 mil", link: "https://www.instagram.com/reel/DbnFFdGNB42/" },
  { id: "17938750002335067", cat: "cidade", stamp: false, title: "Empresário vira réu por suspeita de trabalho análogo à escravidão em Vila Pavão", dek: "Justiça Federal aceitou denúncia do MPF contra proprietário rural do distrito de Praça Rica.", time: "há 1 sem", reads: "9.1 mil", link: "https://www.instagram.com/reel/DbkjziGNaFZ/" },
  { id: "18437844946193137", cat: "cidade", stamp: false, title: "Fala Pavão ultrapassa 2 milhões de visualizações em 30 dias", dek: "Marca reflete o crescimento do canal levando notícias de Vila Pavão, do ES e da região.", time: "há 1 sem", reads: "993", link: "https://www.instagram.com/reel/Dbi0zuvttgT/" },
  { id: "17975602256898326", cat: "pomitafro", stamp: false, title: "Esquenta Pomitafro abre o clima da maior festa étnico-cultural de Vila Pavão", dek: "Carreata reuniu moradores e visitantes. Marque na agenda: show de Alemão do Forró na programação oficial.", time: "há 3 sem", reads: "2.4 mil", link: "https://www.instagram.com/reel/DbN7ywVtwEf/" },
];

const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
  bookmarkCheck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/><path d="M9 11l2 2 4-4"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 3-2 4-2 7a3 3 0 0 0 6 0c1 2 1 4-1 6a6 6 0 1 1-9-8c1.5-1.5 2-3 2-5z"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="1"/><line x1="9" y1="7" x2="9" y2="7"/><line x1="15" y1="7" x2="15" y2="7"/><line x1="9" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="15" y2="12"/><line x1="9" y1="17" x2="15" y2="17"/></svg>',
  feather: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>',
  gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>',
};
const TABS = [
  { id: "todas", label: "Início", icon: "home" },
  { id: "urgente", label: "Urgente", icon: "alert" },
  { id: "cidade", label: "Vila Pavão", icon: "building" },
  { id: "pomitafro", label: "Cultura", icon: "feather" },
  { id: "produtos", label: "Mais", icon: "gift" },
];


let state = {
  tab: "todas",
  saved: JSON.parse(localStorage.getItem("fp:saved") || "[]"),
  followers: FALLBACK_FOLLOWERS,
};

function toggleSave(id) {
  state.saved = state.saved.includes(id)
    ? state.saved.filter((x) => x !== id)
    : [...state.saved, id];
  localStorage.setItem("fp:saved", JSON.stringify(state.saved));
  render();
}

function setTab(tab) {
  state.tab = tab;
  render();
}

function cardHtml(a) {
  const color = CAT_COLORS[a.cat];
  const catLabel = CATS.find((c) => c.id === a.cat).label;
  const saved = state.saved.includes(a.id);
  const tagHtml = a.stamp
    ? `<span class="fp-stamp" style="background:${color}">${ICONS.flame}URGENTE</span>`
    : `<span class="fp-tag" style="color:${color};background:${color}26">${catLabel.toUpperCase()}</span>`;
  return `
    <div class="fp-card" style="border-left-color:${color}">
      <div class="fp-card-top">
        ${tagHtml}
        <span class="fp-time">${a.time}</span>
      </div>
      <h3>${a.title}</h3>
      <p>${a.dek}</p>
      <div class="fp-card-bottom">
        <a class="fp-reads-link" href="${a.link}" target="_blank" rel="noopener">${a.reads} views · ver no Instagram</a>
        <button class="fp-save-btn ${saved ? "saved" : ""}" onclick="toggleSave('${a.id}')" aria-label="${saved ? "Remover dos salvos" : "Salvar matéria"}">
          ${saved ? ICONS.bookmarkCheck : ICONS.bookmark}
        </button>
      </div>
    </div>`;
}

function render() {
  const root = document.getElementById("app");

  const feed =
    state.tab === "produtos"
      ? []
      : state.tab === "todas"
      ? ARTICLES
      : ARTICLES.filter((a) => a.cat === state.tab);

  const coverHtml =
    state.tab === "todas"
      ? `<div class="fp-cover">
          <img src="icons/pavv.png" alt="Fala Pavão Notícias" />
        </div>`
      : "";

  const followersHtml =
    state.tab === "todas"
      ? `<div class="fp-followers">
          <div class="fp-followers-count" id="fp-followers-count">${state.followers.toLocaleString("pt-BR")}</div>
          <div class="fp-followers-label">seguidores</div>
          <div class="fp-followers-bar">
            <div class="fp-followers-bar-fill" style="width:${Math.min(100, (state.followers / FOLLOWERS_GOAL) * 100)}%"></div>
          </div>
          <a class="fp-followers-cta" href="https://www.instagram.com/falapavao/" target="_blank" rel="noopener">Você já segue? Rumo a 10k!!! 🦚</a>
        </div>`
      : "";

  let feedHtml;
  if (state.tab === "produtos") {
    feedHtml = `
      <div class="fp-soon">
        <div class="fp-soon-badge">EM BREVE</div>
        <p>A loja de produtos oficiais do Fala Pavão está a caminho.</p>
      </div>`;
  } else if (feed.length === 0) {
    feedHtml = `<div class="fp-empty">Nenhuma notícia nessa categoria agora.</div>`;
  } else {
    feedHtml = feed.map(cardHtml).join("");
  }

  root.innerHTML = `
    <div class="fp-header">
      <button aria-label="Menu">${ICONS.menu}</button>
      <div class="fp-title-wrap">
        <div class="fp-title">Fala Pavão</div>
        <div class="fp-subtitle">VILA PAVÃO · CIDADE POMERANA</div>
      </div>
      <button aria-label="Buscar">${ICONS.search}</button>
    </div>
    ${followersHtml}
    ${coverHtml}
    <div class="fp-ticker">
      <div class="fp-ticker-track">
        ${[...ARTICLES, ...ARTICLES].map((a) => `<span><span class="dot">●</span>${a.title}</span>`).join("")}
      </div>
    </div>
    <div class="fp-feed">
      ${feedHtml}
    </div>
    <div class="fp-tabbar">
      ${TABS.map(
        (t) => `<button class="fp-tab ${state.tab === t.id ? "active" : ""}" onclick="setTab('${t.id}')">${ICONS[t.icon]}<span>${t.label}</span></button>`
      ).join("")}
    </div>
  `;
}

// --- Auto-categorização por palavras-chave da legenda ---
const CAT_KEYWORDS = {
  urgente: ["acidente", "morre", "morte", "óbito", "obito", "alerta", "tempestade", "chuva forte", "enchente", "alagamento", "deslizamento", "assalto", "crime", "polícia", "policia", "flagrante", "preso", "presa", "fraude", "escravidão", "soterrado", "ferido", "vítima", "vitima", "urgente", "resgate"],
  pomitafro: ["pomitafro", "pomerano", "pomerana", "pomerania", "cultura", "tradição", "tradicao", "festa alemã", "festa alema", "colonização", "colonizacao", "herança", "heranca"],
  servico: ["inscrições", "inscricoes", "inscrição", "inscricao", "vaga", "curso", "edital", "concurso", "vacina", "detran", "cras", "prazo", "gratuito", "gratuita", "matrícula", "matricula"],
  fofoca: ["fofoca", "affair", "namoro", "términou", "terminou", "polêmica", "polemica", "web reage", "repercussão", "repercussao"],
};

function autoCategorize(caption) {
  const text = (caption || "").toLowerCase();
  for (const cat of ["urgente", "pomitafro"]) {
    if (CAT_KEYWORDS[cat].some((kw) => text.includes(kw))) return cat;
  }
  return "cidade";
}

function splitCaption(caption) {
  const clean = (caption || "").replace(/\s*#[\wÀ-ú]+/g, "").trim();
  const firstBreak = clean.search(/[.!?\n]/);
  let title = firstBreak > 0 ? clean.slice(0, firstBreak + 1) : clean.slice(0, 90);
  let dek = firstBreak > 0 ? clean.slice(firstBreak + 1).trim() : "";
  title = title.replace(/[.!?]$/, "").trim();
  if (title.length > 90) title = title.slice(0, 87).trim() + "…";
  if (!dek) dek = "Confira os detalhes completos no post original do @falapavao.";
  if (dek.length > 160) dek = dek.slice(0, 157).trim() + "…";
  return { title: title || "Confira essa novidade", dek };
}

function relativeTimeFrom(isoString) {
  const dt = new Date(isoString);
  if (isNaN(dt.getTime())) return "";
  const diffMin = Math.floor((Date.now() - dt.getTime()) / 60000);
  if (diffMin < 60) return `há ${Math.max(diffMin, 1)} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "ontem";
  if (diffD < 7) return `há ${diffD} dias`;
  return `há ${Math.floor(diffD / 7)} sem`;
}

function fmtViews(n) {
  n = Number(n) || 0;
  if (n >= 1000) {
    let s = (n / 1000).toFixed(1);
    if (s.endsWith(".0")) s = s.slice(0, -2);
    return s + " mil";
  }
  return String(n);
}

// --- CSV parsing (suporta campos entre aspas com vírgulas) ---
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); field = "";
        if (row.some((f) => f !== "")) rows.push(row);
        row = [];
      } else field += c;
    }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => (obj[h] = r[idx] !== undefined ? r[idx].trim() : ""));
    return obj;
  });
}

function rowsToArticles(rows) {
  return rows
    .filter((r) => (r.media_caption || r.caption || "").trim().length > 0)
    .map((r) => {
      const caption = r.media_caption || r.caption || "";
      const { title, dek } = splitCaption(caption);
      const cat = autoCategorize(caption);
      const views = r.media_views || r.media_reach || r.reach || 0;
      return {
        id: r.media_id || r.id || String(Math.random()),
        cat,
        stamp: cat === "urgente",
        title,
        dek,
        time: relativeTimeFrom(r.timestamp || r.created_at || ""),
        reads: fmtViews(views),
        link: r.media_permalink || r.permalink || "",
        _ts: r.timestamp || r.created_at || "",
      };
    })
    .sort((a, b) => (a._ts < b._ts ? 1 : -1))
    .sort((a, b) => (a.cat === "urgente") === (b.cat === "urgente") ? 0 : a.cat === "urgente" ? -1 : 1)
    .slice(0, 24);
}

async function loadArticlesFromSheet() {
  if (!SHEET_CSV_URL) return;
  try {
    const res = await fetch(SHEET_CSV_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("fetch failed");
    const text = await res.text();
    const rows = parseCSV(text);
    const fresh = rowsToArticles(rows);
    if (fresh.length) {
      ARTICLES = fresh;
      render();
    }
  } catch (e) {
    console.warn("Não foi possível carregar a planilha, usando conteúdo local.", e);
  }
}

function animateFollowersTo(target) {
  const el = document.getElementById("fp-followers-count");
  if (!el) { state.followers = target; return; }
  const start = state.followers;
  if (start === target) return;
  const steps = 20;
  const stepVal = (target - start) / steps;
  let i = 0;
  const timer = setInterval(() => {
    i++;
    state.followers = i >= steps ? target : Math.round(start + stepVal * i);
    el.textContent = state.followers.toLocaleString("pt-BR");
    if (i >= steps) clearInterval(timer);
  }, 40);
}

async function loadFollowersFromSheet() {
  if (!FOLLOWERS_CSV_URL) return;
  try {
    const res = await fetch(FOLLOWERS_CSV_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("fetch failed");
    const text = await res.text();
    const rows = parseCSV(text);
    const raw = rows[0] && (rows[0].followers_count || rows[0].followers || Object.values(rows[0])[0]);
    const count = parseInt(String(raw).replace(/[^\d]/g, ""), 10);
    if (!isNaN(count) && count > 0) {
      animateFollowersTo(count);
    }
  } catch (e) {
    console.warn("Não foi possível atualizar o contador de seguidores.", e);
  }
}

render();
loadArticlesFromSheet();
loadFollowersFromSheet();
// Atualiza o feed a cada 30 minutos e o contador de seguidores a cada 5 minutos, sem precisar reabrir o app.
setInterval(loadArticlesFromSheet, 30 * 60 * 1000);
setInterval(loadFollowersFromSheet, 5 * 60 * 1000);

// --- Install prompt handling ---
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const banner = document.getElementById("install-banner");
  if (banner) banner.classList.add("show");
});

function installApp() {
  const banner = document.getElementById("install-banner");
  if (banner) banner.classList.remove("show");
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt = null;
  }
}

function dismissInstall() {
  const banner = document.getElementById("install-banner");
  if (banner) banner.classList.remove("show");
}

// --- Service worker registration ---
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
