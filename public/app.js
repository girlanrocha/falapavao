// Fala Pavão V3 — mobile-first
const INSTAGRAM_PROFILE = "https://www.instagram.com/falapavao/";
const INSTAGRAM_API_URL = "/api/instagram";

const WHATSAPP_URL = ""; // depois colocaremos seu WhatsApp
const MERCADO_LIVRE_URL = "";
const SHOPEE_URL = "";
const TIKTOK_SHOP_URL = "";

// Notícias de segurança.
// Só aparecem se a conexão automática com o Instagram falhar.
let ARTICLES = [
  {
    id: "1",
    cat: "urgente",
    title: "Últimas notícias do Fala Pavão",
    dek: "Acompanhe as principais notícias no Instagram do Fala Pavão.",
    time: "agora",
    link: INSTAGRAM_PROFILE,
    image: ""
  }
];

const CATS = [
  ["todas", "⌂", "TODAS"],
  ["urgente", "🚨", "URGENTE"],
  ["cidade", "📍", "CIDADE"],
  ["regiao", "🌐", "REGIÃO"],
  ["policia", "🛡", "POLÍCIA"],
  ["cultura", "♫", "CULTURA"],
  ["esporte", "⚽", "ESPORTE"]
];

const CAT_LABELS = {
  urgente: "URGENTE ⚡",
  cidade: "VILA PAVÃO",
  regiao: "REGIÃO",
  policia: "POLÍCIA",
  cultura: "CULTURA",
  esporte: "ESPORTE"
};

let state = {
  tab: "todas"
};

let ALL_ARTICLES = [...ARTICLES];

function esc(s = "") {
  return String(s).replace(
    /[&<>"']/g,
    c =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[c])
  );
}

function setTab(id) {
  state.tab = id;
  ARTICLES = [...ALL_ARTICLES];
  render();
}

function go(url) {
  if (url) {
    window.open(url, "_blank", "noopener");
  }
}

function normalizeCats() {
  ARTICLES = ARTICLES.map(a => {
    let cat = a.cat || "regiao";

    if (cat === "pomitafro") {
      cat = "cultura";
    }

    return {
      ...a,
      cat,
      image: a.image || ""
    };
  });
}

normalizeCats();

function newsImage(a) {
  if (a && a.image) {
    return `
      <img
        src="${esc(a.image)}"
        alt="${esc(a.title || "Notícia Fala Pavão")}"
        loading="lazy"
      >
    `;
  }

  return `
    <div class="photo-fallback">
      <img
        src="icons/pavv.png"
        alt="Fala Pavão"
      >
    </div>
  `;
}

// Define automaticamente a categoria
// usando as palavras da legenda do Instagram.
function autoCategory(caption = "") {
  const t = caption.toLowerCase();

  if (
    /acidente|morre|morte|óbito|obito|homicídio|homicidio|assalto|tiroteio|ferido|ferida|vítima|vitima|chuva forte|temporal|alagamento|enchente|deslizamento|incêndio|incendio|urgente/.test(t)
  ) {
    return "urgente";
  }

  if (
    /polícia|policia|delegacia|operação policial|operacao policial|prisão|prisao|preso|presa|pc-es|pm-es/.test(t)
  ) {
    return "policia";
  }

  if (
    /pomitafro|cultura|pomeran|festa|evento|show|música|musica|festival|gastronomia/.test(t)
  ) {
    return "cultura";
  }

  if (
    /futebol|esporte|campeonato|jogo|gol|partida/.test(t)
  ) {
    return "esporte";
  }

  if (
    /vila pavão|vila pavao/.test(t)
  ) {
    return "cidade";
  }

  return "regiao";
}

