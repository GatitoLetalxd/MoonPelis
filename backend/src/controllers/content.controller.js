const pelisplus = require("../services/providers/pelisplus.service");
const repelishd = require("../services/providers/repelishd.service");
const { resolveEmbedUrl } = require("../utils/resolvers");

/**
 * Buscar películas y series en proveedores activos
 */
async function searchContent(req, res) {
  try {
    const queryStr = req.query.s || req.query.q || "";
    if (!queryStr) {
      return res.status(400).json({ error: "La consulta de búsqueda es requerida." });
    }

    // Buscar en paralelo en PelisPlus y RePelisHD
    const [pelisplusRes, repelishdRes] = await Promise.allSettled([
      pelisplus.searchContent(queryStr),
      repelishd.searchContent(queryStr),
    ]);

    const pelisplusResults = pelisplusRes.status === "fulfilled" ? pelisplusRes.value || [] : [];
    const repelishdResults = repelishdRes.status === "fulfilled" ? repelishdRes.value || [] : [];

    // Taggear resultados con su proveedor original
    const taggedPelisplus = pelisplusResults.map((item) => ({ ...item, provider: "pelisplus" }));
    const taggedRepelishd = repelishdResults.map((item) => ({ ...item, provider: "repelishd" }));

    // Unificar y deduplicar por slug/título aproximado
    const combined = [...taggedPelisplus, ...taggedRepelishd];
    const uniqueMap = new Map();

    for (const item of combined) {
      const normKey = (item.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (normKey && !uniqueMap.has(normKey)) {
        uniqueMap.set(normKey, item);
      }
    }

    const finalResults = Array.from(uniqueMap.values());
    return res.json({ query: queryStr, total: finalResults.length, results: finalResults });
  } catch (err) {
    console.error("[Content Search Error]", err);
    return res.status(500).json({ error: "Error procesando la búsqueda de contenido." });
  }
}

/**
 * Catálogo paginado de películas o series por género
 */
async function getCatalog(req, res) {
  try {
    const type = req.query.type || "movie";
    const genre = req.query.genre || "";
    const page = parseInt(req.query.page || "1", 10);
    const provider = req.query.provider || "pelisplus";

    let catalogData;
    if (provider === "repelishd") {
      catalogData = await repelishd.searchContent(genre || "a");
      catalogData = { items: catalogData, page: 1, hasNextPage: false };
    } else {
      catalogData = await pelisplus.getCatalog(type, genre, page);
    }

    // Taggear proveedor en cada elemento
    const items = (catalogData.items || []).map((item) => ({
      ...item,
      provider,
    }));

    return res.json({
      provider,
      type,
      genre,
      page: catalogData.page || page,
      hasNextPage: catalogData.hasNextPage || false,
      items,
    });
  } catch (err) {
    console.error("[Content Catalog Error]", err);
    return res.status(500).json({ error: "Error al obtener el catálogo." });
  }
}

/**
 * Información detallada de una película o serie
 */
async function getContentInfo(req, res) {
  try {
    const { slug } = req.params;
    const type = req.query.type || "movie";
    const provider = req.query.provider || "pelisplus";

    let info;
    if (provider === "repelishd") {
      info = await repelishd.getContentInfo(slug, type);
    } else {
      info = await pelisplus.getContentInfo(slug, type);
    }

    return res.json({ provider, ...info });
  } catch (err) {
    console.error("[Content Info Error]", err);
    return res.status(500).json({ error: "Error al obtener detalles del contenido." });
  }
}

/**
 * Servidores de reproducción disponibles (Película o Serie)
 */
async function getContentServers(req, res) {
  try {
    const { slug } = req.params;
    const type = req.query.type || "movie";
    const season = req.query.season ? parseInt(req.query.season, 10) : null;
    const episode = req.query.episode ? parseInt(req.query.episode, 10) : null;
    const provider = req.query.provider || "pelisplus";

    let servers = [];

    if (type === "series" || (season && episode)) {
      if (provider === "repelishd") {
        const data = await repelishd.getEpisodeServers(slug, season || 1, episode || 1);
        servers = data.servers || [];
      } else {
        const data = await pelisplus.getEpisodeServers(slug, season || 1, episode || 1);
        servers = data.servers || [];
      }
    } else {
      // Película
      if (provider === "repelishd") {
        const info = await repelishd.getContentInfo(slug, "movie");
        servers = info.servers || [];
      } else {
        const info = await pelisplus.getContentInfo(slug, "movie");
        servers = info.servers || [];
      }
    }

    // Adaptar formato de servidores para cliente
    const formattedServers = (servers || []).map((srv) => ({
      server: srv.name || srv.server || "Servidor Principal",
      url: srv.embedUrl || srv.url || "",
      lang: srv.language || srv.lang || "Latino",
    }));

    return res.json({ provider, servers: formattedServers });
  } catch (err) {
    console.error("[Get Servers Error]", err);
    return res.status(500).json({ error: "Error al obtener los servidores del video." });
  }
}

/**
 * Resolver un iframe/embed a stream directo
 */
async function resolveStream(req, res) {
  try {
    const url = req.query.url || req.body?.url;
    const referer = req.query.referer || req.body?.referer;
    if (!url) {
      return res.status(400).json({ error: "La URL a resolver es requerida." });
    }

    const streamUrl = await resolveEmbedUrl(url, referer);
    return res.json({ originalUrl: url, streamUrl: streamUrl || url });
  } catch (err) {
    console.error("[Resolve Stream Error]", err);
    return res.json({ originalUrl: req.query.url, streamUrl: req.query.url });
  }
}

/**
 * Opción 1: Proxy HTML Completo
 * Descarga el HTML del embed, inserta un <base href="..."> para resolver assets y neutraliza detecciones de iframe/sandbox.
 */
async function proxyEmbed(req, res) {
  try {
    const rawUrl = req.query.url;
    if (!rawUrl) {
      return res.status(400).send("Se requiere el parámetro url");
    }

    const targetUrl = decodeURIComponent(rawUrl);
    const parsedUrl = new URL(targetUrl);
    const origin = `${parsedUrl.protocol}//${parsedUrl.host}`;

    const fetchResponse = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: `${origin}/`,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    let html = await fetchResponse.text();

    // 1. Inyectar <base> para que assets relativos resuelvan contra el servidor original
    if (html.includes("<head>")) {
      html = html.replace("<head>", `<head><base href="${targetUrl}">`);
    } else if (html.includes("<html>")) {
      html = html.replace("<html>", `<html><head><base href="${targetUrl}"></head>`);
    }

    // 2. Neutralizar detecciones JS comunes y remover metas X-Frame-Options del HTML remoto
    html = html.replace(/<meta[^>]*http-equiv=["']?X-Frame-Options["']?[^>]*>/gi, "");
    html = html.replace(/localStorage\.setItem/g, "void");
    html = html.replace(/localStorage\.getItem/g, "(()=>null)");
    html = html.replace(/window\.top\s*===\s*window\.self/g, "true");
    html = html.replace(/window\.top\s*!==\s*window\.self/g, "false");
    html = html.replace(/top\.location/g, "window.self.location");

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  } catch (err) {
    console.error("[Proxy Embed Error]", err.message);
    return res.status(500).send("Error al procesar el proxy del embed");
  }
}

module.exports = {
  searchContent,
  getCatalog,
  getContentInfo,
  getContentServers,
  resolveStream,
  proxyEmbed,
};
