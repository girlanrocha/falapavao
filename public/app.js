// Fala Pavão V3 — mobile-first
const INSTAGRAM_PROFILE = "https://www.instagram.com/falapavao/";
const INSTAGRAM_API_URL = "/api/instagram";
const WHATSAPP_URL = ""; // cole aqui: https://wa.me/55DDDNUMERO
const MERCADO_LIVRE_URL = "";
const SHOPEE_URL = "";
const TIKTOK_SHOP_URL = "";

let ARTICLES = [
  {id:"1",cat:"urgente",title:"PM morre baleado durante ocorrência em Cachoeiro de Itapemirim",dek:"Confira os detalhes completos na publicação do Fala Pavão.",time:"há 12 h",link:"https://www.instagram.com/reel/DcFD0TIRyPN/"},
  {id:"2",cat:"urgente",title:"Temporal com granizo causa estragos em Ibituba, zona rural de Baixo Guandu",dek:"Chuva forte veio acompanhada de rajadas de vento no Noroeste do ES.",time:"há 23 h",link:"https://www.instagram.com/reel/DcD7DKVtDct/"},
  {id:"3",cat:"policia",title:"Briga entre mulheres termina em tentativa de homicídio em Boa Esperança",dek:"Veja as informações publicadas pelo Fala Pavão no Instagram.",time:"ontem",link:"https://www.instagram.com/reel/DcBa1R1NXZT/"},
  {id:"4",cat:"regiao",title:"Dois jovens morrem em batida de moto contra caminhão na BR-259",dek:"Acidente aconteceu em Mascarenhas, zona rural de Baixo Guandu.",time:"há 5 dias",link:"https://www.instagram.com/reel/Db4-3wyNQyI/"},
  {id:"5",cat:"cidade",title:"Ventos fortes derrubam árvores em estradas rurais de Vila Pavão",dek:"Atenção redobrada para quem trafega pelas vias rurais.",time:"há 6 dias",link:"https://www.instagram.com/reel/Db2wBXJt13R/"},
  {id:"6",cat:"cultura",title:"27ª Pomitafro movimenta Vila Pavão com cultura e gastronomia",dek:"Tradições pomerana, italiana e afro-brasileira em destaque.",time:"há 1 sem",link:"https://www.instagram.com/falapavao/"}
];

const CATS = [
  ["todas","⌂","TODAS"],["urgente","🚨","URGENTE"],["cidade","📍","CIDADE"],
  ["regiao","🌐","REGIÃO"],["policia","🛡","POLÍCIA"],["cultura","♫","CULTURA"],["esporte","⚽","ESPORTE"]
];
let state={tab:"todas"};

function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function setTab(id){state.tab=id;render();}
function go(url){ if(url) window.open(url,"_blank","noopener"); }

function normalizeCats(){
  ARTICLES=ARTICLES.map((a,i)=>{
    let cat=a.cat||"cidade";
    if(cat==="pomitafro") cat="cultura";
    return {...a,cat, image:a.image||""};
  });
}
normalizeCats();

function newsImage(a,i){
  if(a.image) return `<img src="${esc(a.image)}" alt="">`;
  return `<div class="photo-fallback"><img src="icons/pavv.png" alt="Fala Pavão"></div>`;
}


function autoCategory(caption=""){
  const t=caption.toLowerCase();
  if(/acidente|morre|morte|preso|prisão|polícia|crime|assalto|homicídio|urgente|ferido|vítima|chuva forte|temporal|alagamento/.test(t)) return "urgente";
  if(/polícia|delegacia|operação policial|pc-es|pm-es/.test(t)) return "policia";
  if(/pomitafro|cultura|pomeran|festa|evento|show|música/.test(t)) return "cultura";
  if(/futebol|esporte|campeonato|jogo|gol/.test(t)) return "esporte";
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
  if(!dek) dek="Confira todos os detalhes no Instagram do Fala Pavão.";
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
  const image =
    m.thumbnail_url ||
    ((m.media_type==="IMAGE" || m.media_type==="CAROUSEL_ALBUM") ? (m.media_url||"") : "");
  const cat=autoCategory(caption);
  return {
    id:m.id,
    cat,
    stamp:cat==="urgente",
    title:parts.title,
    dek:parts.dek,
    time:relativeTime(m.timestamp),
    reads:"",
    link:m.permalink||INSTAGRAM_PROFILE,
    image,
    media_type:m.media_type||""
  };
}

async function loadInstagram(){
  try{
    const res=await fetch(INSTAGRAM_API_URL,{cache:"no-store"});
    if(!res.ok) throw new Error(`Instagram API ${res.status}`);
    const json=await res.json();
    const fresh=(json.data||[]).map(instagramToArticle).filter(a=>a.title);
    if(fresh.length){
      ARTICLES=fresh;
      normalizeCats();
      render();
    }
  }catch(err){
    console.warn("Instagram automático indisponível; usando notícias locais.",err);
  }
}

