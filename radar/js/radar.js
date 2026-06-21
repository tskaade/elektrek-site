(()=>{
'use strict';
const CFG = window.RADAR_CONFIG;

const cv = document.getElementById('scope');
const ctx = cv.getContext('2d');
const statusEl = document.getElementById('status');
const rangeIn = document.getElementById('range');
const rangeVal = document.getElementById('rangeVal');
const contactsEl = document.getElementById('contacts');
const headingEl = document.getElementById('heading');
const lastupdEl = document.getElementById('lastupd');
const locLabel = document.getElementById('locLabel');
const compassBtn = document.getElementById('compassBtn');
const recenterBtn = document.getElementById('recenterBtn');
const card = document.getElementById('card');
const routeEl = document.getElementById('cRoute');

let DPR = Math.min(window.devicePixelRatio||1, 2.5);
let W=0,H=0,CX=0,CY=0,R=0;
let rangeKm = CFG.defaultRangeKm;
let user = null;
let flights = [];
let fetchInProgress = false;
let sweepAngle = 0;
let heading = 0;          // smoothed heading actually used for drawing
let headingTarget = 0;    // validated raw sensor heading (the goal to ease toward)
let headingHasFix = false;// true once we've received at least one reading
let rawCandidate = null;  // a big jump under probation
let rawCandidateCount = 0;// how many consecutive readings agree with the candidate
let compassOn = false;
let selectedId = null;
let screenBlips = [];

const KM_PER_DEG = 111.32;

rangeIn.value = rangeKm;

function setStatus(t, tappable){
  if(t===null){ statusEl.classList.add('hide'); return; }
  statusEl.textContent = t;
  statusEl.classList.remove('hide');
  statusEl.classList.toggle('tap', !!tappable);
}

/* ---------- altitude -> green shade ----------
   Interpolates dim-green -> bright-green -> pale green-white.
   Returns an rgb triplet so callers can apply their own alpha. */
function altColor(altFt){
  const lo = CFG.altLowFt, hi = CFG.altHighFt;
  let t = (altFt - lo) / (hi - lo);
  t = Math.max(0, Math.min(1, t || 0));
  // stops: 0.0 #0f7a33 (15,122,51) | 0.55 #22ff66 (34,255,102) | 1.0 #c8ffd8 (200,255,216)
  let r,g,b;
  if(t < 0.55){
    const k = t/0.55;
    r = 15 + (34-15)*k;
    g = 122 + (255-122)*k;
    b = 51 + (102-51)*k;
  } else {
    const k = (t-0.55)/0.45;
    r = 34 + (200-34)*k;
    g = 255;
    b = 102 + (216-102)*k;
  }
  return [Math.round(r),Math.round(g),Math.round(b)];
}

/* ---------- sizing ---------- */
function resize(){
  const rect = cv.getBoundingClientRect();
  DPR = Math.min(window.devicePixelRatio||1, 2.5);
  W = Math.round(rect.width*DPR);
  H = Math.round(rect.height*DPR);
  cv.width = W; cv.height = H;
  CX = W/2; CY = H/2;
  R = Math.min(W,H)/2 - 6*DPR;
}
window.addEventListener('resize', resize);

/* ---------- geo helpers ---------- */
function project(lat, lon){
  const dLat = (lat - user.lat);
  const dLon = (lon - user.lon) * Math.cos(user.lat*Math.PI/180);
  const north = dLat*KM_PER_DEG;
  const east  = dLon*KM_PER_DEG;
  const distKm = Math.hypot(north,east);
  const pxPerKm = R/rangeKm;
  const hr = heading*Math.PI/180;
  const rx = east*Math.cos(hr) - north*Math.sin(hr);
  const ry = east*Math.sin(hr) + north*Math.cos(hr);
  return { x: CX + rx*pxPerKm, y: CY - ry*pxPerKm, distKm };
}
function bearingTo(lat,lon){
  const dLat=(lat-user.lat), dLon=(lon-user.lon)*Math.cos(user.lat*Math.PI/180);
  let b = Math.atan2(dLon,dLat)*180/Math.PI;
  if(b<0) b+=360;
  return b;
}
function compassPt(deg){
  const dirs=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg/22.5)%16];
}