// Transforma a legenda do Instagram
// em título + pequeno resumo.
function captionParts(caption = "") {
  const clean = caption
    .replace(/\s*#[\wÀ-ú]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const cut = clean.search(/[.!?\n]/);

  let title =
    cut > 15
      ? clean.slice(0, cut + 1)
      : clean.slice(0, 105);

  let dek =
    cut > 15
      ? clean.slice(cut + 1).trim()
      : "";

  title = title
    .replace(/[.!?]$/, "")
    .trim();

  if (title.length > 105) {
    title =
      title.slice(0, 102).trim() + "…";
  }

  if (!title) {
    title =
      "Nova publicação do Fala Pavão";
  }

  if (!dek) {
    dek =
      "Confira todos os detalhes no Instagram do Fala Pavão.";
  }

  if (dek.length > 180) {
    dek =
      dek.slice(0, 177).trim() + "…";
  }

  return {
    title,
    dek
  };
}

// Calcula automaticamente:
// há 10 min, há 2 h, ontem etc.
function relativeTime(iso) {
  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) {
    return "agora";
  }

  const mins = Math.max(
    1,
    Math.floor(
      (Date.now() - d.getTime()) / 60000
    )
  );

  if (mins < 60) {
    return `há ${mins} min`;
  }

  const h = Math.floor(mins / 60);

  if (h < 24) {
    return `há ${h} h`;
  }

  const days = Math.floor(h / 24);

  if (days === 1) {
    return "ontem";
  }

  if (days < 7) {
    return `há ${days} dias`;
  }

  return `há ${Math.floor(days / 7)} sem`;
}

// Converte cada publicação do Instagram
// em uma notícia do site.
function instagramToArticle(m) {
  const caption = m.caption || "";

  const parts =
    captionParts(caption);

  const cat =
    autoCategory(caption);

  let image = "";

  // Reels/vídeos
  if (m.thumbnail_url) {
    image = m.thumbnail_url;
  }

  // Fotos e carrosséis
  else if (
    m.media_type === "IMAGE" ||
    m.media_type === "CAROUSEL_ALBUM"
  ) {
    image = m.media_url || "";
  }

  return {
    id: m.id,
    cat,

    stamp:
      cat === "urgente",

    title:
      parts.title,

    dek:
      parts.dek,

    time:
      relativeTime(m.timestamp),

    link:
      m.permalink ||
      INSTAGRAM_PROFILE,

    image,

    media_type:
      m.media_type || "",

    timestamp:
      m.timestamp || ""
  };
}

// BUSCA AUTOMÁTICA DO INSTAGRAM
async function loadInstagram() {
  try {
    const res = await fetch(
      `${INSTAGRAM_API_URL}?t=${Date.now()}`,
      {
        cache: "no-store"
      }
    );

    if (!res.ok) {
      throw new Error(
        `Instagram API ${res.status}`
      );
    }

    const json =
      await res.json();

    if (!Array.isArray(json.data)) {
      throw new Error(
        "Resposta da API inválida"
      );
    }

    const fresh =
      json.data
        .map(instagramToArticle)
        .filter(a => a.title);

    if (fresh.length) {
      ARTICLES = fresh;

      normalizeCats();

      ALL_ARTICLES =
        [...ARTICLES];

      render();
    }
  }

  catch (err) {
    console.warn(
      "Instagram automático indisponível.",
      err
    );
  }
}

