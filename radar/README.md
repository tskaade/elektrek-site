# CRT-RADAR

A retro phosphor-CRT radar that plots live overhead air traffic around your
location, with an adjustable range ring, cardinal compass rose, optional device
compass, and tap-to-inspect contact details.

## Live data

Flights come from **airplanes.live** (`https://api.airplanes.live/v2/point/{lat}/{lon}/{radiusNm}`),
which serves HTTPS with CORS headers — so a static page reads it directly, no
proxy or API key needed. **adsb.lol** and **adsb.fi** are kept as automatic
fallbacks; all three return the same ADSBExchange-v2 shape, so the parser
handles any of them. The last source that worked is tried first next refresh.

> Note: OpenSky Network is **not** used — since March 2026 it requires OAuth2
> and sends no CORS headers, so it can't be called from a static page.

Per airplanes.live's terms: non-commercial use, ~1 request/second (this app
polls every 8s, well under), and you should contribute a feeder if you rely on
it. See https://airplanes.live/api-guide/

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
├── index.html        markup + element hooks
├── css/style.css     phosphor-CRT styling
└── js/
    ├── config.js     tunables: sources, refresh, ranges, altitude bands
    └── radar.js      geolocation, fetch, canvas rendering, compass, tap
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
