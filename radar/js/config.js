/* CRT-RADAR configuration
   Edit these without touching radar.js. */
window.RADAR_CONFIG = {
  // --- data source ---
  // airplanes.live serves HTTPS + CORS headers, so a static page can read it
  // directly — confirmed working from the browser. No proxy needed.
  // Returns the ADSBExchange-v2 shape { ac: [...] }.
  sources: [
    { name: 'airplanes.live', url: 'https://api.airplanes.live/v2/point/{lat}/{lon}/{r}' },
    { name: 'adsb.lol',       url: 'https://api.adsb.lol/v2/point/{lat}/{lon}/{r}' },
    { name: 'adsb.fi',        url: 'https://opendata.adsb.fi/api/v2/lat/{lat}/lon/{lon}/dist/{r}' }
  ],
  fetchTimeoutMs: 6000,     // per-source request timeout
  refreshMs: 8000,          // how often to pull flights
  maxRadiusNm: 250,         // per-request radius cap

  // --- compass smoothing ---
  // The raw magnetometer is noisy and occasionally throws wild readings. These
  // control how the scope reacts. Higher smoothing = calmer but slower.
  compass: {
    smoothing: 0.92,        // 0.5 = snappy, 0.95 = very smooth/slow. Try 0.85-0.95.
    outlierDeg: 35,         // a single jump bigger than this is treated as noise
    outlierConfirmCount: 6, // ...unless this many readings in a row agree (real turn)
    deadbandDeg: 1.5,       // ignore changes smaller than this (kills micro-jitter)
    maxStepDegPerSec: 90    // cap how fast the display can slew (deg/second)
  },

  // --- route lookup (origin -> destination) ---
  // ADS-B does NOT broadcast origin/destination. adsb.lol's route endpoint was
  // tested via route-diagnostic.html and did NOT work from the browser (no CORS
  // on the POST), so this is disabled. Left here in case a working route source
  // is found later — point `url` at it and set enabled:true.
  route: {
    enabled: false,
    url: 'https://api.adsb.lol/api/0/routeset',
    timeoutMs: 7000
  },

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
