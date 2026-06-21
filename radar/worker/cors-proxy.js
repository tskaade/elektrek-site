/*
 * CRT-RADAR — Cloudflare Worker CORS proxy
 * ----------------------------------------
 * Community ADS-B APIs don't send the Access-Control-Allow-Origin header that
 * browsers require, so a static page (e.g. GitHub Pages) can't read them
 * directly. This tiny Worker fetches the data server-side and re-serves it
 * with permissive CORS headers, which the browser is happy to read.
 *
 * DEPLOY (free):
 *   1. Sign in at https://dash.cloudflare.com  ->  Workers & Pages  ->  Create
 *   2. Paste this file in, deploy. You'll get a URL like:
 *        https://crt-radar.<your-subdomain>.workers.dev
 *   3. Put that URL in js/config.js as `proxyBase` (no trailing slash).
 *
 * The app calls:  {proxyBase}/{lat}/{lon}/{radiusNm}
 * The Worker tries each upstream ADS-B source until one returns data.
 *
 * Optional: lock it to your own site by replacing "*" in ALLOW_ORIGIN with
 * "https://yourname.github.io".
 */

const ALLOW_ORIGIN = "*";

// Upstream sources, tried in order. All return the ADSBExchange-v2 shape.
const UPSTREAMS = [
  (lat, lon, r) => `https://api.adsb.lol/v2/point/${lat}/${lon}/${r}`,
  (lat, lon, r) => `https://opendata.adsb.fi/api/v2/lat/${lat}/lon/${lon}/dist/${r}`,
  // airplanes.live is HTTP-only upstream; fine to fetch server-side from a Worker
  (lat, lon, r) => `http://api.airplanes.live/v2/point/${lat}/${lon}/${r}`,
];

const CORS = {
  "Access-Control-Allow-Origin": ALLOW_ORIGIN,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    // expect /{lat}/{lon}/{radius}
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 3) {
      return json({ error: "use /{lat}/{lon}/{radiusNm}" }, 400);
    }
    const [lat, lon, r] = parts;

    for (const build of UPSTREAMS) {
      try {
        const upstream = build(lat, lon, r);
        const res = await fetch(upstream, {
          headers: { Accept: "application/json" },
          cf: { cacheTtl: 3, cacheEverything: true },
        });
        if (!res.ok) continue;
        const data = await res.json();
        if (data && (data.ac || data.aircraft)) {
          return json(data, 200);
        }
      } catch (_) {
        // try next upstream
      }
    }
    return json({ error: "all upstreams failed", ac: [] }, 502);
  },
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