// MONTA A TELA
function render() {
  const root =
    document.getElementById("app");

  if (!root) {
    return;
  }

  let feed =
    state.tab === "todas"
      ? ARTICLES
      : ARTICLES.filter(
          a => a.cat === state.tab
        );

  if (!feed.length) {
    feed = ARTICLES;
  }

  const hero =
    feed[0] || ARTICLES[0];

  const reels =
    ARTICLES.slice(0, 5);

  const heroBadge =
    hero
      ? (
          CAT_LABELS[hero.cat] ||
          "NOTÍCIA"
        )
      : "NOTÍCIA";

  root.innerHTML = `

  <header class="top">

    <button
      class="circle"
      onclick="document.body.classList.toggle('menu-open')"
      aria-label="Menu"
    >
      ☰
    </button>

    <div class="brand">

      <img
        src="icons/pavv.png"
        alt="@falapavao notícias"
      >

      <small>
        VILA PAVÃO · ES E REGIÃO
      </small>

    </div>

    <button
      class="circle"
      onclick="openSearch()"
      aria-label="Buscar"
    >
      ⌕
    </button>

  </header>


  <div class="breaking">

    <b>
      ⚡ ÚLTIMAS
    </b>

    <div class="marquee">

      <div>

        ${[...ARTICLES, ...ARTICLES]
          .map(
            a => `
              <span>
                ${esc(a.title)}
                <i>●</i>
              </span>
            `
          )
          .join("")}

      </div>

    </div>

  </div>


  <nav class="cats">

    ${CATS.map(
      c => `

      <button
        class="${
          state.tab === c[0]
            ? "active"
            : ""
        }"
        onclick="setTab('${c[0]}')"
      >

        <span>
          ${c[1]}
        </span>

        ${c[2]}

      </button>

      `
    ).join("")}

  </nav>


  <main>


    <section class="hero">

      <div class="hero-img">

        ${newsImage(hero)}

      </div>


      <div class="hero-copy">

        <span class="urgent">

          ${esc(heroBadge)}

        </span>


        <h1>

          ${esc(hero.title)}

        </h1>


        <small>

          ${esc(
            hero.time || "agora"
          )}

        </small>


        <a
          href="${
            esc(
              hero.link ||
              INSTAGRAM_PROFILE
            )
          }"
          target="_blank"
          rel="noopener"
        >

          VER NO INSTAGRAM ◎

        </a>

      </div>

    </section>


    <section class="section">

      <div class="section-head">

        <h2>
          ▣ ÚLTIMAS DO INSTAGRAM
        </h2>

        <a
          href="${INSTAGRAM_PROFILE}"
          target="_blank"
          rel="noopener"
        >

          VER TODOS ›

        </a>

      </div>


      <div class="reels">

        ${reels.map(
          a => `

          <a
            class="reel"
            href="${
              esc(
                a.link ||
                INSTAGRAM_PROFILE
              )
            }"
            target="_blank"
            rel="noopener"
          >

            <div class="reel-img">

              ${newsImage(a)}

              ${
                a.media_type ===
                "VIDEO"

                ? `
                  <b>▶</b>
                  <em>REEL</em>
                `

                : `
                  <em>POST</em>
                `
              }

            </div>


            <strong>

              ${esc(a.title)}

            </strong>


            <small>

              ${esc(
                a.time || ""
              )}

            </small>

          </a>

          `
        ).join("")}

      </div>

    </section>


    <section
      class="boxgame"
      onclick="go(INSTAGRAM_PROFILE)"
    >

      <div class="gift">

        🎁

        <b>?</b>

      </div>


      <h2>

        O QUE TEM

        <br>

        <mark>
          NA CAIXA?
        </mark>

      </h2>


      <div class="gamecopy">

        <p>

          Acerte o que tem dentro da
          caixa e concorra a um prêmio
          especial!

        </p>

        <button>

          PARTICIPAR AGORA

        </button>

      </div>


      <div class="iganswer">

        🎁

        <small>

          Responda somente

          <br>

          no Instagram

        </small>

      </div>

    </section>


    <section class="quick">


      <button
        onclick="go(WHATSAPP_URL)"
      >

        <b class="wa">
          ☎
        </b>

        <span>

          <strong>
            Fale com o Fala Pavão
          </strong>

          <small>
            Clique e fale no WhatsApp
          </small>

        </span>

        <i>›</i>

      </button>


      <button
        onclick="go(WHATSAPP_URL)"
      >

        <b class="cam">
          ▣
        </b>

        <span>

          <strong>
            Envie sua notícia
          </strong>

          <small>
            Mande fotos, vídeos e denúncias
          </small>

        </span>

        <i>›</i>

      </button>


    </section>


    <section
      class="section offers"
    >

      <div class="section-head">

        <h2>
          ◇ OFERTAS DO DIA
        </h2>

        <span>
          VER TODAS ›
        </span>

      </div>


      <div class="offer-grid">


        <button
          onclick="go(MERCADO_LIVRE_URL)"
          class="ml"
        >

          <strong>
            mercado
            <br>
            livre
          </strong>

          <small>
            Ofertas imperdíveis
          </small>

          <b>
            VER OFERTAS
          </b>

        </button>


        <button
          onclick="go(SHOPEE_URL)"
          class="sh"
        >

          <strong>
            ▣ Shopee
          </strong>

          <small>
            Cupons e descontos
          </small>

          <b>
            VER OFERTAS
          </b>

        </button>


        <button
          onclick="go(TIKTOK_SHOP_URL)"
          class="tt"
        >

          <strong>
            ♪ TikTok Shop
          </strong>

          <small>
            Promoções exclusivas
          </small>

          <b>
            VER OFERTAS
          </b>

        </button>


      </div>

    </section>


    <section class="advert">

      <span>
        📣
      </span>

      <h2>
        ANUNCIE AQUI!
      </h2>

      <p>

        Divulgue sua marca no Fala Pavão

        <br>

        Seja visto por milhares de pessoas!

      </p>

      <button
        onclick="go(WHATSAPP_URL)"
      >

        FALE CONOSCO

      </button>

    </section>


  </main>


  <div class="searchbox">

    <input
      id="busca"
      placeholder="Buscar notícia..."
      oninput="searchNews(this.value)"
    >

    <button
      onclick="closeSearch()"
    >
      ×
    </button>

  </div>


  <nav class="bottom">


    <button
      onclick="setTab('todas')"
    >

      ⌂

      <small>
        INÍCIO
      </small>

    </button>


    <button
      onclick="setTab('cidade')"
    >

      ▤

      <small>
        NOTÍCIAS
      </small>

    </button>


    <button
      onclick="document.querySelector('.boxgame')?.scrollIntoView({behavior:'smooth'})"
    >

      🎁

      <small>
        CAIXA
      </small>

    </button>


    <button
      onclick="document.querySelector('.offers')?.scrollIntoView({behavior:'smooth'})"
    >

      ◇

      <small>
        OFERTAS
      </small>

    </button>


    <button
      onclick="go(WHATSAPP_URL)"
    >

      ◉

      <small>
        WHATSAPP
      </small>

    </button>


  </nav>

  `;
}


