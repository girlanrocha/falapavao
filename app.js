// Fala Pavão V3 — mobile-first
const INSTAGRAM_PROFILE = "https://www.instagram.com/falapavao/";
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

if ("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