function render(){
 const root=document.getElementById("app");
 let feed=state.tab==="todas"?ARTICLES:ARTICLES.filter(a=>a.cat===state.tab);
 if(!feed.length) feed=ARTICLES;
 const hero=feed[0]||ARTICLES[0];
 const reels=ARTICLES.slice(0,5);
 root.innerHTML=`
 <header class="top">
   <button class="circle" onclick="document.body.classList.toggle('menu-open')" aria-label="Menu">☰</button>
   <div class="brand"><img src="icons/pavv.png" alt="@falapavao notícias"><small>VILA PAVÃO · ES E REGIÃO</small></div>
   <button class="circle" onclick="document.getElementById('busca').focus()" aria-label="Buscar">⌕</button>
 </header>

 <div class="breaking"><b>⚡ ÚLTIMAS</b><div class="marquee"><div>${[...ARTICLES,...ARTICLES].map(a=>`<span>URGENTE: ${esc(a.title)} <i>●</i></span>`).join("")}</div></div></div>

 <nav class="cats">${CATS.map(c=>`<button class="${state.tab===c[0]?"active":""}" onclick="setTab('${c[0]}')"><span>${c[1]}</span>${c[2]}</button>`).join("")}</nav>

 <main>
   <section class="hero">
      <div class="hero-img">${newsImage(hero,0)}</div>
      <div class="hero-copy"><span class="urgent">URGENTE ⚡</span><h1>${esc(hero.title)}</h1><small>${esc(hero.time||"Agora")}</small>
      <a href="${esc(hero.link||INSTAGRAM_PROFILE)}" target="_blank" rel="noopener">VER NO INSTAGRAM ◎</a></div>
   </section>

   <section class="section">
     <div class="section-head"><h2>▣ ÚLTIMAS DO INSTAGRAM</h2><a href="${INSTAGRAM_PROFILE}" target="_blank">VER TODOS ›</a></div>
     <div class="reels">${reels.map((a,i)=>`<a class="reel" href="${esc(a.link||INSTAGRAM_PROFILE)}" target="_blank"><div class="reel-img">${newsImage(a,i)}<b>▶</b><em>${["0:29","0:45","0:32","0:28","0:31"][i]}</em></div><strong>${esc(a.title)}</strong><small>${esc(a.time||"")}</small></a>`).join("")}</div>
   </section>

   <section class="boxgame" onclick="go(INSTAGRAM_PROFILE)">
      <div class="gift">🎁<b>?</b></div><h2>O QUE TEM<br><mark>NA CAIXA?</mark></h2>
      <div class="gamecopy"><p>Acerte o que tem dentro da caixa e concorra a um prêmio especial!</p><button>PARTICIPAR AGORA</button></div>
      <div class="iganswer">🎁<small>Responda somente<br>no Instagram</small></div>
   </section>

   <section class="quick">
     <button onclick="go(WHATSAPP_URL)"><b class="wa">☎</b><span><strong>Fale com o Fala Pavão</strong><small>Clique e fale no WhatsApp</small></span><i>›</i></button>
     <button onclick="go(WHATSAPP_URL)"><b class="cam">▣</b><span><strong>Envie sua notícia</strong><small>Mande fotos, vídeos e denúncias</small></span><i>›</i></button>
   </section>

   <section class="section offers">
    <div class="section-head"><h2>◇ OFERTAS DO DIA</h2><span>VER TODAS ›</span></div>
    <div class="offer-grid">
      <button onclick="go(MERCADO_LIVRE_URL)" class="ml"><strong>mercado<br>livre</strong><small>Ofertas imperdíveis</small><b>VER OFERTAS</b></button>
      <button onclick="go(SHOPEE_URL)" class="sh"><strong>▣ Shopee</strong><small>Cupons e descontos</small><b>VER OFERTAS</b></button>
      <button onclick="go(TIKTOK_SHOP_URL)" class="tt"><strong>♪ TikTok Shop</strong><small>Promoções exclusivas</small><b>VER OFERTAS</b></button>
    </div>
   </section>

   <section class="advert"><span>📣</span><h2>ANUNCIE AQUI!</h2><p>Divulgue sua marca no Fala Pavão<br>Seja visto por milhares de pessoas!</p><button onclick="go(WHATSAPP_URL)">FALE CONOSCO</button></section>
 </main>

 <div class="searchbox"><input id="busca" placeholder="Buscar notícia..." oninput="searchNews(this.value)"><button onclick="document.body.classList.remove('searching')">×</button></div>

 <nav class="bottom">
  <button onclick="setTab('todas')">⌂<small>INÍCIO</small></button>
  <button onclick="setTab('cidade')">▤<small>NOTÍCIAS</small></button>
  <button onclick="document.querySelector('.boxgame').scrollIntoView({behavior:'smooth'})">🎁<small>CAIXA</small></button>
  <button onclick="document.querySelector('.offers').scrollIntoView({behavior:'smooth'})">◇<small>OFERTAS</small></button>
  <button onclick="go(WHATSAPP_URL)">◉<small>WHATSAPP</small></button>
 </nav>`;
}

function searchNews(q){
 document.body.classList.add("searching");
 q=q.toLowerCase().trim();
 if(!q){render();return}
 const old=ARTICLES; ARTICLES=old.filter(a=>(a.title+" "+(a.dek||"")).toLowerCase().includes(q)); render(); ARTICLES=old;
}
render();
loadInstagram();
setInterval(loadInstagram, 5 * 60 * 1000);

if ("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
