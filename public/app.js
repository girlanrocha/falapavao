// Fala Pavão V4 — Instagram + notícias regionais + ofertas/anúncios dinâmicos
const INSTAGRAM_PROFILE = "https://www.instagram.com/falapavao/";
const INSTAGRAM_API_URL = "/api/instagram";
const REGIONAL_API_URL = "/api/regional";
const CONTENT_API_URL = "/api/content";
const WEATHER_API_URL = "/api/weather";

const WHATSAPP_URL = "https://wa.me/5527996455909";

const DEFAULT_CONTENT = {
  topAd: {
    title: "ANUNCIE AQUI",
    text: "Divulgue sua marca no Fala Pavão",
    link: ""
  },
  bottomAd: {
    title: "ANUNCIE AQUI!",
    text: "Divulgue sua marca no Fala Pavão e seja visto por milhares de pessoas.",
    link: ""
  },
  offers: [
    { name:"Mercado Livre", text:"Ofertas imperdíveis", link:"", image:"", cls:"ml" },
    { name:"Shopee", text:"Cupons e descontos", link:"", image:"", cls:"sh" },
    { name:"TikTok Shop", text:"Promoções exclusivas", link:"", image:"", cls:"tt" }
  ]
};

let CONTENT = structuredClone(DEFAULT_CONTENT);
let WEATHER = null;

let ARTICLES = [
  {
    id:"fallback",
    cat:"regiao",
    title:"Últimas notícias do Fala Pavão",
    dek:"Acompanhe as principais notícias no Instagram do Fala Pavão.",
    time:"agora",
    link:INSTAGRAM_PROFILE,
    image:"",
    source:"Fala Pavão",
    media_type:""
  }
];

let REGIONAL = [];
let FEATURES = [];
let featureIndex = 0;
let featureTimer = null;

const CATS = [
  ["todas","⌂","TODAS"],
  ["urgente","🚨","URGENTE"],
  ["cidade","📍","CIDADE"],
  ["regiao","🌐","REGIÃO"],
  ["policia","🛡","POLÍCIA"],
  ["cultura","♫","CULTURA"],
  ["esporte","⚽","ESPORTE"]
];

const CAT_LABELS = {
  urgente:"URGENTE ⚡",
  cidade:"VILA PAVÃO",
  regiao:"REGIÃO",
  policia:"POLÍCIA",
  cultura:"CULTURA",
  esporte:"ESPORTE"
};

let state = { tab:"todas" };
let ALL_ARTICLES = [...ARTICLES];

function esc(s=""){
  return String(s).replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}
function go(url){ if(url) window.open(url,"_blank","noopener"); }
function setTab(id){ state.tab=id; render(); }

function autoCategory(caption=""){
  const t=caption.toLowerCase();
  if(/acidente|morre|morte|óbito|obito|homicídio|homicidio|assalto|tiroteio|ferido|ferida|vítima|vitima|chuva forte|temporal|alagamento|enchente|deslizamento|incêndio|incendio|urgente/.test(t)) return "urgente";
  if(/polícia|policia|delegacia|operação policial|operacao policial|prisão|prisao|preso|presa|pc-es|pm-es/.test(t)) return "policia";
  if(/pomitafro|cultura|pomeran|festa|evento|show|música|musica|festival|gastronomia/.test(t)) return "cultura";
  if(/futebol|esporte|campeonato|jogo|gol|partida/.test(t)) return "esporte";
  if(/vila pavão|vila pavao/.test(t)) return "cidade";
  return "regiao";
}