/* ---------- drawing ---------- */
function draw(){
  ctx.clearRect(0,0,W,H);

  ctx.save();
  ctx.beginPath();ctx.arc(CX,CY,R,0,Math.PI*2);ctx.clip();
  const g = ctx.createRadialGradient(CX,CY,0,CX,CY,R);
  g.addColorStop(0,'rgba(10,40,18,0.55)');
  g.addColorStop(1,'rgba(2,14,5,0.85)');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.restore();

  ctx.lineWidth = 1*DPR;
  ctx.strokeStyle = 'rgba(34,255,102,0.20)';
  for(let i=1;i<=CFG.rangeRings;i++){
    ctx.beginPath();ctx.arc(CX,CY,R*i/CFG.rangeRings,0,Math.PI*2);ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(CX-R,CY);ctx.lineTo(CX+R,CY);
  ctx.moveTo(CX,CY-R);ctx.lineTo(CX,CY+R);
  ctx.stroke();

  ctx.strokeStyle='rgba(34,255,102,0.55)';
  ctx.lineWidth=2*DPR;
  ctx.beginPath();ctx.arc(CX,CY,R,0,Math.PI*2);ctx.stroke();

  ctx.fillStyle='rgba(34,255,102,0.5)';
  ctx.font = `${12*DPR}px 'Share Tech Mono',monospace`;
  ctx.textAlign='left';ctx.textBaseline='bottom';
  for(let i=1;i<=CFG.rangeRings;i++){
    const km = Math.round(rangeKm*i/CFG.rangeRings);
    ctx.fillText(km+'', CX+4*DPR, CY - R*i/CFG.rangeRings - 2*DPR);
  }

  drawCardinals();
  drawSweep();
  drawFlights();

  ctx.fillStyle='#22ff66';
  ctx.beginPath();ctx.arc(CX,CY,3.5*DPR,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(34,255,102,0.6)';ctx.lineWidth=1*DPR;
  ctx.beginPath();ctx.arc(CX,CY,7*DPR,0,Math.PI*2);ctx.stroke();
}

function drawCardinals(){
  const dirs=[['N',0],['E',90],['S',180],['W',270],
              ['NE',45],['SE',135],['SW',225],['NW',315]];
  ctx.textAlign='center';ctx.textBaseline='middle';
  dirs.forEach(([lbl,deg])=>{
    const a = (deg - heading)*Math.PI/180 - Math.PI/2;
    const lx = CX + Math.cos(a)*(R - 16*DPR);
    const ly = CY + Math.sin(a)*(R - 16*DPR);
    const major = lbl.length===1;
    ctx.fillStyle = major?'rgba(34,255,102,0.95)':'rgba(34,255,102,0.45)';
    ctx.font = `${(major?20:13)*DPR}px 'VT323',monospace`;
    ctx.fillText(lbl, lx, ly);
    ctx.strokeStyle = major?'rgba(34,255,102,0.7)':'rgba(34,255,102,0.3)';
    ctx.lineWidth=(major?2:1)*DPR;
    ctx.beginPath();
    ctx.moveTo(CX+Math.cos(a)*R, CY+Math.sin(a)*R);
    ctx.lineTo(CX+Math.cos(a)*(R-(major?12:7)*DPR), CY+Math.sin(a)*(R-(major?12:7)*DPR));
    ctx.stroke();
  });
}

function drawSweep(){
  const a = sweepAngle - Math.PI/2;
  ctx.save();
  ctx.beginPath();ctx.arc(CX,CY,R,0,Math.PI*2);ctx.clip();
  const steps = 40, span = Math.PI/3;
  for(let i=0;i<steps;i++){
    const t = i/steps;
    const a0 = a - span*t;
    const a1 = a - span*(t+1/steps);
    ctx.beginPath();
    ctx.moveTo(CX,CY);
    ctx.arc(CX,CY,R,a0,a1,true);
    ctx.closePath();
    ctx.fillStyle = `rgba(34,255,102,${0.18*(1-t)})`;
    ctx.fill();
  }
  ctx.strokeStyle='rgba(120,255,160,0.9)';
  ctx.lineWidth=2*DPR;
  ctx.beginPath();ctx.moveTo(CX,CY);
  ctx.lineTo(CX+Math.cos(a)*R, CY+Math.sin(a)*R);ctx.stroke();
  ctx.restore();
}

function drawFlights(){
  if(!user) return;
  let shown=0;
  screenBlips = [];
  const sweepUp = sweepAngle;
  flights.forEach(f=>{
    const p = project(f.lat,f.lon);
    if(p.distKm>rangeKm) return;
    shown++;
    screenBlips.push({id:f.id, x:p.x, y:p.y});
    const isSel = (f.id===selectedId);

    let blipAng = Math.atan2(p.x-CX, -(p.y-CY));
    if(blipAng<0) blipAng += Math.PI*2;
    let diff = sweepUp - blipAng;
    if(diff<0) diff += Math.PI*2;
    let fade = Math.max(0.25, 1 - diff/(Math.PI*2));
    if(isSel) fade = 1;

    const [cr,cg,cb] = altColor(f.altFt||0);

    if(isSel){
      ctx.strokeStyle='rgba(200,255,216,0.9)';
      ctx.lineWidth=1.5*DPR;
      ctx.beginPath();ctx.arc(p.x,p.y,13*DPR,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();
      const b=13*DPR, c=5*DPR;
      [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx,sy])=>{
        ctx.moveTo(p.x+sx*b, p.y+sy*b - sy*c);
        ctx.lineTo(p.x+sx*b, p.y+sy*b);
        ctx.lineTo(p.x+sx*b - sx*c, p.y+sy*b);
      });
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(p.x,p.y);
    ctx.rotate(((f.track||0) - heading)*Math.PI/180);
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${fade})`;
    ctx.shadowColor=`rgba(${cr},${cg},${cb},${fade})`;
    ctx.shadowBlur=(isSel?12:8)*DPR*fade;
    ctx.beginPath();
    const s=(isSel?7:6)*DPR;
    ctx.moveTo(0,-s);
    ctx.lineTo(s*0.6,s*0.7);
    ctx.lineTo(0,s*0.35);
    ctx.lineTo(-s*0.6,s*0.7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    if(fade>0.5 || isSel){
      ctx.shadowBlur=0;
      ctx.font=`${(isSel?13:12)*DPR}px 'Share Tech Mono',monospace`;
      ctx.textAlign='left';ctx.textBaseline='middle';
      const lbl = (f.call||f.reg||'----') + (f.altFt?('  '+Math.round(f.altFt/100)):'');
      const tw = ctx.measureText(lbl).width;
      const lx = p.x+12*DPR, ly = p.y;
      // dark backing pill for legibility against rings/sweep
      ctx.fillStyle='rgba(2,10,2,0.72)';
      ctx.fillRect(lx-3*DPR, ly-8*DPR, tw+6*DPR, 16*DPR);
      ctx.fillStyle=`rgba(${cr},${cg},${cb},${isSel?1:Math.max(0.75,fade)})`;
      ctx.fillText(lbl, lx, ly);
    }
  });
  contactsEl.textContent = shown;

  if(selectedId && flights.some(f=>f.id===selectedId)){
    updateCard(flights.find(f=>f.id===selectedId));
  }
}

/* ---------- animation loop ---------- */
let last=performance.now();
let lastHeadingLabel='';
function loop(now){
  const dt=(now-last)/1000; last=now;
  sweepAngle = (sweepAngle + dt*Math.PI*2/CFG.sweepSeconds) % (Math.PI*2);

  // Smooth the displayed heading toward the validated target. The filter is
  // deliberately heavy: noise is rejected upstream in onOrient, and here the
  // motion is eased slowly with a deadband and a slew-rate cap so the scope
  // glides instead of twitching.
  if(compassOn && headingHasFix){
    const cfg = CFG.compass || {};
    const diff = angDiff(heading, headingTarget);
    const adiff = Math.abs(diff);
    if(adiff < (cfg.deadbandDeg||1.5)){
      // within deadband: hold position, no movement (kills micro-jitter)
    } else {
      const s = cfg.smoothing!=null ? cfg.smoothing : 0.92;
      // exponential ease, frame-rate independent. Higher s = slower.
      const k = 1 - Math.pow(1 - (1 - s), dt*60); // ~ (1-s) per 1/60s
      let step = diff * k;
      // cap slew rate so even a confirmed big turn sweeps smoothly, not instantly
      const maxStep = (cfg.maxStepDegPerSec||90) * dt;
      if(step >  maxStep) step =  maxStep;
      if(step < -maxStep) step = -maxStep;
      heading = (heading + step + 360) % 360;
    }
    const lbl = headingLabel(heading);
    if(lbl!==lastHeadingLabel){ headingEl.textContent=lbl; lastHeadingLabel=lbl; }
  }

  draw();
  requestAnimationFrame(loop);
}

/* ---------- flight data (proxy + multi-source, CORS-tolerant) ---------- */
let activeUrl = null;        // remembered last-working endpoint URL
function mapAircraft(ac){
  return ac.filter(a=>a.lat!=null && a.lon!=null && (a.alt_baro!=='ground'))
    .map(a=>{
      const altFt = (typeof a.alt_baro==='number') ? a.alt_baro
                  : (typeof a.alt_geom==='number') ? a.alt_geom : 0;
      return {
        id: a.hex,
        call: (a.flight||'').trim(),
        reg: a.r || '',
        type: a.t || '',
        lat: a.lat, lon: a.lon,
        altFt: altFt,
        altGround: a.alt_baro==='ground',
        gs: a.gs!=null? a.gs : null,
        track: (a.track!=null)? a.track : (a.true_heading||0),
        vert: a.baro_rate!=null? a.baro_rate : (a.geom_rate||0),
        squawk: a.squawk || '',
        category: a.category || '',
        emergency: (a.emergency && a.emergency!=='none') ? a.emergency : '',
        navModes: Array.isArray(a.nav_modes)? a.nav_modes : [],
        selAlt: a.nav_altitude_mcp!=null? a.nav_altitude_mcp : null,
        seen: a.seen!=null? a.seen : null,
        rssi: a.rssi!=null? a.rssi : null
      };
    });
}
async function tryFetch(url){
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(), CFG.fetchTimeoutMs);
  try{
    const res = await fetch(url,{cache:'no-store',signal:ctrl.signal,headers:{'Accept':'application/json'}});
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data = await res.json();
    const ac = data.ac || data.aircraft;
    if(!ac) throw new Error('no ac field');
    return ac;
  } finally {
    clearTimeout(t);
  }
}
async function fetchFlights(){
  if(!user || fetchInProgress) return;
  fetchInProgress = true;
  const r = Math.min(CFG.maxRadiusNm, Math.ceil(rangeKm/1.852));
  const lat = user.lat.toFixed(4), lon = user.lon.toFixed(4);

  const candidates = CFG.sources.map(s=>({
    name: s.name,
    url: s.url.replace('{lat}',lat).replace('{lon}',lon).replace('{r}',r)
  }));

  // remembered last-working source first
  const ordered = activeUrl
    ? [...candidates.filter(c=>c.url===activeUrl), ...candidates.filter(c=>c.url!==activeUrl)]
    : candidates;

  let lastErr = null;
  for(const c of ordered){
    try{
      const ac = await tryFetch(c.url);
      flights = mapAircraft(ac);
      activeUrl = c.url;
      const d=new Date();
      lastupdEl.textContent = d.toTimeString().slice(0,8);
      setStatus(null);
      renderList();
      fetchInProgress=false;
      return;
    }catch(e){ lastErr = e; }
  }
  activeUrl = null;
  lastupdEl.textContent='ERR';
  if(flights.length===0){
    const why = (lastErr && /abort/i.test(lastErr.message)) ? 'TIMEOUT' : 'CORS/NET';
    setStatus('NO FLIGHT FEED ('+why+') — RETRYING…');
  }
  fetchInProgress=false;
}

/* ---------- geolocation ---------- */
function initGeo(){
  if(!navigator.geolocation){
    setStatus('GEOLOCATION UNAVAILABLE');
    user={lat:CFG.fallback.lat,lon:CFG.fallback.lon};
    locLabel.textContent=CFG.fallback.label;
    afterFix();
    return;
  }
  setStatus('ACQUIRING POSITION…');
  navigator.geolocation.getCurrentPosition(
    pos=>{
      user={lat:pos.coords.latitude,lon:pos.coords.longitude};
      locLabel.textContent = fmtCoord(user.lat,user.lon);
      afterFix();
    },
    ()=>{
      setStatus('POSITION DENIED — USING DEFAULT', true);
      user={lat:CFG.fallback.lat,lon:CFG.fallback.lon};
      locLabel.textContent=CFG.fallback.label;
      afterFix();
    },
    {enableHighAccuracy:true,timeout:10000,maximumAge:30000}
  );
  navigator.geolocation.watchPosition(pos=>{
    user={lat:pos.coords.latitude,lon:pos.coords.longitude};
    locLabel.textContent=fmtCoord(user.lat,user.lon);
  },()=>{},{enableHighAccuracy:true,maximumAge:15000});
}
function fmtCoord(lat,lon){
  const ns=lat>=0?'N':'S', ew=lon>=0?'E':'W';
  return `${Math.abs(lat).toFixed(3)}°${ns} ${Math.abs(lon).toFixed(3)}°${ew}`;
}
let fetchTimer=null;
function afterFix(){
  fetchFlights();
  if(fetchTimer) clearInterval(fetchTimer);
  fetchTimer = setInterval(fetchFlights, CFG.refreshMs);
}

/* ---------- compass ---------- */
function headingLabel(h){
  const dirs=['N','NE','E','SE','S','SW','W','NW'];
  const d=dirs[Math.round(h/45)%8];
  return `${d} ${String(Math.round(h)).padStart(3,'0')}°`;
}
// shortest signed angular difference a->b, in degrees (-180..180)
function angDiff(a,b){
  let d=(b-a)%360;
  if(d>180) d-=360; else if(d<-180) d+=360;
  return d;
}
function onOrient(e){
  let h = null;
  if(e.webkitCompassHeading!=null) h = e.webkitCompassHeading;   // iOS: already true/clockwise
  else if(e.alpha!=null) h = 360 - e.alpha;                       // others: derive from alpha
  if(h==null || isNaN(h)) return;
  // correct for screen rotation so heading stays right in landscape
  const so = (screen.orientation && typeof screen.orientation.angle==='number')
    ? screen.orientation.angle : (window.orientation||0);
  h = ((h + so) % 360 + 360) % 360;

  if(!headingHasFix){                 // first reading: accept immediately
    heading = h; headingTarget = h; headingHasFix = true;
    rawCandidate = null; rawCandidateCount = 0;
    return;
  }

  const cfg = CFG.compass || {};
  const jump = Math.abs(angDiff(headingTarget, h));

  if(jump <= (cfg.outlierDeg||35)){
    // plausible: accept as the new target, clear any probation
    headingTarget = h;
    rawCandidate = null; rawCandidateCount = 0;
  } else {
    // implausibly large jump: hold it under probation. Only accept once
    // several consecutive readings confirm the device really turned there.
    if(rawCandidate!=null && Math.abs(angDiff(rawCandidate, h)) < (cfg.outlierDeg||35)){
      rawCandidateCount++;
      rawCandidate = h;
      if(rawCandidateCount >= (cfg.outlierConfirmCount||6)){
        headingTarget = h;            // confirmed real turn
        rawCandidate = null; rawCandidateCount = 0;
      }
    } else {
      rawCandidate = h; rawCandidateCount = 1;   // start a new probation
    }
    // while under probation, headingTarget is left unchanged -> spike ignored
  }
}
async function toggleCompass(){
  if(compassOn){
    window.removeEventListener('deviceorientationabsolute',onOrient);
    window.removeEventListener('deviceorientation',onOrient);
    compassOn=false; headingTarget=0; headingHasFix=false;
    rawCandidate=null; rawCandidateCount=0;
    compassBtn.classList.remove('on');
    headingEl.textContent='N 000°';
    return;
  }
  try{
    if(typeof DeviceOrientationEvent!=='undefined' &&
       typeof DeviceOrientationEvent.requestPermission==='function'){
      const p = await DeviceOrientationEvent.requestPermission();
      if(p!=='granted'){ setStatus('COMPASS DENIED',true); setTimeout(()=>setStatus(null),1500); return; }
    }
    if('ondeviceorientationabsolute' in window)
      window.addEventListener('deviceorientationabsolute',onOrient);
    window.addEventListener('deviceorientation',onOrient);
    compassOn=true;
    compassBtn.classList.add('on');
  }catch(err){
    setStatus('COMPASS UNAVAILABLE',true);
    setTimeout(()=>setStatus(null),1500);
  }
}

/* ---------- contact card / tap ---------- */
function updateCard(f){
  if(!f) return;
  const p = project(f.lat,f.lon);
  const brg = bearingTo(f.lat,f.lon);
  const dec = decodeCallsign(f.call);
  document.getElementById('cCall').textContent = f.call || f.reg || (f.id||'').toUpperCase() || '--------';
  // airline + flight subtitle (e.g. "Air Canada · Flight 123")
  const sub = document.getElementById('cAirline');
  sub.textContent = dec.airline ? `${dec.airline} · Flight ${dec.flightNo}` : '';
  // route line is populated asynchronously by lookupRoute(); hide stale content
  if(routeEl && (!window._routeForId || window._routeForId!==f.id)){
    routeEl.classList.add('hide'); routeEl.innerHTML='';
  }
  window._routeForId = f.id;
  document.getElementById('cAlt').textContent  = f.altFt ? f.altFt.toLocaleString()+' ft' : '—';
  document.getElementById('cSpd').textContent  = f.gs!=null ? Math.round(f.gs)+' kt' : '—';
  document.getElementById('cTrk').textContent  = f.track!=null ? compassPt(f.track)+' '+String(Math.round(f.track)).padStart(3,'0')+'°' : '—';
  const vr = f.vert||0;
  document.getElementById('cVrt').textContent  = Math.abs(vr)<50 ? 'LEVEL' : (vr>0?'▲ ':'▼ ')+Math.abs(Math.round(vr))+' fpm';
  document.getElementById('cRng').textContent  = p.distKm.toFixed(1)+' km';
  document.getElementById('cBrg').textContent  = compassPt(brg)+' '+String(Math.round(brg)).padStart(3,'0')+'°';
  document.getElementById('cTyp').textContent  = typeName(f.type) || f.type || '—';
  document.getElementById('cCat').textContent  = catLabel(f.category) || '—';
  document.getElementById('cReg').textContent  = f.reg || '—';
  document.getElementById('cSqk').textContent  = f.squawk || '—';
  const apModes = (f.navModes||[]).filter(m=>['autopilot','althold','lnav','vnav','approach','tcas'].includes(m));
  document.getElementById('cAp').textContent = apModes.length ? apModes.join(' ').toUpperCase() : '—';
  document.getElementById('cSig').textContent = f.seen!=null ? (f.seen<1?'live':Math.round(f.seen)+'s ago')+(f.rssi!=null?` · ${f.rssi}dB`:'') : '—';
  document.getElementById('cIcao').textContent = (f.id||'—').toUpperCase();
  // emergency highlight on callsign
  document.getElementById('cCall').style.color = f.emergency ? 'var(--amber)' : '';
}
function openCard(f){ selectedId=f.id; updateCard(f); card.classList.remove('hide'); renderList(); lookupRoute(f); }
function closeCard(){ selectedId=null; card.classList.add('hide'); renderList(); }
document.getElementById('cardClose').addEventListener('click',closeCard);

/* ---------- route lookup (origin -> destination) ----------
   ADS-B doesn't broadcast routes; adsb.lol offers a best-effort lookup by
   callsign. Fired only on tap, cached, and shown only if it resolves. */
const routeCache = new Map();   // callsign -> {origin, dest} | 'none'

function showRoute(state){
  if(!CFG.route || !CFG.route.enabled){ routeEl.classList.add('hide'); return; }
  if(state==='loading'){
    routeEl.classList.remove('hide');
    routeEl.innerHTML = `<span class="pending">◌ LOOKING UP ROUTE…</span>`;
  } else if(state && state.origin){
    routeEl.classList.remove('hide');
    const o=state.origin, d=state.dest||{};
    routeEl.innerHTML =
      `<span class="ap"><span class="code">${o.code||'???'}</span><span class="city">${o.city||o.name||''}</span></span>`+
      `<span class="arrow">→</span>`+
      `<span class="ap dest"><span class="code">${d.code||'???'}</span><span class="city">${d.city||d.name||''}</span></span>`;
  } else {
    routeEl.classList.add('hide');  // no route available: stay clean
  }
}

function parseRoute(rec){
  if(!rec) return null;
  // adsb.lol returns _airports: [origin, ..., destination]
  const aps = rec._airports || rec.airports;
  if(Array.isArray(aps) && aps.length>=2){
    const o=aps[0], d=aps[aps.length-1];
    const fmt=a=>({
      code:a.iata||a.icao||'',
      city:(a.location||a.name||'').split(',')[0],
      name:a.name||''
    });
    return {origin:fmt(o), dest:fmt(d)};
  }
  // fallback: "CYYZ-KORD" style code string
  const codes = rec.airport_codes || rec.route;
  if(typeof codes==='string' && codes.includes('-')){
    const parts=codes.split('-');
    return {origin:{code:parts[0]}, dest:{code:parts[parts.length-1]}};
  }
  return null;
}

async function lookupRoute(f){
  if(!CFG.route || !CFG.route.enabled){ routeEl.classList.add('hide'); return; }
  const cs = (f.call||'').trim();
  if(!cs){ showRoute(null); return; }      // no callsign -> no route possible
  if(routeCache.has(cs)){
    const c=routeCache.get(cs);
    if(f.id===selectedId) showRoute(c==='none'?null:c);
    return;
  }
  if(f.id===selectedId) showRoute('loading');
  try{
    const ctrl=new AbortController();
    const to=setTimeout(()=>ctrl.abort(), CFG.route.timeoutMs);
    const res=await fetch(CFG.route.url,{
      method:'POST', cache:'no-store', signal:ctrl.signal,
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ planes:[{ callsign:cs, lat:f.lat, lng:f.lon }] })
    });
    clearTimeout(to);
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data=await res.json();
    const arr=Array.isArray(data)?data:(data.planes||[]);
    const route=parseRoute(arr[0]);
    routeCache.set(cs, route||'none');
    if(f.id===selectedId) showRoute(route);
  }catch(e){
    routeCache.set(cs,'none');           // cache the miss so we don't retry on every open
    if(f.id===selectedId) showRoute(null);
  }
}

function handleTap(clientX,clientY){
  const rect = cv.getBoundingClientRect();
  const x=(clientX-rect.left)*DPR, y=(clientY-rect.top)*DPR;
  let best=null, bestD=Infinity;
  const hitR = 26*DPR;
  screenBlips.forEach(b=>{
    const d=Math.hypot(b.x-x,b.y-y);
    if(d<hitR && d<bestD){ bestD=d; best=b; }
  });
  if(best){
    const f = flights.find(fl=>fl.id===best.id);
    if(f) openCard(f);
  } else {
    closeCard();
  }
}
cv.addEventListener('click', e=>handleTap(e.clientX,e.clientY));

/* ---------- contacts list panel ---------- */
const listEl = document.getElementById('list');
const listBody = document.getElementById('listBody');
const listTitle = document.getElementById('listTitle');
const listSortBtn = document.getElementById('listSort');
const SORTS = ['RANGE','ALT','SPEED','CALL'];
let sortIdx = 0;

// ADS-B emitter category -> readable class
const CAT = {
  A0:'No info',A1:'Light',A2:'Small',A3:'Large',A4:'High-vortex',
  A5:'Heavy',A6:'High-perf',A7:'Rotorcraft',
  B1:'Glider',B2:'Balloon/airship',B3:'Parachute',B4:'Ultralight',
  B6:'UAV/drone',B7:'Spacecraft',
  C1:'Emergency veh.',C2:'Service veh.',C3:'Obstruction'
};
function catLabel(c){ return CAT[c] || ''; }

// --- airline + type decoding (from js/lookups.js) ---
const LK = window.RADAR_LOOKUPS || {airlines:{},types:{}};
// "ACA123" -> { airline:'Air Canada', flightNo:'123' }. Registrations
// (e.g. "C-GABC", "N172SP") aren't airline callsigns -> no airline.
function decodeCallsign(call){
  if(!call) return {airline:'', flightNo:''};
  const m = call.match(/^([A-Z]{3})(\d[A-Z0-9]*)$/);
  if(m && LK.airlines[m[1]]) return {airline:LK.airlines[m[1]], flightNo:m[2]};
  return {airline:'', flightNo:''};
}
function typeName(code){ return (code && LK.types[code]) ? LK.types[code] : (code||''); }
// Friendly one-line operator + flight, falling back gracefully.
function operatorLine(f){
  const d = decodeCallsign(f.call);
  if(d.airline) return `${d.airline} ${d.flightNo}`;
  return f.call || f.reg || (f.id||'').toUpperCase();
}

function altText(f){
  if(f.altGround) return 'GND';
  if(!f.altFt) return '—';
  return f.altFt>=18000 ? 'FL'+Math.round(f.altFt/100) : f.altFt.toLocaleString()+'ft';
}
function vertGlyph(vr){
  if(vr==null || Math.abs(vr)<50) return '→';
  return vr>0 ? '↑' : '↓';
}

function sortedFlights(){
  const arr = flights.map(f=>({f, d:project(f.lat,f.lon).distKm}));
  const s = SORTS[sortIdx];
  arr.sort((a,b)=>{
    if(s==='RANGE') return a.d-b.d;
    if(s==='ALT')   return (b.f.altFt||0)-(a.f.altFt||0);
    if(s==='SPEED') return (b.f.gs||0)-(a.f.gs||0);
    if(s==='CALL')  return (a.f.call||a.f.reg||'zzzz').localeCompare(b.f.call||b.f.reg||'zzzz');
    return 0;
  });
  return arr;
}

function renderList(){
  if(listEl.classList.contains('hide')) return;
  const rows = sortedFlights();
  listTitle.textContent = `CONTACTS · ${rows.length}`;
  if(!rows.length){
    listBody.innerHTML = `<div class="list-empty">NO CONTACTS IN RANGE<br><br>Try increasing RANGE, or wait for the next sweep.</div>`;
    return;
  }
  const html = rows.map(({f,d})=>{
    const brg = bearingTo(f.lat,f.lon);
    const sel = f.id===selectedId ? ' sel':'';
    const emerg = f.emergency ? ' emerg':'';
    const cat = catLabel(f.category);
    const vr = f.vert||0;
    const dec = decodeCallsign(f.call);
    const model = typeName(f.type);
    const ap = f.navModes && f.navModes.includes('autopilot') ? '<span class="badge">AP</span>' : '';
    const emergBadge = f.emergency ? `<span class="badge amber">${f.emergency.toUpperCase()}</span>` : '';
    // headline: airline + flight no if known, else raw callsign/reg
    const head = dec.airline ? `${dec.airline} ${dec.flightNo}` : (f.call||f.reg||f.id.toUpperCase());
    // secondary line: model (+ class), else type code, else class
    const typeLine = model || (cat ? cat : '');
    return `<div class="lrow${sel}${emerg}" data-id="${f.id}">
      <div class="lrow-top">
        <span class="lrow-call">${head}${emergBadge}${ap}</span>
        <span class="lrow-alt">${altText(f)} ${vertGlyph(vr)}</span>
      </div>
      ${typeLine?`<div class="lrow-type">${typeLine}${f.reg&&dec.airline?' · '+f.reg:''}</div>`:''}
      <div class="lrow-meta">
        <span><b>${d.toFixed(0)}</b> km · ${compassPt(brg)}</span>
        <span><b>${f.gs!=null?Math.round(f.gs):'—'}</b> kt</span>
        <span>HDG <b>${String(Math.round(f.track||0)).padStart(3,'0')}°</b></span>
        ${f.squawk?`<span>SQ <b>${f.squawk}</b></span>`:''}
      </div>
      <div class="lrow-bar" style="width:${Math.max(8,100-Math.min(100,d/rangeKm*100)).toFixed(0)}%"></div>
    </div>`;
  }).join('');
  listBody.innerHTML = html;
}

listBody.addEventListener('click', e=>{
  const row = e.target.closest('.lrow');
  if(!row) return;
  const f = flights.find(fl=>fl.id===row.dataset.id);
  if(f){
    selectedId = f.id;
    updateCard(f); card.classList.remove('hide');
    renderList();
  }
});
function openList(){ listEl.classList.remove('hide'); renderList(); }
function closeList(){ listEl.classList.add('hide'); }
document.getElementById('listBtn').addEventListener('click', ()=>{
  listEl.classList.contains('hide') ? openList() : closeList();
});
document.getElementById('listClose').addEventListener('click', closeList);
listSortBtn.addEventListener('click', ()=>{
  sortIdx = (sortIdx+1)%SORTS.length;
  listSortBtn.textContent = 'SORT: '+SORTS[sortIdx];
  renderList();
});

/* ---------- clock ---------- */
function tick(){
  const d=new Date();
  document.getElementById('clock').textContent=d.toTimeString().slice(0,8);
  document.getElementById('zulu').textContent='ZULU '+d.toISOString().slice(11,16);
}

/* ---------- controls ---------- */
rangeIn.addEventListener('input',()=>{
  rangeKm=parseInt(rangeIn.value,10);
  rangeVal.textContent=rangeKm+' km';
});
rangeIn.addEventListener('change',()=>{ fetchFlights(); });
compassBtn.addEventListener('click',toggleCompass);
recenterBtn.addEventListener('click',()=>{ initGeo(); });

/* ---------- boot ---------- */
function boot(){
  resize();
  rangeVal.textContent=rangeKm+' km';
  tick(); setInterval(tick,1000);
  requestAnimationFrame(loop);
  initGeo();
}
boot();
})();
