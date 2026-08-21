export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/instagram") {
      if (!env.INSTAGRAM_TOKEN) return json({error:"INSTAGRAM_TOKEN não configurado."},503);
      const fields=["id","caption","media_type","media_url","thumbnail_url","permalink","timestamp","username"].join(",");
      const api=new URL("https://graph.instagram.com/me/media");
      api.searchParams.set("fields",fields);
      api.searchParams.set("limit","18");
      api.searchParams.set("access_token",env.INSTAGRAM_TOKEN);
      try{
        const response=await fetch(api.toString(),{headers:{Accept:"application/json"}});
        const body=await response.text();
        if(!response.ok) return json({error:"Meta recusou a consulta.",status:response.status},502);
        return new Response(body,{headers:{"Content-Type":"application/json;charset=UTF-8","Cache-Control":"public,max-age=180"}});
      }catch(e){return json({error:"Falha ao consultar Instagram."},502)}
    }

    if (url.pathname === "/api/regional") {
      try{
        const rssUrl="https://www.agazeta.com.br/rss";
        const r=await fetch(rssUrl,{headers:{"User-Agent":"FalaPavao/1.0"}});
        if(!r.ok) throw new Error("rss");
        const xml=await r.text();
        const items=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0,12).map(m=>{
          const x=m[1];
          const get=(tag)=>((x.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,"i"))||[])[1]||"")
            .replace(/^<!\[CDATA\[|\]\]>$/g,"").replace(/<[^>]+>/g,"").trim();
          const title=decodeXml(get("title"));
          const link=decodeXml(get("link"));
          const pubDate=decodeXml(get("pubDate"));
          const description=decodeXml(get("description")).slice(0,180);
          const media=(x.match(/<media:content[^>]+url=["']([^"']+)["']/i)||[])[1]||
                      (x.match(/<enclosure[^>]+url=["']([^"']+)["']/i)||[])[1]||"";
          return {title,link,pubDate,description,image:media,source:"A Gazeta"};
        }).filter(x=>x.title&&x.link);
        return json({data:items});
      }catch(e){return json({data:[],error:"Feed regional indisponível."},200)}
    }

    if (url.pathname === "/api/content" && request.method==="GET") {
      if (!env.CONTENT) return json({});
      const raw=await env.CONTENT.get("site-content");
      return json(raw?JSON.parse(raw):{});
    }

    if (url.pathname === "/api/admin/login" && request.method==="POST") {
      const body=await request.json().catch(()=>({}));
      if(!env.ADMIN_USER || !env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET)
        return json({error:"Credenciais administrativas ainda não configuradas."},503);
      if(body.user!==env.ADMIN_USER || body.pass!==env.ADMIN_PASSWORD)
        return json({error:"Usuário ou senha inválidos."},401);
      const token=await makeSession(env.ADMIN_USER,env.ADMIN_SESSION_SECRET);
      return json({ok:true},200,{"Set-Cookie":`fp_admin=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`});
    }

    if (url.pathname === "/api/admin/logout" && request.method==="POST") {
      return json({ok:true},200,{"Set-Cookie":"fp_admin=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"});
    }

    if (url.pathname === "/api/admin/me") {
      return (await isAdmin(request,env)) ? json({ok:true}) : json({error:"Não autorizado"},401);
    }


    if (url.pathname === "/api/admin/product-preview" && request.method === "POST") {
      if (!(await isAdmin(request, env))) return json({ error: "Não autorizado" }, 401);

      const body = await request.json().catch(() => ({}));
      const rawUrl = String(body.url || "").trim();

      try {
        const preview = await fetchProductPreview(rawUrl);
        return json(preview);
      } catch (e) {
        return json({
          error: e?.message || "Não foi possível buscar os dados do produto."
        }, 400);
      }
    }

    if (url.pathname === "/api/admin/content" && request.method==="PUT") {
      if(!(await isAdmin(request,env))) return json({error:"Não autorizado"},401);
      if(!env.CONTENT) return json({error:"Binding KV CONTENT não configurado."},503);
      const body=await request.json().catch(()=>null);
      if(!body || typeof body!=="object") return json({error:"Conteúdo inválido."},400);
      await env.CONTENT.put("site-content",JSON.stringify(body));
      return json({ok:true});
    }


    if (url.pathname === "/api/admin/stats" && request.method === "GET") {
      if (!(await isAdmin(request, env))) return json({ error: "Não autorizado" }, 401);
      if (!env.ANALYTICS_DB) return json({ error: "Binding D1 ANALYTICS_DB não configurado." }, 503);

      const daysRaw = Number(url.searchParams.get("days") || "30");
      const days = [1, 7, 30, 90].includes(daysRaw) ? daysRaw : 30;
      const since = isoDayOffset(-(days - 1));
      const today = isoDayOffset(0);
      const since7 = isoDayOffset(-6);
      const since30 = isoDayOffset(-29);

      try {
        const [
          todayRow,
          sevenRow,
          thirtyRow,
          periodRow,
          cities,
          sources,
          devices,
          hours
        ] = await Promise.all([
          env.ANALYTICS_DB.prepare(
            "SELECT COALESCE(SUM(views),0) AS views FROM traffic_daily WHERE day = ?1"
          ).bind(today).first(),
          env.ANALYTICS_DB.prepare(
            "SELECT COALESCE(SUM(views),0) AS views FROM traffic_daily WHERE day >= ?1"
          ).bind(since7).first(),
          env.ANALYTICS_DB.prepare(
            "SELECT COALESCE(SUM(views),0) AS views FROM traffic_daily WHERE day >= ?1"
          ).bind(since30).first(),
          env.ANALYTICS_DB.prepare(
            "SELECT COALESCE(SUM(views),0) AS views FROM traffic_daily WHERE day >= ?1"
          ).bind(since).first(),
          env.ANALYTICS_DB.prepare(
            `SELECT city, region, country, SUM(views) AS views
             FROM traffic_daily
             WHERE day >= ?1
             GROUP BY city, region, country
             ORDER BY views DESC
             LIMIT 20`
          ).bind(since).all(),
          env.ANALYTICS_DB.prepare(
            `SELECT source, SUM(views) AS views
             FROM traffic_daily
             WHERE day >= ?1
             GROUP BY source
             ORDER BY views DESC
             LIMIT 20`
          ).bind(since).all(),
          env.ANALYTICS_DB.prepare(
            `SELECT device, SUM(views) AS views
             FROM traffic_daily
             WHERE day >= ?1
             GROUP BY device
             ORDER BY views DESC`
          ).bind(since).all(),
          env.ANALYTICS_DB.prepare(
            `SELECT hour, SUM(views) AS views
             FROM traffic_daily
             WHERE day >= ?1
             GROUP BY hour
             ORDER BY hour ASC`
          ).bind(since).all()
        ]);

        return json({
          periodDays: days,
          totals: {
            today: Number(todayRow?.views || 0),
            days7: Number(sevenRow?.views || 0),
            days30: Number(thirtyRow?.views || 0),
            period: Number(periodRow?.views || 0)
          },
          cities: cities.results || [],
          sources: sources.results || [],
          devices: devices.results || [],
          hours: hours.results || []
        });
      } catch (e) {
        console.error("Analytics query error", e);
        return json({ error: "Não foi possível consultar as estatísticas." }, 500);
      }
    }

    // Registra somente visualização real de página pública.
    // Não salva IP, nome, cookie ou outro identificador pessoal.
    if (shouldCountPageView(request, url)) {
      ctx.waitUntil(recordPageView(request, env));
    }

    return env.ASSETS.fetch(request);
  }
};



