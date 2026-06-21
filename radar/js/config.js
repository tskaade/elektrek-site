/* CRT-RADAR configuration
   Edit these without touching radar.js. */
window.RADAR_CONFIG = {
  // --- CORS proxy (recommended) ---
  // Community ADS-B APIs don't send CORS headers, so a static page can't read
  // them directly. Deploy worker/cors-proxy.js to Cloudflare (free) and paste
  // its URL here (no trailing slash). The app then calls {proxyBase}/{lat}/{lon}/{r}.
  // Leave '' to skip and try the direct sources / public fallback below.
  proxyBase: '',

  // If proxyBase is empty and direct sources are blocked, optionally route
  // through a public CORS proxy. Free but rate-limited and not guaranteed —
  // fine as a stopgap until your own Worker is live. Set to '' to disable.
  publicProxy: 'https://corsproxy.io/?url=',

  // --- direct data sources (tried if no proxy, may be CORS-blocked) ---
  // All return the ADSBExchange-v2 shape { ac: [...] }.
  sources: [
    { name: 'adsb.lol', url: 'https://api.adsb.lol/v2/point/{lat}/{lon}/{r}' },
    { name: 'adsb.fi',  url: 'https://opendata.adsb.fi/api/v2/lat/{lat}/lon/{lon}/dist/{r}' }
  ],
  fetchTimeoutMs: 6000,     // per-source request timeout
  refreshMs: 8000,          // how often to pull flights
  maxRadiusNm: 250,         // per-request radius cap

  // --- radar behaviour ---
  defaultRangeKm: 120,
  sweepSeconds: 4,          // one full revolution
  rangeRings: 4,

  // --- altitude shading (feet). Colour stays in the green palette:
  //     low = dim green, mid = bright green, high = pale green-white. ---
  altLowFt: 2000,
  altHighFt: 40000,

  // --- fallback location if geolocation denied (Ballantrae, ON) ---
  fallback: { lat: 44.10, lon: -79.25, label: 'DEFAULT POSITION' }
};