// ABRIR PESQUISA
function openSearch() {

  document.body.classList.add(
    "searching"
  );

  setTimeout(() => {

    document
      .getElementById("busca")
      ?.focus();

  }, 50);

}


// FECHAR PESQUISA
function closeSearch() {

  document.body.classList.remove(
    "searching"
  );

  ARTICLES =
    [...ALL_ARTICLES];

  render();

}


// PESQUISAR
function searchNews(q) {

  q =
    q.toLowerCase().trim();

  if (!q) {

    ARTICLES =
      [...ALL_ARTICLES];

    render();

    return;

  }

  ARTICLES =
    ALL_ARTICLES.filter(
      a =>
        (
          a.title +
          " " +
          (a.dek || "")
        )
          .toLowerCase()
          .includes(q)
    );

  render();

}


// Mostra a página imediatamente
render();


// Busca o Instagram
loadInstagram();


// Atualiza automaticamente
// a cada 5 minutos.
setInterval(
  loadInstagram,
  5 * 60 * 1000
);


// INSTALAÇÃO COMO APP / PWA
if (
  "serviceWorker" in navigator
) {

  window.addEventListener(
    "load",
    () => {

      navigator
        .serviceWorker
        .register(
          "./service-worker.js"
        )
        .catch(
          err =>
            console.warn(
              "Service Worker:",
              err
            )
        );

    }
  );

}