async function fetchProductPreview(rawUrl) {
  let current = validatePublicHttpUrl(rawUrl);

  let response = null;
  for (let i = 0; i < 5; i++) {
    response = await fetch(current.toString(), {
      redirect: "manual",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FalaPavaoBot/1.0; +https://falapavao.com)",
        "Accept": "text/html,application/xhtml+xml"
      }
    });

    if ([301,302,303,307,308].includes(response.status)) {
      const location = response.headers.get("Location");
      if (!location) throw new Error("Redirecionamento inválido.");
      current = validatePublicHttpUrl(new URL(location, current).toString());
      continue;
    }
    break;
  }

  if (!response) throw new Error("Não foi possível acessar o link.");
  if (!response.ok) throw new Error(`A loja respondeu com erro ${response.status}.`);

  const type = response.headers.get("Content-Type") || "";
  if (!type.includes("text/html")) {
    throw new Error("O link não aponta para uma página de produto em HTML.");
  }

  // Limita a leitura para não gastar memória excessiva.
  const full = await response.text();
  const doc = full.slice(0, 1_500_000);

  const finalUrl = current.toString();
  const title =
    metaContent(doc, "property", "og:title") ||
    metaContent(doc, "name", "twitter:title") ||
    tagText(doc, "title") ||
    "";

  const description =
    metaContent(doc, "property", "og:description") ||
    metaContent(doc, "name", "description") ||
    metaContent(doc, "name", "twitter:description") ||
    "";

  let image =
    metaContent(doc, "property", "og:image:secure_url") ||
    metaContent(doc, "property", "og:image") ||
    metaContent(doc, "name", "twitter:image") ||
    "";

  if (!image) {
    image = imageFromJsonLd(doc) || "";
  }

  if (image) {
    try {
      image = new URL(decodeHtml(image), current).toString();
      // A URL da imagem também deve ser HTTP/HTTPS pública.
      validatePublicHttpUrl(image);
    } catch {
      image = "";
    }
  }

  return {
    url: finalUrl,
    title: cleanMeta(title, 160),
    description: cleanMeta(description, 220),
    image
  };
}

function validatePublicHttpUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("Link inválido.");
  }

  if (!["http:", "https:"].includes(u.protocol)) {
    throw new Error("Use um link começando com http:// ou https://");
  }

  if (u.username || u.password) {
    throw new Error("Links com usuário/senha não são permitidos.");
  }

  const h = u.hostname.toLowerCase();

  if (
    h === "localhost" ||
    h === "::1" ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    h === "0.0.0.0" ||
    h.startsWith("127.") ||
    h.startsWith("10.") ||
    h.startsWith("169.254.") ||
    h.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h)
  ) {
    throw new Error("Esse endereço não é permitido.");
  }

  return u;
}

function metaContent(doc, attr, value) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+${attr}\\s*=\\s*["']${escaped}["'][^>]+content\\s*=\\s*["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content\\s*=\\s*["']([^"']+)["'][^>]+${attr}\\s*=\\s*["']${escaped}["'][^>]*>`, "i")
  ];
  for (const p of patterns) {
    const m = doc.match(p);
    if (m?.[1]) return decodeHtml(m[1]);
  }
  return "";
}

function tagText(doc, tag) {
  const m = doc.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m?.[1] ? decodeHtml(m[1].replace(/<[^>]+>/g, " ")) : "";
}

function imageFromJsonLd(doc) {
  const scripts = [...doc.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of scripts) {
    try {
      const data = JSON.parse(m[1].trim());
      const stack = Array.isArray(data) ? [...data] : [data];
      while (stack.length) {
        const item = stack.shift();
        if (!item || typeof item !== "object") continue;
        if (item.image) {
          if (typeof item.image === "string") return item.image;
          if (Array.isArray(item.image) && typeof item.image[0] === "string") return item.image[0];
          if (typeof item.image?.url === "string") return item.image.url;
        }
        if (Array.isArray(item["@graph"])) stack.push(...item["@graph"]);
      }
    } catch {}
  }
  return "";
}

function cleanMeta(s, max) {
  return decodeHtml(String(s || ""))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function decodeHtml(s = "") {
  return String(s)
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x2F;/gi, "/");
}

function shouldCountPageView(request, url) {
  if (request.method !== "GET") return false;
  if (url.pathname.startsWith("/api/")) return false;
  if (url.pathname === "/admin.html") return false;

  const dest = request.headers.get("Sec-Fetch-Dest");
  if (dest && dest !== "document") return false;

  const accept = request.headers.get("Accept") || "";
  if (dest !== "document" && !accept.includes("text/html")) return false;

  const ua = request.headers.get("User-Agent") || "";
  if (/bot|crawler|spider|slurp|headless|lighthouse|pagespeed/i.test(ua)) return false;

  return true;
}

