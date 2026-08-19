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

    if (url.pathname === "/api/admin/content" && request.method==="PUT") {
      if(!(await isAdmin(request,env))) return json({error:"Não autorizado"},401);
      if(!env.CONTENT) return json({error:"Binding KV CONTENT não configurado."},503);
      const body=await request.json().catch(()=>null);
      if(!body || typeof body!=="object") return json({error:"Conteúdo inválido."},400);
      await env.CONTENT.put("site-content",JSON.stringify(body));
      return json({ok:true});
    }

    return env.ASSETS.fetch(request);
  }
};

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
