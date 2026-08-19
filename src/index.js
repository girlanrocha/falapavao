export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/instagram") {
      if (!env.INSTAGRAM_TOKEN) {
        return json(
          { error: "INSTAGRAM_TOKEN não configurado na Cloudflare." },
          503
        );
      }

      const fields = [
        "id",
        "caption",
        "media_type",
        "media_url",
        "thumbnail_url",
        "permalink",
        "timestamp",
        "username"
      ].join(",");

      const api = new URL("https://graph.instagram.com/me/media");
      api.searchParams.set("fields", fields);
      api.searchParams.set("limit", "18");
      api.searchParams.set("access_token", env.INSTAGRAM_TOKEN);

      try {
        const response = await fetch(api.toString(), {
          headers: {
            Accept: "application/json"
          }
        });

        const body = await response.text();

        if (!response.ok) {
          return json(
            {
              error: "A Meta recusou a consulta do Instagram.",
              status: response.status
            },
            502
          );
        }

        return new Response(body, {
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
            "Cache-Control": "public, max-age=180"
          }
        });
      } catch (error) {
        return json(
          { error: "Falha ao consultar o Instagram." },
          502
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store"
    }
  });
}
