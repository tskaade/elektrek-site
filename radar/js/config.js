/* CRT-RADAR configuration
   Edit these without touching radar.js. */
window.RADAR_CONFIG = {
  // --- data sources (community ADS-B, keyless) ---
  // Tried in order until one returns data. All return the ADSBExchange-v2
  // shape { ac: [...] }. {lat}/{lon}/{r} are filled in per request (r = nm).
  // If your browser blocks one on CORS, the next is tried automatically.
  sources: [
    { name: 'airplanes.live', url: 'https://api.airplanes.live/v2/point/{lat}/{lon}/{r}' },
    { name: 'adsb.lol',       url: 'https://api.adsb.lol/v2/point/{lat}/{lon}/{r}' },
    { name: 'adsb.fi',        url: 'https://opendata.adsb.fi/api/v2/lat/{lat}/lon/{lon}/dist/{r}' }
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