async function recordPageView(request, env) {
  if (!env.ANALYTICS_DB) return;

  const cf = request.cf || {};
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const hour = now.getUTCHours();

  const city = cleanDimension(cf.city || "Desconhecida", 80);
  const region = cleanDimension(cf.region || "", 80);
  const country = cleanDimension(cf.country || "XX", 8);
  const source = cleanDimension(detectSource(request), 40);
  const device = cleanDimension(detectDevice(request.headers.get("User-Agent") || ""), 20);

  try {
    await env.ANALYTICS_DB.prepare(
      `INSERT INTO traffic_daily
       (day, hour, city, region, country, source, device, views)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1)
       ON CONFLICT(day, hour, city, region, country, source, device)
       DO UPDATE SET views = views + 1`
    ).bind(day, hour, city, region, country, source, device).run();
  } catch (e) {
    console.error("Analytics write error", e);
  }
}

function detectSource(request) {
  const url = new URL(request.url);
  const utm = (url.searchParams.get("utm_source") || "").trim().toLowerCase();
  if (utm) return prettySource(utm);

  const ref = request.headers.get("Referer") || "";
  if (!ref) return "Direto";

  try {
    const host = new URL(ref).hostname.toLowerCase().replace(/^www\./, "");
    if (host === url.hostname.toLowerCase().replace(/^www\./, "")) return "Interno";
    if (host.includes("instagram.com")) return "Instagram";
    if (host.includes("google.")) return "Google";
    if (host.includes("facebook.com") || host.includes("fb.com")) return "Facebook";
    if (host.includes("tiktok.com")) return "TikTok";
    if (host.includes("whatsapp.com") || host.includes("wa.me")) return "WhatsApp";
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "YouTube";
    if (host.includes("bing.com")) return "Bing";
    return host;
  } catch {
    return "Outro";
  }
}

function prettySource(v) {
  const map = {
    instagram: "Instagram",
    ig: "Instagram",
    facebook: "Facebook",
    fb: "Facebook",
    whatsapp: "WhatsApp",
    wa: "WhatsApp",
    google: "Google",
    tiktok: "TikTok",
    youtube: "YouTube"
  };
  return map[v] || v.slice(0, 40);
}

function detectDevice(ua) {
  if (/ipad|tablet|kindle|silk/i.test(ua)) return "Tablet";
  if (/mobi|android|iphone|ipod/i.test(ua)) return "Celular";
  return "Computador";
}

function cleanDimension(value, max) {
  return String(value || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, max) || "Desconhecido";
}

function isoDayOffset(offsetDays) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function decodeXml(s=""){
  return s.replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">");
}
function json(data,status=200,extra={}){
  return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json;charset=UTF-8","Cache-Control":"no-store",...extra}});
}
async function makeSession(user,secret){
  const exp=Date.now()+8*60*60*1000;
  const payload=btoa(JSON.stringify({user,exp})).replace(/=+$/,"");
  const sig=await hmac(payload,secret);
  return `${payload}.${sig}`;
}
async function isAdmin(request,env){
  if(!env.ADMIN_SESSION_SECRET || !env.ADMIN_USER) return false;
  const cookie=request.headers.get("Cookie")||"";
  const token=(cookie.match(/(?:^|;\s*)fp_admin=([^;]+)/)||[])[1];
  if(!token) return false;
  const [payload,sig]=token.split(".");
  if(!payload||!sig) return false;
  const expected=await hmac(payload,env.ADMIN_SESSION_SECRET);
  if(sig!==expected) return false;
  try{
    const data=JSON.parse(atob(payload.replace(/-/g,"+").replace(/_/g,"/")));
    return data.user===env.ADMIN_USER && data.exp>Date.now();
  }catch{return false}
}
async function hmac(data,secret){
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const sig=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