function captionParts(caption=""){
  const clean=caption.replace(/\s*#[\wÀ-ú]+/g," ").replace(/\s+/g," ").trim();
  const cut=clean.search(/[.!?\n]/);
  let title=cut>15 ? clean.slice(0,cut+1) : clean.slice(0,105);
  let dek=cut>15 ? clean.slice(cut+1).trim() : "";
  title=title.replace(/[.!?]$/,"").trim();
  if(title.length>105) title=title.slice(0,102).trim()+"…";
  if(!title) title="Nova publicação do Fala Pavão";
  if(!dek) dek="Confira todos os detalhes na publicação original.";
  if(dek.length>180) dek=dek.slice(0,177).trim()+"…";
  return {title,dek};
}

function relativeTime(iso){
  const d=new Date(iso);
  if(Number.isNaN(d.getTime())) return "agora";
  const mins=Math.max(1,Math.floor((Date.now()-d.getTime())/60000));
  if(mins<60) return `há ${mins} min`;
  const h=Math.floor(mins/60);
  if(h<24) return `há ${h} h`;
  const days=Math.floor(h/24);
  if(days===1) return "ontem";
  if(days<7) return `há ${days} dias`;
  return `há ${Math.floor(days/7)} sem`;
}

function instagramToArticle(m){
  const caption=m.caption||"";
  const parts=captionParts(caption);
  const cat=autoCategory(caption);
  let image="";
  if(m.thumbnail_url) image=m.thumbnail_url;
  else if(m.media_type==="IMAGE" || m.media_type==="CAROUSEL_ALBUM") image=m.media_url||"";
  return {
    id:m.id,
    cat,
    title:parts.title,
    dek:parts.dek,
    time:relativeTime(m.timestamp),
    link:m.permalink||INSTAGRAM_PROFILE,
    image,
    media_type:m.media_type||"",
    source:"Fala Pavão",
    timestamp:m.timestamp||""
  };
}

function regionalToFeature(r){
  return {
    id:"regional-"+(r.link||r.title),
    cat:"regiao",
    title:r.title||"Notícia regional",
    dek:r.description||"Confira a notícia completa na fonte.",
    time:relativeTime(r.pubDate||""),
    link:r.link||"",
    image:r.image||"",
    media_type:"",
    source:r.source||"Notícias regionais"
  };
}

function newsImage(a){
  if(a?.image) return `<img src="${esc(a.image)}" alt="${esc(a.title||"Notícia")}" loading="lazy">`;
  return `<div class="photo-fallback"><img src="icons/pavv.png" alt="Fala Pavão"></div>`;
}

function rebuildFeatures(){
  const local = ARTICLES.slice(0,3);
  const regional = REGIONAL.slice(0,3).map(regionalToFeature);
  FEATURES=[];
  const max=Math.max(local.length,regional.length);
  for(let i=0;i<max;i++){
    if(local[i]) FEATURES.push(local[i]);
    if(regional[i]) FEATURES.push(regional[i]);
  }
  if(!FEATURES.length) FEATURES=[...ARTICLES];
  featureIndex = featureIndex % FEATURES.length;
}

function currentFeature(){
  if(!FEATURES.length) rebuildFeatures();
  return FEATURES[featureIndex] || ARTICLES[0];
}

function startFeatureRotation(){
  if(featureTimer) clearInterval(featureTimer);
  featureTimer=setInterval(()=>{
    if(FEATURES.length>1){
      featureIndex=(featureIndex+1)%FEATURES.length;
      renderHeroOnly();
    }
  },8000);
}

function renderHeroOnly(){
  const host=document.getElementById("hero-slot");
  if(!host) return;
  host.innerHTML=heroHtml(currentFeature());
}

function heroHtml(hero){
  const badge = hero.source==="Fala Pavão"
    ? (CAT_LABELS[hero.cat]||"NOTÍCIA")
    : "REGIONAL 🌐";
  const source = hero.source || "Fala Pavão";
  return `
    <section class="hero compact" onclick="go('${esc(hero.link||INSTAGRAM_PROFILE)}')">
      <div class="hero-img">${newsImage(hero)}</div>
      <div class="hero-copy">
        <span class="urgent">${esc(badge)}</span>
        <h1>${esc(hero.title)}</h1>
        <small>${esc(hero.time||"agora")} · ${esc(source)}</small>
        <span class="hero-open">ABRIR NOTÍCIA ›</span>
      </div>
    </section>
    <div class="hero-dots">
      ${FEATURES.map((_,i)=>`<button class="${i===featureIndex?"active":""}" onclick="event.stopPropagation();featureIndex=${i};renderHeroOnly()"></button>`).join("")}
    </div>`;
}

function offerHtml(o){
  const cls=o.cls||"ml";
  const photo=o.image ? `<img class="offer-photo" src="${esc(o.image)}" alt="${esc(o.name||"Produto")}" loading="lazy">` : "";
  return `<button class="${esc(cls)} ${o.image?"has-photo":""}" onclick="go('${esc(o.link||"")}')">
    ${photo}
    <strong>${esc(o.name||"Oferta")}</strong>
    <small>${esc(o.text||"Confira")}</small>
    <b>VER OFERTA</b>
  </button>`;
}

function weatherIcon(code=0,isDay=1){
  if(code===0) return isDay ? "☀️" : "🌙";
  if(code<=3) return "⛅";
  if(code===45 || code===48) return "🌫️";
  if(code>=51 && code<=67) return "🌧️";
  if(code>=71 && code<=77) return "❄️";
  if(code>=80 && code<=82) return "🌦️";
  if(code>=95) return "⛈️";
  return "🌤️";
}

function weatherLabel(code=0){
  if(code===0) return "Céu limpo";
  if(code===1) return "Predominantemente limpo";
  if(code===2) return "Parcialmente nublado";
  if(code===3) return "Nublado";
  if(code===45 || code===48) return "Neblina";
  if(code>=51 && code<=57) return "Garoa";
  if(code>=61 && code<=67) return "Chuva";
  if(code>=71 && code<=77) return "Neve";
  if(code>=80 && code<=82) return "Pancadas de chuva";
  if(code>=95) return "Trovoadas";
  return "Tempo variável";
}

function shortDay(iso=""){
  const d=new Date(`${iso}T12:00:00`);
  if(Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR",{weekday:"short"}).format(d).replace(".","");
}

function weatherHtml(){
  if(!WEATHER){
    return `<section class="weather-card weather-loading" aria-live="polite">
      <span class="weather-main-icon">🌤️</span>
      <div><strong>Tempo em Vila Pavão</strong><small>Carregando previsão...</small></div>
    </section>`;
  }
  const current=WEATHER.current||{};
  const days=(WEATHER.daily||[]).slice(0,3);
  return `<section class="weather-card" aria-label="Previsão do tempo para Vila Pavão">
    <div class="weather-now">
      <span class="weather-main-icon">${weatherIcon(current.code,current.isDay)}</span>
      <div class="weather-place"><strong>Tempo em Vila Pavão</strong><small>${weatherLabel(current.code)}</small></div>
      <b class="weather-temp">${Math.round(Number(current.temperature)||0)}°</b>
      <div class="weather-details"><span>💧 ${Math.round(Number(current.humidity)||0)}%</span><span>💨 ${Math.round(Number(current.wind)||0)} km/h</span></div>
    </div>
    <div class="weather-days">
      ${days.map(d=>`<div><strong>${shortDay(d.date)}</strong><span>${weatherIcon(d.code,1)}</span><small>${Math.round(Number(d.min)||0)}° / <b>${Math.round(Number(d.max)||0)}°</b></small><em>Chuva ${Math.round(Number(d.rainChance)||0)}%</em></div>`).join("")}
    </div>
    <small class="weather-source">Previsão automática · Atualizada periodicamente</small>
  </section>`;
}

function render(){
  const root=document.getElementById("app");
  if(!root) return;

  const reels=ARTICLES.slice(0,5);
  const topAd=CONTENT.topAd||DEFAULT_CONTENT.topAd;
  const bottomAd=CONTENT.bottomAd||DEFAULT_CONTENT.bottomAd;
  const offers=(CONTENT.offers?.length?CONTENT.offers:DEFAULT_CONTENT.offers).slice(0,3);

  root.innerHTML=`
    <header class="top">
      <button class="circle" onclick="document.body.classList.toggle('menu-open')" aria-label="Menu">☰</button>
      <div class="brand">
        <img src="icons/pavv.png" alt="@falapavao notícias">
        <small>VILA PAVÃO · ES E REGIÃO</small>
      </div>
      <button class="circle" onclick="openSearch()" aria-label="Buscar">⌕</button>
    </header>

    <section class="top-ad" onclick="go('${esc(topAd.link||WHATSAPP_URL)}')">
      <span>📣</span>
      <div><strong>${esc(topAd.title||"ANUNCIE AQUI")}</strong><small>${esc(topAd.text||"Divulgue sua marca")}</small></div>
      <b>ANUNCIAR</b>
    </section>

    <div class="breaking">
      <b>⚡ ÚLTIMAS</b>
      <div class="marquee"><div>
        ${[...ARTICLES,...REGIONAL.map(regionalToFeature),...ARTICLES].map(a=>`<span>${esc(a.title)} <i>●</i></span>`).join("")}
      </div></div>
    </div>

    <nav class="cats">
      ${CATS.map(c=>`<button class="${state.tab===c[0]?"active":""}" onclick="setTab('${c[0]}')"><span>${c[1]}</span>${c[2]}</button>`).join("")}
    </nav>

    <main>
      <div id="weather-slot">${weatherHtml()}</div>

      <section class="section offers top-offers">
        <div class="section-head"><h2>◇ OFERTAS DO DIA</h2></div>
        <div class="offer-grid">${offers.map(offerHtml).join("")}</div>
      </section>

      <div id="hero-slot">${heroHtml(currentFeature())}</div>

      <section class="section">
        <div class="section-head"><h2>▣ ÚLTIMAS DO INSTAGRAM</h2><a href="${INSTAGRAM_PROFILE}" target="_blank">VER TODOS ›</a></div>
        <div class="reels">
          ${reels.map(a=>`<a class="reel" href="${esc(a.link||INSTAGRAM_PROFILE)}" target="_blank" rel="noopener">
            <div class="reel-img">${newsImage(a)}${a.media_type==="VIDEO"?"<b>▶</b><em>REEL</em>":"<em>POST</em>"}</div>
            <strong>${esc(a.title)}</strong><small>${esc(a.time||"")}</small>
          </a>`).join("")}
        </div>
      </section>

      <section class="boxgame" onclick="go(INSTAGRAM_PROFILE)">
        <div class="gift">🎁<b>?</b></div>
        <h2>O QUE TEM<br><mark>NA CAIXA?</mark></h2>
        <div class="gamecopy"><p>Acerte o que tem dentro da caixa e concorra a um prêmio especial!</p><button>PARTICIPAR AGORA</button></div>
        <div class="iganswer">🎁<small>Responda somente<br>no Instagram</small></div>
      </section>

      <section class="quick">
        <button onclick="go(WHATSAPP_URL)"><b class="wa">☎</b><span><strong>Fale com o Fala Pavão</strong><small>Clique e fale no WhatsApp</small></span><i>›</i></button>
        <button onclick="go(WHATSAPP_URL)"><b class="cam">▣</b><span><strong>Envie sua notícia</strong><small>Mande fotos, vídeos e denúncias</small></span><i>›</i></button>
      </section>

      <section class="advert" onclick="go('${esc(bottomAd.link||WHATSAPP_URL)}')">
        <span>📣</span>
        <h2>${esc(bottomAd.title||"ANUNCIE AQUI!")}</h2>
        <p>${esc(bottomAd.text||"Divulgue sua marca no Fala Pavão")}</p>
        <button>FALE CONOSCO</button>
      </section>
    </main>

    <div class="searchbox">
      <input id="busca" placeholder="Buscar notícia..." oninput="searchNews(this.value)">
      <button onclick="closeSearch()">×</button>
    </div>

    <nav class="bottom">
      <button onclick="setTab('todas')">⌂<small>INÍCIO</small></button>
      <button onclick="document.querySelector('.section:nth-of-type(2)')?.scrollIntoView({behavior:'smooth'})">▤<small>NOTÍCIAS</small></button>
      <button onclick="document.querySelector('.boxgame')?.scrollIntoView({behavior:'smooth'})">🎁<small>CAIXA</small></button>
      <button onclick="document.querySelector('.offers')?.scrollIntoView({behavior:'smooth'})">◇<small>OFERTAS</small></button>
      <button onclick="go(WHATSAPP_URL)">◉<small>WHATSAPP</small></button>
    </nav>`;
}

function openSearch(){
  document.body.classList.add("searching");
  setTimeout(()=>document.getElementById("busca")?.focus(),50);
}
function closeSearch(){
  document.body.classList.remove("searching");
  ARTICLES=[...ALL_ARTICLES];
  rebuildFeatures();
  render();
}
function searchNews(q){
  q=q.toLowerCase().trim();
  if(!q){ ARTICLES=[...ALL_ARTICLES]; rebuildFeatures(); render(); return; }
  ARTICLES=ALL_ARTICLES.filter(a=>(a.title+" "+(a.dek||"")).toLowerCase().includes(q));
  rebuildFeatures();
  render();
}

async function loadInstagram(){
  try{
    const res=await fetch(`${INSTAGRAM_API_URL}?t=${Date.now()}`,{cache:"no-store"});
    if(!res.ok) throw new Error(`Instagram API ${res.status}`);
    const json=await res.json();
    const fresh=(json.data||[]).map(instagramToArticle).filter(a=>a.title);
    if(fresh.length){
      ARTICLES=fresh;
      ALL_ARTICLES=[...fresh];
      rebuildFeatures();
      render();
    }
  }catch(e){ console.warn("Instagram indisponível",e); }
}

async function loadRegional(){
  try{
    const res=await fetch(`${REGIONAL_API_URL}?t=${Date.now()}`,{cache:"no-store"});
    if(!res.ok) throw new Error(`Regional API ${res.status}`);
    const json=await res.json();
    REGIONAL=Array.isArray(json.data)?json.data:[];
    rebuildFeatures();
    render();
  }catch(e){ console.warn("Notícias regionais indisponíveis",e); }
}

async function loadContent(){
  try{
    const res=await fetch(`${CONTENT_API_URL}?t=${Date.now()}`,{cache:"no-store"});
    if(res.ok){
      const json=await res.json();
      if(json && typeof json==="object") CONTENT={...DEFAULT_CONTENT,...json};
      render();
    }
  }catch(e){ console.warn("Conteúdo administrativo indisponível",e); }
}

async function loadWeather(){
  try{
    const res=await fetch(`${WEATHER_API_URL}?t=${Date.now()}`,{cache:"no-store"});
    if(!res.ok) throw new Error(`Weather API ${res.status}`);
    WEATHER=await res.json();
    const slot=document.getElementById("weather-slot");
    if(slot) slot.innerHTML=weatherHtml();
  }catch(e){
    console.warn("Previsão do tempo indisponível",e);
    const slot=document.getElementById("weather-slot");
    if(slot) slot.innerHTML=`<section class="weather-card weather-loading"><span class="weather-main-icon">🌤️</span><div><strong>Tempo em Vila Pavão</strong><small>Previsão temporariamente indisponível</small></div></section>`;
  }
}

render();
Promise.allSettled([loadInstagram(),loadRegional(),loadContent(),loadWeather()]).then(()=>{
  rebuildFeatures();
  render();
  startFeatureRotation();
});
setInterval(loadInstagram,5*60*1000);
setInterval(loadRegional,10*60*1000);
setInterval(loadContent,5*60*1000);
setInterval(loadWeather,15*60*1000);

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
}


// Instalação PWA no Android/Chrome
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  const banner = document.getElementById("install-banner");
  if (banner) banner.style.display = "flex";
});
window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  const banner = document.getElementById("install-banner");
  if (banner) banner.style.display = "none";
});
function installApp(){
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.finally(()=>{
    deferredPrompt=null;
    const banner=document.getElementById("install-banner");
    if(banner) banner.style.display="none";
  });
}
function dismissInstall(){
  const banner=document.getElementById("install-banner");
  if(banner) banner.style.display="none";
}


// =========================
// ESTATÍSTICAS COM GPS OPCIONAL
// =========================
// Conta no máximo uma visita a cada 30 minutos neste navegador.
// Se a pessoa autorizar localização, usa GPS para melhorar a cidade.
// Se recusar, o Worker usa a localização aproximada do IP.
async function registrarAcesso(){
  try{
    const key="fp_last_visit";
    const last=Number(localStorage.getItem(key)||0);
    if(Date.now()-last < 30*60*1000) return;

    let coords=null;

    if("geolocation" in navigator){
      coords=await new Promise(resolve=>{
        navigator.geolocation.getCurrentPosition(
          pos=>resolve({
            lat:pos.coords.latitude,
            lon:pos.coords.longitude
          }),
          ()=>resolve(null),
          {
            enableHighAccuracy:true,
            timeout:6000,
            maximumAge:5*60*1000
          }
        );
      });
    }

    const r=await fetch("/api/analytics/view",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(coords||{})
    });

    if(r.ok) localStorage.setItem(key,String(Date.now()));
  }catch(e){
    console.warn("Estatísticas:",e);
  }
}

window.addEventListener("load", registrarAcesso);
