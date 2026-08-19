// ===== CONFIGURAÇÃO FALA PAVÃO =====
// Quando criarmos a API oficial do Instagram na Cloudflare, cole aqui a URL do Worker.
// O Worker deve retornar: { data: [{id, caption, permalink, timestamp, media_url, thumbnail_url, media_type}] }
const INSTAGRAM_API_URL = "";

// Troque pelos seus links quando quiser ativar cada botão.
const LINKS = {
  instagram: "https://www.instagram.com/falapavao/",
  whatsapp: "", // exemplo: https://wa.me/55DDDNUMERO?text=Olá%20Fala%20Pavão
  enviarNoticia: "", // pode ser o mesmo WhatsApp com outra mensagem
  mercadoLivre: "",
  shopee: "",
  tiktok: "",
  anunciar: "" // WhatsApp para anunciantes
};

const CATS = [
  {id:"todas",label:"Todas",icon:"⌂"},{id:"urgente",label:"Urgente",icon:"🚨"},{id:"cidade",label:"Cidade",icon:"📍"},{id:"regiao",label:"Região",icon:"🌐"},{id:"policia",label:"Polícia",icon:"🛡"},{id:"cultura",label:"Cultura",icon:"♫"},{id:"esporte",label:"Esporte",icon:"⚽"}
];

let ARTICLES = [
  {id:"1",cat:"urgente",title:"PM morre baleado durante ocorrência em Cachoeiro de Itapemirim",dek:"Confira os detalhes completos na publicação do Fala Pavão.",time:"há 12 h",link:"https://www.instagram.com/reel/DcFD0TIRyPN/"},
  {id:"2",cat:"urgente",title:"Temporal com granizo causa estragos em Ibituba, zona rural de Baixo Guandu",dek:"Chuva forte veio acompanhada de rajadas de vento no Noroeste do ES.",time:"há 23 h",link:"https://www.instagram.com/reel/DcD7DKVtDct/"},
  {id:"3",cat:"policia",title:"Briga entre mulheres termina em tentativa de homicídio em Boa Esperança",dek:"Veja as informações publicadas pelo Fala Pavão no Instagram.",time:"ontem",link:"https://www.instagram.com/reel/DcBa1R1NXZT/"},
  {id:"4",cat:"regiao",title:"Dois jovens morrem em batida de moto contra caminhão na BR-259",dek:"Acidente aconteceu em Mascarenhas, zona rural de Baixo Guandu.",time:"há 5 dias",link:"https://www.instagram.com/reel/Db4-3wyNQyI/"},
  {id:"5",cat:"cidade",title:"Ventos fortes derrubam árvores em estradas rurais de Vila Pavão",dek:"Atenção redobrada para quem trafega pelas vias rurais.",time:"há 6 dias",link:"https://www.instagram.com/reel/Db2wBXJt13R/"},
  {id:"6",cat:"cultura",title:"27ª Pomitafro movimenta Vila Pavão com cultura e gastronomia",dek:"Tradições pomerana, italiana e afro-brasileira em destaque.",time:"há 1 sem",link:"https://www.instagram.com/falapavao/"}
];
let activeCat="todas";

