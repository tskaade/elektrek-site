# CRT-RADAR

A retro phosphor-CRT radar that plots live overhead air traffic around your
location, with an adjustable range ring, cardinal compass rose, optional device
compass, and tap-to-inspect contact details.

## Live data & the CORS problem

Community ADS-B APIs (adsb.lol, adsb.fi, airplanes.live) don't send the
`Access-Control-Allow-Origin` header that browsers require, and airplanes.live
is HTTP-only — so a static HTTPS page **can't read them directly**. The request
leaves but the browser blocks the response. That's the `NO FLIGHT FEED` you saw.

The fix is a small proxy you control that fetches the data server-side and
re-serves it with CORS headers. `worker/cors-proxy.js` is a free Cloudflare
Worker that does exactly this.

### Recommended: deploy the Cloudflare Worker (free, ~2 min)

1. Sign in at https://dash.cloudflare.com → **Workers & Pages** → **Create**.
2. Paste in `worker/cors-proxy.js`, deploy. You'll get a URL like
   `https://crt-radar.<you>.workers.dev`.
3. Put that URL in `js/config.js` as `proxyBase` (no trailing slash):
   ```js
   proxyBase: 'https://crt-radar.you.workers.dev',
   ```
4. Reload. The app calls `{proxyBase}/{lat}/{lon}/{radiusNm}`; the Worker tries
   each upstream feed and returns whichever responds.

Optionally lock the Worker to your site by setting `ALLOW_ORIGIN` in it to
`"https://you.github.io"` instead of `"*"`.

### Works out of the box (stopgap)

Until the Worker is live, the app falls back to a public CORS proxy
(`corsproxy.io`, set as `publicProxy` in config). It's free but rate-limited and
not guaranteed, so deploy your own Worker for anything you rely on. Set
`publicProxy: ''` to disable it.

Fetch order each refresh: your Worker → direct sources → public-proxy-wrapped
sources. The last endpoint that worked is tried first next time.

> OpenSky Network is **not** used — since March 2026 it requires OAuth2 and
> sends no CORS headers, so it can't be called from a static page either.

## Hosting on GitHub Pages

1. Drop this `crt-radar/` folder into your repo.
2. In the repo settings, enable **Pages** and point it at the branch/folder.
3. Open the published HTTPS URL on your phone.

HTTPS is required — geolocation and the device compass are both blocked on
plain `http://` and on `file://`. GitHub Pages serves HTTPS, so you're covered.

## Using it

- **Location** is requested on load; allow it so you sit at the centre.
  If denied, it falls back to the location set in `js/config.js`.
- **RANGE** slider sets the radar radius (20–400 km) and the API query radius.
- **◎ COMPASS** rotates the scope to your facing direction using the device
  magnetometer (iOS asks permission on tap). Off = north-up.
- **⌖ RE-CENTER** re-acquires your position.
- **Tap a blip** to open a contact card (altitude, speed, heading, climb/descent,
  range, bearing, type, registration, squawk, ICAO hex). Tap empty space to close.

## Altitude shading

Blip brightness encodes altitude within the green palette: dim green = low,
bright green = mid, pale green-white = high cruise. Thresholds (`altLowFt`,
`altHighFt`) live in `js/config.js`.

## Files

```
crt-radar/
├── index.html            markup + element hooks
├── css/style.css         phosphor-CRT styling
├── js/
│   ├── config.js         tunables: proxy, sources, refresh, ranges, alt bands
│   └── radar.js          geolocation, fetch, canvas rendering, compass, tap
└── worker/cors-proxy.js  free Cloudflare Worker that adds CORS headers
```

## Customising

Most knobs are in `js/config.js` — refresh rate, sweep speed, range-ring count,
altitude bands, and the fallback location. Edit there without touching the
engine in `radar.js`.

## Limitations

- Coverage depends on nearby ADS-B receivers feeding the network; very rural
  areas or low traffic may show few or no contacts. Bump the range up.
- `UPD ERR` means every endpoint failed; the banner shows why — `CORS/NET`
  (blocked or offline) or `TIMEOUT`. If you see `CORS/NET` on a static host,
  deploy the Worker and set `proxyBase`. `0 CONTACTS` with no error means a
  source replied but nothing was overhead — bump the range up.
