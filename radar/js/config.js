/* CRT-RADAR configuration
   Edit these without touching radar.js. */
window.RADAR_CONFIG = {
  // --- data source (adsb.lol: CORS-friendly, keyless, community ADS-B) ---
  // Endpoint pattern: {base}/point/{lat}/{lon}/{radiusNm}
  apiBase: 'https://api.adsb.lol/v2',
  refreshMs: 8000,          // how often to pull flights
  maxRadiusNm: 250,         // adsb.lol per-request cap

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