function safeLink(url,fallback=LINKS.instagram){return url&&url.trim()?url:fallback}
function escapeHtml(s=""){return s.replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]))}
function splitCaption(caption=""){const clean=caption.replace(/\s*#[\wÀ-ú]+/g,"").trim();const cut=clean.search(/[.!?\n]/);let title=cut>0?clean.slice(0,cut+1):clean.slice(0,100);let dek=cut>0?clean.slice(cut+1).trim():"";title=title.replace(/[.!?]$/,"").trim();if(title.length>105)title=title.slice(0,102)+"…";if(!dek)dek="Confira os detalhes completos no Instagram do Fala Pavão.";if(dek.length>180)dek=dek.slice(0,177)+"…";return{title,dek}}
function relativeTime(iso){const d=new Date(iso);if(isNaN(d))return"agora";const m=Math.max(1,Math.floor((Date.now()-d)/60000));if(m<60)return`há ${m} min`;const h=Math.floor(m/60);if(h<24)return`há ${h} h`;const days=Math.floor(h/24);if(days===1)return"ontem";if(days<7)return`há ${days} dias`;return`há ${Math.floor(days/7)} sem`}
function categorize(text=""){const t=text.toLowerCase();if(["urgente","acidente","morre","morte","ferido","temporal","alerta","resgate"].some(k=>t.includes(k)))return"urgente";if(["polícia","policia","preso","prisão","crime","assalto","operação"].some(k=>t.includes(k)))return"policia";if(["pomitafro","cultura","pomeran","festa","show","evento"].some(k=>t.includes(k)))return"cultura";if(["vila pavão","vila pavao"].some(k=>t.includes(k)))return"cidade";return"regiao"}
function normalizeMedia(m){const caption=m.caption||"";const {title,dek}=splitCaption(caption);return{id:String(m.id||Math.random()),cat:categorize(caption),title,dek,time:relativeTime(m.timestamp),link:m.permalink||LINKS.instagram,image:m.thumbnail_url||m.media_url||""}}

function newsCard(a){return `<article class="news-card ${a.cat==='urgente'?'urgent':''}"><div class="news-top"><span class="tag">${a.cat==='urgente'?'⚡ URGENTE':a.cat.toUpperCase()}</span><span class="time">${escapeHtml(a.time)}</span></div><h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.dek)}</p><a href="${safeLink(a.link)}" target="_blank" rel="noopener">Ver no Instagram →</a></article>`}
function reelCard(a){return `<a class="reel" href="${safeLink(a.link)}" target="_blank" rel="noopener"><div class="reel-media">${a.image?`<img src="${a.image}" alt="">`:`<span style="font-size:42px">🦚</span>`}<span class="play">▶</span></div><div class="reel-copy"><strong>${escapeHtml(a.title)}</strong><small>${escapeHtml(a.time)}</small></div></a>`}
function render(){const root=document.getElementById("app");const filtered=activeCat==='todas'?ARTICLES:ARTICLES.filter(a=>a.cat===activeCat);const hero=filtered[0]||ARTICLES[0];const rest=filtered.slice(hero?1:0);root.innerHTML=`<div class="app">
<header class="header"><button class="round" aria-label="Menu">☰</button><div class="brand"><img src="icons/pavv.png" alt="@falapavao notícias"></div><button class="round" aria-label="Buscar">⌕</button></header>
<div class="ticker"><div class="ticker-label">⚡ ÚLTIMAS</div><div class="ticker-window"><div class="ticker-track">${[...ARTICLES,...ARTICLES].map(a=>`<span><b>●</b>${escapeHtml(a.title)}</span>`).join('')}</div></div></div>
<nav class="categories">${CATS.map(c=>`<button class="chip ${activeCat===c.id?'active':''}" onclick="setCategory('${c.id}')">${c.icon} ${c.label.toUpperCase()}</button>`).join('')}</nav>
${hero?`<section class="hero"><div class="hero-media">${hero.image?`<img src="${hero.image}" alt="">`:`<div class="hero-placeholder">🦚</div>`}</div><div class="hero-copy"><span class="badge">${hero.cat==='urgente'?'URGENTE ⚡':'DESTAQUE'}</span><h1>${escapeHtml(hero.title)}</h1><p>${escapeHtml(hero.time)}</p><a class="outline-btn" href="${safeLink(hero.link)}" target="_blank" rel="noopener">VER NO INSTAGRAM ◎</a></div></section>`:''}
<section class="section"><div class="section-head"><h2>📷 ÚLTIMAS DO INSTAGRAM</h2><a href="${LINKS.instagram}" target="_blank">VER TODOS ›</a></div><div class="reels">${ARTICLES.slice(0,8).map(reelCard).join('')}</div></section>
<section class="challenge"><div class="box-icon">🎁</div><div><h2>O QUE TEM NA CAIXA?</h2><p>Acerte o que tem dentro da caixa e concorra ao prêmio da rodada!</p></div><div class="challenge-actions"><a class="cta" href="${LINKS.instagram}" target="_blank" rel="noopener">PARTICIPAR AGORA</a><small>Respostas somente no Instagram</small></div></section>
<section class="quick"><a class="quick-card whats" href="${safeLink(LINKS.whatsapp)}" target="_blank"><span class="quick-icon">💬</span><div><strong>Fale com o Fala Pavão</strong><span>Clique e fale no WhatsApp</span></div></a><a class="quick-card tip" href="${safeLink(LINKS.enviarNoticia)}" target="_blank"><span class="quick-icon">📷</span><div><strong>Envie sua notícia</strong><span>Mande fotos, vídeos e informações</span></div></a></section>
<section class="section"><div class="section-head"><h2>🏷 OFERTAS DO DIA</h2><span></span></div><div class="offers"><div class="offer"><h3>🟡 Mercado Livre</h3><p>Seleção de ofertas e oportunidades.</p><a href="${safeLink(LINKS.mercadoLivre)}" target="_blank">VER OFERTAS</a></div><div class="offer"><h3>🟠 Shopee</h3><p>Cupons, produtos e promoções.</p><a href="${safeLink(LINKS.shopee)}" target="_blank">VER OFERTAS</a></div><div class="offer"><h3>⚫ TikTok Shop</h3><p>Achadinhos e promoções em destaque.</p><a href="${safeLink(LINKS.tiktok)}" target="_blank">VER OFERTAS</a></div></div></section>
<section class="ad"><strong>ANUNCIE AQUI!</strong><span>Sua marca em destaque para Vila Pavão e região.</span><a href="${safeLink(LINKS.anunciar)}" target="_blank">SAIBA MAIS</a></section>
<section class="section"><div class="section-head"><h2>📰 MAIS NOTÍCIAS</h2></div></section><section class="feed">${rest.length?rest.map(newsCard).join(''):'<div style="text-align:center;color:#64748b;padding:30px">Nenhuma outra notícia nesta categoria.</div>'}</section>
<nav class="tabbar"><button class="active" onclick="setCategory('todas')"><span class="tab-ico">⌂</span>INÍCIO</button><button onclick="scrollToNews()"><span class="tab-ico">▤</span>NOTÍCIAS</button><a href="${LINKS.instagram}" target="_blank"><span class="tab-ico">🎁</span>CAIXA</a><button onclick="scrollToOffers()"><span class="tab-ico">🏷</span>OFERTAS</button><a href="${safeLink(LINKS.whatsapp)}" target="_blank"><span class="tab-ico">💬</span>WHATSAPP</a></nav>
</div>`}
function setCategory(cat){activeCat=cat;render();window.scrollTo({top:0,behavior:'smooth'})}
function scrollToNews(){document.querySelector('.feed')?.scrollIntoView({behavior:'smooth'})}
function scrollToOffers(){document.querySelector('.offers')?.scrollIntoView({behavior:'smooth'})}

async function loadInstagram(){if(!INSTAGRAM_API_URL)return;try{const r=await fetch(INSTAGRAM_API_URL,{cache:'no-store'});if(!r.ok)throw new Error('Instagram API');const json=await r.json();const media=Array.isArray(json)?json:(json.data||[]);const fresh=media.map(normalizeMedia).filter(a=>a.title);if(fresh.length){ARTICLES=fresh.slice(0,30);render()}}catch(e){console.warn('Usando notícias locais até a API do Instagram responder.',e)}}
render();loadInstagram();setInterval(loadInstagram,10*60*1000);

let deferredPrompt=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;document.getElementById('install-banner')?.classList.add('show')});function installApp(){document.getElementById('install-banner')?.classList.remove('show');if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null}}function dismissInstall(){document.getElementById('install-banner')?.classList.remove('show')}
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
