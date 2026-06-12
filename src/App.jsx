import { useState, useEffect, useCallback, useRef } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
// Env vars from Vercel; fallback values are placeholders only.
const SUPABASE_URL = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) || "";
const SUPABASE_KEY = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_KEY) || "";
// On deploy the football-data.org API is proxied through /api/matches
// (a Vercel serverless function in /api/matches.js) — frontend never sees the API key.
const API_BASE = "/api/matches";

const TROPHY_SVG = `<svg fill="currentColor" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><g><g><path d="M384,449.963v-12.629c0-17.643-14.357-32-32-32h-15.104c-19.989-34.176-27.52-93.973-27.563-127.659c3.349-6.059,6.549-11.712,9.237-16.341c17.557-30.379,44.096-99.072,44.096-133.333v-4.821c0-5.845-0.043-10.368-0.192-14.336c0.085-0.619,0.192-1.707,0.192-2.176C362.667,47.851,314.816,0,256,0S149.333,47.851,149.333,106.667c0,13.141,2.645,25.835,7.211,37.717c0.043,0.213-0.021,0.427,0.021,0.64l46.763,185.728c-9.493,31.317-23.019,62.037-28.779,74.581H160c-17.643,0-32,14.357-32,32v12.629c-12.395,4.416-21.333,16.149-21.333,30.037v21.333c0,5.888,4.779,10.667,10.667,10.667h277.333c5.888,0,10.667-4.779,10.667-10.667V480C405.333,466.112,396.395,454.379,384,449.963z M256,21.333c40.107,0,73.579,27.883,82.709,64.747c-9.323,1.856-12.672,12.373-16.704,27.072c-1.792,6.528-3.691,12.843-5.76,18.859c-6.677-14.912-21.568-25.344-38.912-25.344c-18.667,0-34.389,12.117-40.171,28.843c-2.453-5.333-4.843-10.965-7.232-17.003c-7.04-17.792-13.12-33.173-27.285-33.173c-4.117,0-7.851,1.771-10.496,4.992c-7.296,8.875-5.269,28.096,3.819,76.352c-15.936-15.744-25.301-37.141-25.301-60.011C170.667,59.605,208.939,21.333,256,21.333z M298.667,149.333c0,11.755-9.557,21.333-21.333,21.333S256,161.088,256,149.333c0-11.755,9.557-21.333,21.333-21.333S298.667,137.579,298.667,149.333z M189.76,189.483c3.84,3.051,7.893,5.845,12.203,8.384c5.717,29.824,11.371,61.099,11.371,79.467c0,1.536-0.149,3.221-0.235,4.821L189.76,189.483z M234.667,277.333c0-22.933-7.168-59.904-14.101-95.659c-3.243-16.789-7.189-37.035-9.536-53.035c9.472,23.893,23.829,56.832,56.939,62.251c3.029,0.683,6.144,1.109,9.365,1.109c3.392,0,6.656-0.491,9.835-1.259c34.816-6.123,47.445-43.371,54.165-67.435V128c0,27.157-23.061,91.2-42.219,124.373C285.12,276.565,256,326.912,256,373.333c0,5.888,4.779,10.667,10.667,10.667s10.667-4.779,10.667-10.667c0-18.496,5.717-38.229,13.184-56.619c3.136,28.309,9.664,62.016,22.08,88.619H197.952C210.347,377.365,234.667,317.333,234.667,277.333z M149.333,437.333c0-5.888,4.8-10.667,10.667-10.667h192c5.867,0,10.667,4.779,10.667,10.667V448H149.333V437.333z M384,490.667H128V480c0-5.888,4.8-10.667,10.667-10.667h234.667C379.2,469.333,384,474.112,384,480V490.667z"/></g></g></svg>`;

const FLAG_URL = (code) => `https://flagcdn.com/24x18/${code}.png`;

const TEAM_FLAGS = {
  Mexico:"mx","South Africa":"za","South Korea":"kr",Czechia:"cz",
  Canada:"ca","Bosnia & Herzegovina":"ba",Qatar:"qa",Switzerland:"ch",
  Brazil:"br",Morocco:"ma",Haiti:"ht",Scotland:"gb-sct",
  "United States":"us",Paraguay:"py",Australia:"au",Turkiye:"tr",
  Germany:"de",Curacao:"cw","Cote d'Ivoire":"ci",Ecuador:"ec",
  Netherlands:"nl",Japan:"jp",Sweden:"se",Tunisia:"tn",
  Belgium:"be",Egypt:"eg",Iran:"ir","New Zealand":"nz",
  Spain:"es","Cabo Verde":"cv","Saudi Arabia":"sa",Uruguay:"uy",
  France:"fr",Senegal:"sn",Iraq:"iq",Norway:"no",
  Argentina:"ar",Algeria:"dz",Austria:"at",Jordan:"jo",
  Portugal:"pt","Congo DR":"cd",Uzbekistan:"uz",Colombia:"co",
  England:"gb-eng",Croatia:"hr",Ghana:"gh",Panama:"pa",
};

// Map API team names to our app team names
const API_NAME_MAP = {
  "Mexico":"Mexico","South Africa":"South Africa","Korea Republic":"South Korea","Czechia":"Czechia",
  "Canada":"Canada","Bosnia and Herzegovina":"Bosnia & Herzegovina","Qatar":"Qatar","Switzerland":"Switzerland",
  "Brazil":"Brazil","Morocco":"Morocco","Haiti":"Haiti","Scotland":"Scotland",
  "USA":"United States","United States":"United States","Paraguay":"Paraguay","Australia":"Australia","Türkiye":"Turkiye","Turkey":"Turkiye",
  "Germany":"Germany","Curaçao":"Curacao","Curacao":"Curacao","Côte d'Ivoire":"Cote d'Ivoire","Ivory Coast":"Cote d'Ivoire","Ecuador":"Ecuador",
  "Netherlands":"Netherlands","Japan":"Japan","Sweden":"Sweden","Tunisia":"Tunisia",
  "Belgium":"Belgium","Egypt":"Egypt","IR Iran":"Iran","Iran":"Iran","New Zealand":"New Zealand",
  "Spain":"Spain","Cape Verde":"Cabo Verde","Saudi Arabia":"Saudi Arabia","Uruguay":"Uruguay",
  "France":"France","Senegal":"Senegal","Iraq":"Iraq","Norway":"Norway",
  "Argentina":"Argentina","Algeria":"Algeria","Austria":"Austria","Jordan":"Jordan",
  "Portugal":"Portugal","DR Congo":"Congo DR","Uzbekistan":"Uzbekistan","Colombia":"Colombia",
  "England":"England","Croatia":"Croatia","Ghana":"Ghana","Panama":"Panama",
};

function Flag({ team, size = 16 }) {
  const code = TEAM_FLAGS[team];
  if (!code) return null;
  return <img src={FLAG_URL(code)} alt={team} style={{ width: size * 1.33, height: size, objectFit: "cover", borderRadius: 2, flexShrink: 0, display: "inline-block", verticalAlign: "middle" }} onError={e => e.target.style.display="none"} />;
}

const GROUPS = {
  A:{ teams:["Mexico","South Africa","South Korea","Czechia"], matches:[["Mexico","South Africa"],["South Korea","Czechia"],["Mexico","South Korea"],["South Africa","Czechia"],["Mexico","Czechia"],["South Africa","South Korea"]] },
  B:{ teams:["Canada","Bosnia & Herzegovina","Qatar","Switzerland"], matches:[["Canada","Bosnia & Herzegovina"],["Qatar","Switzerland"],["Canada","Qatar"],["Bosnia & Herzegovina","Switzerland"],["Canada","Switzerland"],["Bosnia & Herzegovina","Qatar"]] },
  C:{ teams:["Brazil","Morocco","Haiti","Scotland"], matches:[["Brazil","Morocco"],["Haiti","Scotland"],["Brazil","Haiti"],["Morocco","Scotland"],["Brazil","Scotland"],["Morocco","Haiti"]] },
  D:{ teams:["United States","Paraguay","Australia","Turkiye"], matches:[["United States","Paraguay"],["Australia","Turkiye"],["United States","Australia"],["Paraguay","Turkiye"],["United States","Turkiye"],["Paraguay","Australia"]] },
  E:{ teams:["Germany","Curacao","Cote d'Ivoire","Ecuador"], matches:[["Germany","Curacao"],["Cote d'Ivoire","Ecuador"],["Germany","Cote d'Ivoire"],["Curacao","Ecuador"],["Germany","Ecuador"],["Curacao","Cote d'Ivoire"]] },
  F:{ teams:["Netherlands","Japan","Sweden","Tunisia"], matches:[["Netherlands","Japan"],["Sweden","Tunisia"],["Netherlands","Sweden"],["Japan","Tunisia"],["Netherlands","Tunisia"],["Japan","Sweden"]] },
  G:{ teams:["Belgium","Egypt","Iran","New Zealand"], matches:[["Belgium","Egypt"],["Iran","New Zealand"],["Belgium","Iran"],["Egypt","New Zealand"],["Belgium","New Zealand"],["Egypt","Iran"]] },
  H:{ teams:["Spain","Cabo Verde","Saudi Arabia","Uruguay"], matches:[["Spain","Cabo Verde"],["Saudi Arabia","Uruguay"],["Spain","Saudi Arabia"],["Cabo Verde","Uruguay"],["Spain","Uruguay"],["Cabo Verde","Saudi Arabia"]] },
  I:{ teams:["France","Senegal","Iraq","Norway"], matches:[["France","Senegal"],["Iraq","Norway"],["France","Iraq"],["Senegal","Norway"],["France","Norway"],["Senegal","Iraq"]] },
  J:{ teams:["Argentina","Algeria","Austria","Jordan"], matches:[["Argentina","Algeria"],["Austria","Jordan"],["Argentina","Austria"],["Algeria","Jordan"],["Argentina","Jordan"],["Algeria","Austria"]] },
  K:{ teams:["Portugal","Congo DR","Uzbekistan","Colombia"], matches:[["Portugal","Congo DR"],["Uzbekistan","Colombia"],["Portugal","Uzbekistan"],["Congo DR","Colombia"],["Portugal","Colombia"],["Congo DR","Uzbekistan"]] },
  L:{ teams:["England","Croatia","Ghana","Panama"], matches:[["England","Croatia"],["Ghana","Panama"],["England","Ghana"],["Croatia","Panama"],["England","Panama"],["Croatia","Ghana"]] },
};

const R32_MATCHES = [
  { id:73, label:"Match 73", home:{group:"A",pos:"runner"}, away:{group:"B",pos:"runner"} },
  { id:74, label:"Match 74", home:{group:"E",pos:"winner"}, away:{pos:"third",from:"A/B/C/D/F"} },
  { id:75, label:"Match 75", home:{group:"F",pos:"winner"}, away:{group:"C",pos:"runner"} },
  { id:76, label:"Match 76", home:{group:"C",pos:"winner"}, away:{group:"F",pos:"runner"} },
  { id:77, label:"Match 77", home:{group:"I",pos:"winner"}, away:{pos:"third",from:"C/D/F/G/H"} },
  { id:78, label:"Match 78", home:{group:"E",pos:"runner"}, away:{group:"I",pos:"runner"} },
  { id:79, label:"Match 79", home:{group:"A",pos:"winner"}, away:{pos:"third",from:"C/E/F/H/I"} },
  { id:80, label:"Match 80", home:{group:"L",pos:"winner"}, away:{pos:"third",from:"E/H/I/J/K"} },
  { id:81, label:"Match 81", home:{group:"D",pos:"winner"}, away:{pos:"third",from:"B/E/F/I/J"} },
  { id:82, label:"Match 82", home:{group:"G",pos:"winner"}, away:{pos:"third",from:"A/E/H/I/J"} },
  { id:83, label:"Match 83", home:{group:"K",pos:"runner"}, away:{group:"L",pos:"runner"} },
  { id:84, label:"Match 84", home:{group:"H",pos:"winner"}, away:{group:"J",pos:"runner"} },
  { id:85, label:"Match 85", home:{group:"B",pos:"winner"}, away:{pos:"third",from:"E/F/G/I/J"} },
  { id:86, label:"Match 86", home:{group:"J",pos:"winner"}, away:{group:"H",pos:"runner"} },
  { id:87, label:"Match 87", home:{group:"K",pos:"winner"}, away:{pos:"third",from:"D/E/I/J/L"} },
  { id:88, label:"Match 88", home:{group:"G",pos:"runner"}, away:{group:"B",pos:"runner"} },
];

// ── Standings Engine ──────────────────────────────────────────────────────────
function calcStandings(groupKey, scores, liveScores = {}) {
  const group = GROUPS[groupKey];
  const stats = {};
  group.teams.forEach(t => { stats[t] = { team:t,played:0,won:0,drawn:0,lost:0,gf:0,ga:0,gd:0,pts:0,h2h:{} }; });

  // merge user scores with live scores (live takes precedence if finished)
  group.matches.forEach(([home, away], idx) => {
    const key = `${groupKey}-${idx}`;
    const live = liveScores[key];
    const user = scores[key];
    const src = (live && live.status === "FINISHED") ? live : user;
    if (!src || src.home === "" || src.away === "" || src.home === null) return;
    const hg = parseInt(src.home), ag = parseInt(src.away);
    if (isNaN(hg) || isNaN(ag)) return;
    stats[home].played++; stats[away].played++;
    stats[home].gf+=hg; stats[home].ga+=ag; stats[away].gf+=ag; stats[away].ga+=hg;
    stats[home].gd=stats[home].gf-stats[home].ga; stats[away].gd=stats[away].gf-stats[away].ga;
    if(hg>ag){stats[home].won++;stats[home].pts+=3;stats[away].lost++;}
    else if(hg<ag){stats[away].won++;stats[away].pts+=3;stats[home].lost++;}
    else{stats[home].drawn++;stats[home].pts++;stats[away].drawn++;stats[away].pts++;}
    if(!stats[home].h2h[away])stats[home].h2h[away]={pts:0,gd:0,gf:0};
    if(!stats[away].h2h[home])stats[away].h2h[home]={pts:0,gd:0,gf:0};
    if(hg>ag)stats[home].h2h[away].pts+=3; else if(hg<ag)stats[away].h2h[home].pts+=3;
    else{stats[home].h2h[away].pts++;stats[away].h2h[home].pts++;}
    stats[home].h2h[away].gd+=hg-ag; stats[home].h2h[away].gf+=hg;
    stats[away].h2h[home].gd+=ag-hg; stats[away].h2h[home].gf+=ag;
  });
  return Object.values(stats).sort((a,b)=>{
    if(b.pts!==a.pts)return b.pts-a.pts;
    const ah=(a.h2h[b.team]||{pts:0}).pts,bh=(b.h2h[a.team]||{pts:0}).pts;
    if(bh!==ah)return bh-ah;
    const ag2=(a.h2h[b.team]||{gd:0}).gd,bg2=(b.h2h[a.team]||{gd:0}).gd;
    if(bg2!==ag2)return bg2-ag2;
    if(b.gd!==a.gd)return b.gd-a.gd;
    return b.gf-a.gf;
  });
}

function getThirdPlaceQualifiers(scores, liveScores={}) {
  const thirds = [];
  Object.keys(GROUPS).forEach(gKey => {
    const s = calcStandings(gKey, scores, liveScores);
    if(s[2]&&s[2].played>0) thirds.push({...s[2],groupKey:gKey});
  });
  thirds.sort((a,b)=>b.pts!==a.pts?b.pts-a.pts:b.gd!==a.gd?b.gd-a.gd:b.gf-a.gf);
  return new Set(thirds.slice(0,8).map(t=>t.team));
}

function getRankedThirds(scores, liveScores={}) {
  const thirds = [];
  Object.keys(GROUPS).forEach(gKey => {
    const s = calcStandings(gKey, scores, liveScores);
    if(s[2]&&s[2].played>0) thirds.push({...s[2],groupKey:gKey});
  });
  thirds.sort((a,b)=>b.pts!==a.pts?b.pts-a.pts:b.gd!==a.gd?b.gd-a.gd:b.gf-a.gf);
  return thirds.map((t,i)=>({...t,advancing:i<8}));
}

function getGroupWinners(scores, liveScores={}) {
  const w={};
  Object.keys(GROUPS).forEach(g=>{const s=calcStandings(g,scores,liveScores);w[g]={first:s[0],second:s[1]};});
  return w;
}

// ── Scoring ───────────────────────────────────────────────────────────────────
function scoreResult(pred, real) {
  if(!pred||pred.home===""||pred.away===""||!real||real.status!=="FINISHED") return null;
  const ph=parseInt(pred.home),pa=parseInt(pred.away);
  const rh=real.home,ra=real.away;
  if(isNaN(ph)||isNaN(pa)) return null;
  if(ph===rh&&pa===ra) return "exact";
  const predRes = ph>pa?"H":ph<pa?"A":"D";
  const realRes = rh>ra?"H":rh<ra?"A":"D";
  if(predRes===realRes) return "correct";
  return "wrong";
}

const SCORE_PTS = { exact: 5, correct: 3, wrong: 0 };

// ── Storage (Supabase) ────────────────────────────────────────────────────────
const SUPABASE_HEADERS = SUPABASE_KEY ? {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
} : null;

async function saveUserPredictions(name, scores, champion, knockoutPicks) {
  if (!SUPABASE_URL || !SUPABASE_HEADERS) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/predictions`, {
      method: "POST",
      headers: { ...SUPABASE_HEADERS, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        name,
        scores: scores || {},
        champion: champion || null,
        knockout_picks: knockoutPicks || {},
        updated_at: new Date().toISOString(),
      }),
    });
    return res.ok;
  } catch (e) { console.warn("Save failed:", e); return false; }
}

async function loadUserPredictions(name) {
  if (!SUPABASE_URL || !SUPABASE_HEADERS || !name) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/predictions?name=eq.${encodeURIComponent(name)}&select=*`,
      { headers: SUPABASE_HEADERS }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0] || null;
  } catch (e) { console.warn("Load failed:", e); return null; }
}

async function loadAllPredictions() {
  if (!SUPABASE_URL || !SUPABASE_HEADERS) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/predictions?select=*&order=updated_at.desc`,
      { headers: SUPABASE_HEADERS }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch (e) { console.warn("Load all failed:", e); return []; }
}

function getStoredName() {
  try { return localStorage.getItem("twg-name") || ""; } catch { return ""; }
}
function setStoredName(name) {
  try { localStorage.setItem("twg-name", name); } catch {}
}

// ── Live API Fetch ────────────────────────────────────────────────────────────
async function fetchLiveMatches() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) return null;
    const data = await res.json();
    return data.matches || [];
  } catch(e) {
    console.warn("Live fetch failed:", e);
    return null;
  }
}

// Parse API matches into our score key format { "A-0": { home: 2, away: 1, status: "FINISHED" } }
function parseApiMatches(apiMatches) {
  const result = {};
  if (!apiMatches) return result;

  apiMatches.forEach(m => {
    if (m.stage !== "GROUP_STAGE") return;
    const groupLetter = m.group?.replace("GROUP_","").replace("Group ","");
    if (!groupLetter || !GROUPS[groupLetter]) return;

    const homeTeam = API_NAME_MAP[m.homeTeam?.name] || m.homeTeam?.name;
    const awayTeam = API_NAME_MAP[m.awayTeam?.name] || m.awayTeam?.name;
    if (!homeTeam || !awayTeam) return;

    const group = GROUPS[groupLetter];
    const matchIdx = group.matches.findIndex(([h,a]) => h===homeTeam&&a===awayTeam);
    if (matchIdx === -1) return;

    const key = `${groupLetter}-${matchIdx}`;
    const score = m.score?.fullTime;
    result[key] = {
      home: score?.home ?? null,
      away: score?.away ?? null,
      status: m.status, // SCHEDULED, IN_PLAY, PAUSED, FINISHED
      utcDate: m.utcDate,
    };
  });
  return result;
}

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
  bg:"#000000", surface:"#0A0A0A", surfaceRaised:"#111111",
  border:"#1C2E24", borderMid:"#243D2F",
  green:"#5A947B", greenDark:"#014327", greenDeep:"#021A0F",
  gold:"#C49F4B", white:"#FFFFFF", muted:"#5A7A6A", dim:"#1E3329",
  tealDim:"rgba(90,148,123,0.15)", tealBorder:"rgba(90,148,123,0.4)",
  posGreen:"#4CAF7A", negRed:"#E05252",
  exact:"#4CAF7A", correct:"#C49F4B", wrong:"#E05252",
  inPlay:"#5A947B",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=League+Spartan:wght@400;600;700;900&family=Quicksand:wght@400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#000;}
  input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;}
  input[type=number]{-moz-appearance:textfield;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:#000;}
  ::-webkit-scrollbar-thumb{background:#1C2E24;border-radius:2px;}
  .nav-btn{transition:color 0.15s,border-color 0.15s;}
  .nav-btn:hover{color:#fff!important;}
  .score-input:focus{outline:none;border-color:#5A947B!important;background:#0A1A10!important;}
  .group-card{transition:border-color 0.2s,box-shadow 0.2s;}
  .group-card:hover{border-color:#3A6A50!important;box-shadow:0 0 0 1px rgba(90,148,123,0.15)!important;}
  @keyframes fadeIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
  .fade-in{animation:fadeIn 0.3s ease forwards;}
  @keyframes glowPulse{0%,100%{filter:drop-shadow(0 0 10px rgba(196,159,75,0.4));}50%{filter:drop-shadow(0 0 22px rgba(196,159,75,0.7));}}
  .trophy-glow{animation:glowPulse 3s ease-in-out infinite;}
  .save-btn:hover{opacity:0.85;}
  .toggle-btn:hover{color:#5A947B!important;}
  @keyframes blink{0%,100%{opacity:1;}50%{opacity:0.4;}}
  .live-dot{animation:blink 1.2s ease-in-out infinite;}
`;

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero({ liveStatus }) {
  return (
    <div style={{ background:`linear-gradient(180deg,#000 0%,${C.greenDeep} 50%,#000 100%)`, borderBottom:`2px solid ${C.green}`, padding:"48px 20px 40px", textAlign:"center", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:600,height:400,background:`radial-gradient(ellipse,rgba(90,148,123,0.1) 0%,transparent 70%)`,pointerEvents:"none" }} />
      <div className="trophy-glow" style={{ display:"inline-block",marginBottom:20,color:C.gold,width:68,height:68 }} dangerouslySetInnerHTML={{ __html:TROPHY_SVG }} />
      <h1 style={{ fontFamily:"'League Spartan',sans-serif",fontSize:"clamp(26px,7vw,58px)",fontWeight:900,letterSpacing:"-0.02em",color:C.white,lineHeight:1,marginBottom:10,textTransform:"uppercase" }}>
        The Worlds Game
      </h1>
      <p style={{ fontFamily:"'Quicksand',sans-serif",fontSize:12,color:C.green,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:600,marginBottom:16 }}>
        2026 FIFA World Cup Predictor
      </p>
      {liveStatus && (
        <div style={{ display:"inline-flex",alignItems:"center",gap:6,background:C.tealDim,border:`1px solid ${C.tealBorder}`,borderRadius:20,padding:"4px 12px",marginBottom:16 }}>
          <span className="live-dot" style={{ width:6,height:6,borderRadius:"50%",background:C.green,display:"inline-block" }} />
          <span style={{ fontFamily:"'League Spartan',sans-serif",fontSize:10,color:C.green,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" }}>{liveStatus}</span>
        </div>
      )}
      {/* Editorial stat strip */}
      <div style={{ marginTop:8, position:"relative" }}>
        {/* Dates */}
        <div style={{
          fontFamily:"'League Spartan',sans-serif",
          fontSize:"clamp(11px,2vw,13px)",
          color:C.white, fontWeight:700,
          letterSpacing:"0.18em", textTransform:"uppercase",
          marginBottom:14,
        }}>
          June 11 <span style={{ color:C.green, margin:"0 6px" }}>—</span> July 19, 2026
        </div>

        {/* Hairline divider */}
        <div style={{
          width:60, height:1, background:C.green,
          margin:"0 auto 14px", opacity:0.6,
        }} />

        {/* Stats row */}
        <div style={{
          display:"flex", justifyContent:"center", alignItems:"center",
          flexWrap:"wrap", gap:"4px 22px",
          fontFamily:"'League Spartan',sans-serif",
          fontSize:"clamp(11px,2vw,14px)",
          color:C.offWhite || C.white, fontWeight:600,
          letterSpacing:"0.14em", textTransform:"uppercase",
          marginBottom:18,
        }}>
          <span><span style={{ color:C.green, fontWeight:900 }}>48</span> Nations</span>
          <span style={{ color:C.dim }}>·</span>
          <span><span style={{ color:C.green, fontWeight:900 }}>12</span> Groups</span>
        </div>

        {/* Dramatic closer */}
        <div style={{
          fontFamily:"'League Spartan',sans-serif",
          fontSize:"clamp(14px,3vw,20px)",
          fontWeight:900, letterSpacing:"0.16em",
          textTransform:"uppercase",
          color:C.gold,
          textShadow:`0 0 20px rgba(196,159,75,0.3)`,
        }}>
          One Champion
        </div>
      </div>
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav({ tab, setTab }) {
  return (
    <div style={{ borderBottom:`1px solid ${C.border}`,background:C.bg,position:"sticky",top:0,zIndex:100 }}>
      <div style={{ maxWidth:1100,margin:"0 auto",display:"flex",overflowX:"auto" }}>
        {[["groups","Groups"],["bracket","The Bracket"],["results","Live Results"],["champion","Overview"],["leaderboard","Leaderboard"]].map(([id,label])=>(
          <button key={id} className="nav-btn" onClick={()=>setTab(id)} style={{ background:"none",border:"none",borderBottom:tab===id?`2px solid ${C.green}`:"2px solid transparent",color:tab===id?C.green:C.muted,fontFamily:"'League Spartan',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",padding:"13px 20px 11px",cursor:"pointer",whiteSpace:"nowrap" }}>
            {label}{id==="results"&&<span style={{ marginLeft:5,fontSize:8,color:C.green,verticalAlign:"middle" }}>●</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Score Input ───────────────────────────────────────────────────────────────
function ScoreInput({ value, onChange, disabled }) {
  return (
    <input className="score-input" type="number" min={0} max={99} value={value} onChange={e=>onChange(e.target.value)} placeholder="–" disabled={disabled} style={{ width:36,height:32,background:disabled?"#050D08":"#050D08",border:`1px solid ${C.border}`,borderRadius:4,color:disabled?C.muted:C.white,textAlign:"center",fontSize:15,fontWeight:700,fontFamily:"'League Spartan',sans-serif",transition:"border-color 0.15s,background 0.15s",opacity:disabled?0.5:1 }} />
  );
}

// ── Match Row with live result comparison ─────────────────────────────────────
function MatchRow({ home, away, matchKey, userScore, liveScore, onScore, groupKey }) {
  const s = userScore || { home:"", away:"" };
  const result = scoreResult(userScore, liveScore);
  const resultColors = { exact:C.exact, correct:C.correct, wrong:C.wrong };
  const isLocked = liveScore?.status === "FINISHED" || liveScore?.status === "IN_PLAY" || liveScore?.status === "PAUSED";
  const isFinished = liveScore?.status === "FINISHED";
  const statusLabel = liveScore?.status === "IN_PLAY" || liveScore?.status === "PAUSED" ? "LIVE" :
                      liveScore?.status === "FINISHED" ? "FT" :
                      liveScore?.status === "SCHEDULED" ? null : null;

  return (
    <div style={{
      borderTop:`1px solid ${C.border}`,
      background: isFinished ? "rgba(255,255,255,0.015)" : "transparent",
      position:"relative",
    }}>
      {/* Lock badge for finished/live matches */}
      {isLocked && (
        <div style={{
          position:"absolute", top:6, left:6,
          fontSize:8, fontFamily:"'League Spartan',sans-serif",
          fontWeight:700, color:isFinished?C.muted:C.green,
          letterSpacing:"0.1em", textTransform:"uppercase",
          background:isFinished?"rgba(40,40,40,0.6)":C.tealDim,
          border:`1px solid ${isFinished?C.border:C.tealBorder}`,
          borderRadius:3, padding:"1px 5px",
          display:"flex", alignItems:"center", gap:3,
        }}>
          <span style={{ fontSize:7 }}>🔒</span>
          {isFinished ? "Locked" : "Locked · Live"}
        </div>
      )}

      <div style={{
        display:"flex", alignItems:"center",
        padding: isLocked ? "18px 12px 7px" : "7px 12px",
        gap:8,
        opacity: isFinished && !userScore ? 0.5 : 1,
      }}>
        {/* Home */}
        <span style={{ flex:1,fontSize:11,color:isLocked?C.dim:C.muted,textAlign:"right",fontFamily:"'Quicksand',sans-serif",display:"flex",alignItems:"center",justifyContent:"flex-end",gap:5 }}>
          {home}<Flag team={home} size={13} />
        </span>

        {/* User prediction */}
        <div style={{ display:"flex",alignItems:"center",gap:4 }}>
          <ScoreInput value={s.home} onChange={v=>onScore(matchKey,"home",v)} disabled={isLocked} />
          <span style={{ color:isLocked?C.dim:C.green,fontSize:11,fontFamily:"'League Spartan',sans-serif",fontWeight:700 }}>:</span>
          <ScoreInput value={s.away} onChange={v=>onScore(matchKey,"away",v)} disabled={isLocked} />
        </div>

        {/* Result indicator */}
        {result && (
          <div style={{ width:6,height:6,borderRadius:"50%",background:resultColors[result],flexShrink:0 }} title={result} />
        )}

        {/* Live / real score */}
        {liveScore && liveScore.home !== null && (
          <div style={{ display:"flex",alignItems:"center",gap:4,flexShrink:0 }}>
            {statusLabel && (
              <span style={{ fontSize:8,fontFamily:"'League Spartan',sans-serif",fontWeight:700,color:liveScore.status==="FINISHED"?C.muted:C.green,letterSpacing:"0.08em",textTransform:"uppercase" }}
                className={liveScore.status!=="FINISHED"?"live-dot":""}>
                {statusLabel}
              </span>
            )}
            <span style={{ fontSize:13,fontWeight:700,fontFamily:"'League Spartan',sans-serif",color:liveScore.status==="FINISHED"?C.white:C.green }}>
              {liveScore.home}:{liveScore.away}
            </span>
          </div>
        )}

        {/* Away */}
        <span style={{ flex:1,fontSize:11,color:C.muted,fontFamily:"'Quicksand',sans-serif",display:"flex",alignItems:"center",gap:5 }}>
          <Flag team={away} size={13} />{away}
        </span>
      </div>

      {/* Points earned */}
      {result && (
        <div style={{ padding:"2px 12px 4px",textAlign:"center" }}>
          <span style={{ fontSize:9,fontFamily:"'League Spartan',sans-serif",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:resultColors[result] }}>
            {result === "exact" ? "+5 pts · Exact Score!" : result === "correct" ? "+3 pts · Correct Result" : "No points"}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Group Card ────────────────────────────────────────────────────────────────
function GroupCard({ groupKey, scores, onScore, qualifyingThirds, liveScores }) {
  const [showMatches, setShowMatches] = useState(false);
  const group = GROUPS[groupKey];
  const standings = calcStandings(groupKey, scores, liveScores);

  // check if any match in this group is live
  const hasLive = group.matches.some((_,i) => {
    const k = `${groupKey}-${i}`;
    return liveScores[k]?.status === "IN_PLAY" || liveScores[k]?.status === "PAUSED";
  });

  return (
    <div className="group-card fade-in" style={{ background:C.surface,border:`2px solid ${hasLive?C.green:C.border}`,borderRadius:8,overflow:"hidden" }}>
      <div style={{ padding:"11px 14px",borderBottom:`1px solid ${C.border}`,background:`linear-gradient(135deg,${C.greenDark} 0%,#031A0E 100%)`,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <div style={{ width:4,height:22,background:C.green,borderRadius:2,flexShrink:0 }} />
          <span style={{ fontFamily:"'League Spartan',sans-serif",fontSize:16,fontWeight:900,color:C.white,letterSpacing:"0.05em",textTransform:"uppercase" }}>Group {groupKey}</span>
          {hasLive && <span className="live-dot" style={{ fontSize:8,color:C.green }}>● LIVE</span>}
        </div>
        <div style={{ display:"flex",gap:4 }}>
          {group.teams.slice(0,2).map(t=><Flag key={t} team={t} size={14} />)}
        </div>
      </div>

      {/* Standings */}
      <table style={{ width:"100%",borderCollapse:"collapse" }}>
        <thead>
          <tr style={{ background:"#050D08",borderBottom:`1px solid ${C.border}` }}>
            {["#","Team","P","GD","Pts"].map((h,i)=>(
              <th key={h} style={{ padding:i===0?"6px 4px 6px 12px":"6px 8px",textAlign:i>1?"right":"left",fontSize:9,letterSpacing:"0.12em",color:C.muted,textTransform:"uppercase",fontWeight:600,fontFamily:"'League Spartan',sans-serif" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standings.map((row,i)=>{
            const top2=i<2,isThird=i===2;
            const thirdIn=isThird&&qualifyingThirds&&qualifyingThirds.has(row.team)&&row.played>0;
            return (
              <tr key={row.team} style={{ background:top2?"rgba(90,148,123,0.08)":thirdIn?"rgba(90,148,123,0.12)":"transparent",borderTop:`1px solid ${C.border}` }}>
                <td style={{ padding:"8px 4px 8px 12px" }}>
                  <div style={{ width:18,height:18,borderRadius:3,background:i===0?C.gold:i===1?C.green:thirdIn?"#1C3D2C":"transparent",color:i===0?"#000":i<=1||thirdIn?"#fff":C.dim,fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'League Spartan',sans-serif",border:thirdIn&&i===2?`1px solid ${C.green}`:"none" }}>{i+1}</div>
                </td>
                <td style={{ padding:"7px 8px",fontSize:12,color:top2?C.white:thirdIn?C.green:C.muted,fontFamily:"'Quicksand',sans-serif",fontWeight:500 }}>
                  <span style={{ display:"inline-flex",alignItems:"center",gap:7 }}>
                    <Flag team={row.team} size={14} />{row.team}
                    {thirdIn&&<span style={{ fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",color:C.green,background:C.tealDim,border:`1px solid ${C.tealBorder}`,borderRadius:3,padding:"1px 5px",fontWeight:700,fontFamily:"'League Spartan',sans-serif" }}>IN</span>}
                  </span>
                </td>
                <td style={{ padding:"7px 8px",textAlign:"right",fontSize:12,color:C.muted,fontFamily:"'League Spartan',sans-serif" }}>{row.played}</td>
                <td style={{ padding:"7px 8px",textAlign:"right",fontSize:12,fontWeight:700,fontFamily:"'League Spartan',sans-serif",color:row.gd>0?C.posGreen:row.gd<0?C.negRed:C.muted }}>{row.gd>0?`+${row.gd}`:row.gd}</td>
                <td style={{ padding:"7px 12px 7px 8px",textAlign:"right",fontSize:13,fontWeight:700,fontFamily:"'League Spartan',sans-serif",color:top2?C.gold:thirdIn?C.green:C.muted }}>{row.pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Matches */}
      <div style={{ borderTop:`1px solid ${C.border}` }}>
        <button className="toggle-btn" onClick={()=>setShowMatches(!showMatches)} style={{ width:"100%",background:"none",border:"none",color:C.muted,fontFamily:"'League Spartan',sans-serif",fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",padding:"9px 14px",cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",fontWeight:700,transition:"color 0.15s" }}>
          <span>Scores & Predictions</span><span style={{ fontSize:9 }}>{showMatches?"▲":"▼"}</span>
        </button>
        {showMatches && group.matches.map(([home,away],idx)=>{
          const key=`${groupKey}-${idx}`;
          return (
            <MatchRow key={key} home={home} away={away} matchKey={key} userScore={scores[key]} liveScore={liveScores[key]} onScore={onScore} groupKey={groupKey} />
          );
        })}
      </div>
    </div>
  );
}

// ── Third Place Tracker ───────────────────────────────────────────────────────
function ThirdPlaceTracker({ scores, liveScores }) {
  const ranked = getRankedThirds(scores, liveScores);
  if(ranked.length===0) return null;
  return (
    <div style={{ background:C.surface,border:`2px solid ${C.green}`,borderRadius:8,overflow:"hidden",marginBottom:24 }}>
      <div style={{ padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:`linear-gradient(90deg,rgba(90,148,123,0.15),transparent)` }}>
        <div>
          <span style={{ fontFamily:"'League Spartan',sans-serif",fontSize:13,fontWeight:900,color:C.green,textTransform:"uppercase",letterSpacing:"0.08em" }}>Best Third-Place Race</span>
          <span style={{ marginLeft:10,fontSize:10,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Quicksand',sans-serif" }}>Top 8 of 12 advance</span>
        </div>
        <div style={{ fontSize:10,color:C.green,letterSpacing:"0.08em",background:C.tealDim,border:`1px solid ${C.tealBorder}`,borderRadius:4,padding:"3px 8px",fontWeight:700,fontFamily:"'League Spartan',sans-serif",textTransform:"uppercase" }}>
          {ranked.filter(t=>t.advancing).length} / 8
        </div>
      </div>
      {ranked.map((t,i)=>{
        const isLastIn=t.advancing&&(i===ranked.length-1||!ranked[i+1]?.advancing);
        return (
          <div key={t.team}>
            {i===8&&<div style={{ padding:"5px 16px",background:"rgba(224,82,82,0.05)",borderTop:"1px dashed rgba(224,82,82,0.25)",borderBottom:"1px dashed rgba(224,82,82,0.25)",fontSize:9,color:"#E05252",letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:700,fontFamily:"'League Spartan',sans-serif" }}>— Elimination line —</div>}
            <div style={{ display:"flex",alignItems:"center",padding:"9px 16px",gap:10,borderTop:i>0&&i!==8?`1px solid ${C.border}`:"none",background:t.advancing?"rgba(90,148,123,0.04)":"transparent" }}>
              <div style={{ width:20,height:20,borderRadius:4,flexShrink:0,background:t.advancing?C.green:"#1C1C1C",color:t.advancing?"#fff":C.muted,fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'League Spartan',sans-serif" }}>{i+1}</div>
              <Flag team={t.team} size={16} />
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:12,fontWeight:600,fontFamily:"'Quicksand',sans-serif",color:t.advancing?C.green:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                  {t.team}
                  {isLastIn&&<span style={{ marginLeft:6,fontSize:8,color:C.gold,background:"rgba(196,159,75,0.1)",border:"1px solid rgba(196,159,75,0.3)",borderRadius:3,padding:"1px 4px",fontWeight:700,fontFamily:"'League Spartan',sans-serif",textTransform:"uppercase",letterSpacing:"0.08em" }}>BUBBLE</span>}
                </div>
                <div style={{ fontSize:10,color:C.dim,fontFamily:"'Quicksand',sans-serif" }}>Group {t.groupKey}</div>
              </div>
              <div style={{ display:"flex",gap:16,flexShrink:0 }}>
                {[{val:t.pts,label:"Pts"},{val:t.gd>0?`+${t.gd}`:t.gd,label:"GD",color:t.gd>0?C.posGreen:t.gd<0?C.negRed:undefined},{val:t.gf,label:"GF"}].map(({val,label,color})=>(
                  <div key={label} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:13,fontWeight:700,fontFamily:"'League Spartan',sans-serif",color:color||(t.advancing?C.white:C.muted) }}>{val}</div>
                    <div style={{ fontSize:8,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'League Spartan',sans-serif" }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",flexShrink:0,padding:"3px 8px",borderRadius:4,background:t.advancing?C.tealDim:"rgba(40,40,40,0.8)",border:`1px solid ${t.advancing?C.tealBorder:"#2A2A2A"}`,color:t.advancing?C.green:C.muted,fontFamily:"'League Spartan',sans-serif" }}>{t.advancing?"In":"Out"}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Live Results Tab ──────────────────────────────────────────────────────────
function ResultsTab({ liveScores, scores, lastUpdated }) {
  const allMatches = [];
  Object.keys(GROUPS).forEach(gKey => {
    GROUPS[gKey].matches.forEach(([home,away],idx) => {
      const key = `${gKey}-${idx}`;
      const live = liveScores[key];
      const user = scores[key];
      if (live) allMatches.push({ gKey, idx, key, home, away, live, user });
    });
  });

  const inPlay = allMatches.filter(m=>m.live.status==="IN_PLAY"||m.live.status==="PAUSED");
  const finished = allMatches.filter(m=>m.live.status==="FINISHED");
  const upcoming = allMatches.filter(m=>m.live.status==="SCHEDULED");

  const MatchCard = ({ m }) => {
    const result = scoreResult(m.user, m.live);
    const ptColors = { exact:C.exact, correct:C.correct, wrong:C.wrong };
    return (
      <div style={{ background:C.surface,border:`1px solid ${m.live.status==="IN_PLAY"||m.live.status==="PAUSED"?C.green:C.border}`,borderRadius:6,padding:"12px 14px",display:"flex",alignItems:"center",gap:10 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:8,fontFamily:"'League Spartan',sans-serif",color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4 }}>Group {m.gKey}</div>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <span style={{ display:"flex",alignItems:"center",gap:5,fontSize:12,fontFamily:"'Quicksand',sans-serif",color:C.white,flex:1,justifyContent:"flex-end" }}>
              {m.home}<Flag team={m.home} size={14} />
            </span>
            <div style={{ textAlign:"center",minWidth:60 }}>
              {(m.live.status==="IN_PLAY"||m.live.status==="PAUSED") && (
                <div style={{ fontSize:8,color:C.green,fontFamily:"'League Spartan',sans-serif",fontWeight:700,letterSpacing:"0.1em",marginBottom:2 }} className="live-dot">● LIVE</div>
              )}
              <div style={{ fontSize:16,fontWeight:700,fontFamily:"'League Spartan',sans-serif",color:m.live.status==="FINISHED"?C.white:C.green }}>
                {m.live.home !== null ? `${m.live.home} : ${m.live.away}` : "vs"}
              </div>
              {m.live.status==="FINISHED"&&<div style={{ fontSize:8,color:C.muted,fontFamily:"'League Spartan',sans-serif",letterSpacing:"0.08em" }}>FT</div>}
            </div>
            <span style={{ display:"flex",alignItems:"center",gap:5,fontSize:12,fontFamily:"'Quicksand',sans-serif",color:C.white,flex:1 }}>
              <Flag team={m.away} size={14} />{m.away}
            </span>
          </div>
        </div>
        {m.user && m.user.home !== "" && (
          <div style={{ textAlign:"right",flexShrink:0,borderLeft:`1px solid ${C.border}`,paddingLeft:12 }}>
            <div style={{ fontSize:9,color:C.muted,fontFamily:"'League Spartan',sans-serif",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2 }}>Your Pick</div>
            <div style={{ fontSize:14,fontWeight:700,fontFamily:"'League Spartan',sans-serif",color:result?ptColors[result]:C.muted }}>{m.user.home}:{m.user.away}</div>
            {result && <div style={{ fontSize:8,color:ptColors[result],fontFamily:"'League Spartan',sans-serif",fontWeight:700,textTransform:"uppercase" }}>{result==="exact"?"+5":result==="correct"?"+3":"0"} pts</div>}
          </div>
        )}
      </div>
    );
  };

  if (allMatches.length === 0) {
    return (
      <div className="fade-in" style={{ textAlign:"center",padding:40,color:C.muted,fontFamily:"'Quicksand',sans-serif",fontSize:13 }}>
        <div style={{ color:C.green,fontFamily:"'League Spartan',sans-serif",fontSize:24,fontWeight:900,textTransform:"uppercase",marginBottom:8 }}>Live Results</div>
        <p>Results will appear here as matches kick off. Group stage begins June 11, 2026.</p>
        {lastUpdated && <p style={{ marginTop:8,fontSize:11,color:C.dim }}>Last checked: {lastUpdated}</p>}
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
        <div style={{ fontFamily:"'League Spartan',sans-serif",fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:C.gold,fontWeight:700 }}>Live Results & Your Predictions</div>
        {lastUpdated && <div style={{ fontSize:10,color:C.dim,fontFamily:"'Quicksand',sans-serif" }}>Updated {lastUpdated}</div>}
      </div>

      {inPlay.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:"'League Spartan',sans-serif",fontSize:10,color:C.green,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12,display:"flex",alignItems:"center",gap:6 }}>
            <span className="live-dot" style={{ width:6,height:6,borderRadius:"50%",background:C.green,display:"inline-block" }} />
            In Play
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10 }}>
            {inPlay.map(m=><MatchCard key={m.key} m={m} />)}
          </div>
        </div>
      )}

      {finished.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:"'League Spartan',sans-serif",fontSize:10,color:C.muted,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12 }}>Finished</div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10 }}>
            {finished.map(m=><MatchCard key={m.key} m={m} />)}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <div style={{ fontFamily:"'League Spartan',sans-serif",fontSize:10,color:C.muted,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12 }}>Upcoming</div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10 }}>
            {upcoming.map(m=><MatchCard key={m.key} m={m} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Bracket Tab — Full Knockout Through Final ─────────────────────────────────
function BracketTab({ scores, liveScores, champion, knockoutPicks, onKnockoutPick }) {
  const winners = getGroupWinners(scores, liveScores);

  // Determine team that won an R32 match based on user pick
  const getWinnerOfMatch = (matchId) => knockoutPicks[matchId] || null;

  // R32 match → resolved home/away team names
  const resolveR32Team = (slot) => {
    if (slot.pos === "third") return { team:null, source:`3rd Grp ${slot.from}` };
    const standing = slot.pos === "winner" ? winners[slot.group]?.first : winners[slot.group]?.second;
    const hasData = standing?.played > 0;
    return { team: hasData ? standing.team : null, source: `${slot.pos === "winner" ? "1st" : "2nd"} Grp ${slot.group}` };
  };

  // Generate next round matchups from previous round winners
  // Standard knockout bracket: M1 vs M2, M3 vs M4, etc.
  const R16_MATCHES = [
    { id:89, src:[73,74] }, { id:90, src:[75,76] },
    { id:91, src:[77,78] }, { id:92, src:[79,80] },
    { id:93, src:[81,82] }, { id:94, src:[83,84] },
    { id:95, src:[85,86] }, { id:96, src:[87,88] },
  ];
  const QF_MATCHES = [
    { id:97, src:[89,90] }, { id:98, src:[91,92] },
    { id:99, src:[93,94] }, { id:100, src:[95,96] },
  ];
  const SF_MATCHES = [
    { id:101, src:[97,98] }, { id:102, src:[99,100] },
  ];
  const THIRD_PLACE = { id:103, srcLosers:[101,102] };
  const FINAL = { id:104, src:[101,102] };

  const TeamPill = ({ team, source, isPick, isClickable, onClick }) => {
    const hasTeam = !!team;
    return (
      <div onClick={isClickable ? onClick : undefined} style={{
        display:"flex", alignItems:"center", gap:6,
        padding:"5px 8px",
        background: isPick ? "rgba(196,159,75,0.15)" : hasTeam ? "rgba(90,148,123,0.06)" : "#080808",
        border:`1px solid ${isPick ? C.gold : hasTeam ? C.tealBorder : C.border}`,
        borderRadius:4, minWidth:130,
        cursor: isClickable && hasTeam ? "pointer" : "default",
        opacity: isClickable && !hasTeam ? 0.5 : 1,
        transition:"all 0.15s",
      }}>
        {team ? <Flag team={team} size={13} /> : <span style={{ width:17,height:13,background:C.border,borderRadius:2,display:"inline-block" }} />}
        <span style={{
          fontSize:11, color: isPick ? C.gold : hasTeam ? C.white : C.dim,
          fontFamily:"'Quicksand',sans-serif", fontWeight: isPick ? 700 : 500,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1,
        }}>
          {team || source || "TBD"}
        </span>
        {isPick && <span style={{ fontSize:8, color:C.gold, fontFamily:"'League Spartan',sans-serif", fontWeight:700 }}>✓</span>}
      </div>
    );
  };

  // Generic match card with two team pills + winner picker
  const MatchCard = ({ matchId, label, roundLabel, homeTeam, awayTeam, homeSource, awaySource }) => {
    const pick = knockoutPicks[matchId];
    const canPick = !!(homeTeam && awayTeam);
    return (
      <div style={{
        background:C.surface, border:`1px solid ${pick ? C.gold : C.border}`,
        borderRadius:6, overflow:"hidden", transition:"border-color 0.2s",
      }}>
        <div style={{
          padding:"6px 10px", borderBottom:`1px solid ${C.border}`,
          background:`linear-gradient(90deg,${C.greenDark},#050D08)`,
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:8,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:3, height:14, background:C.green, borderRadius:1 }} />
            <span style={{ fontFamily:"'League Spartan',sans-serif", fontSize:9, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.12em" }}>
              Match {matchId} · {roundLabel}
            </span>
          </div>
          {pick && <span style={{ fontSize:8, color:C.gold, fontFamily:"'League Spartan',sans-serif", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>Picked</span>}
        </div>
        <div style={{ padding:"10px" }}>
          <TeamPill
            team={homeTeam} source={homeSource}
            isPick={pick === homeTeam}
            isClickable={canPick}
            onClick={() => onKnockoutPick(matchId, homeTeam)}
          />
          <div style={{ display:"flex", alignItems:"center", gap:8, margin:"6px 0" }}>
            <div style={{ flex:1, height:1, background:C.border }} />
            <span style={{ fontSize:9, color:C.green, fontFamily:"'League Spartan',sans-serif", fontWeight:700 }}>VS</span>
            <div style={{ flex:1, height:1, background:C.border }} />
          </div>
          <TeamPill
            team={awayTeam} source={awaySource}
            isPick={pick === awayTeam}
            isClickable={canPick}
            onClick={() => onKnockoutPick(matchId, awayTeam)}
          />
          {canPick && !pick && (
            <div style={{ marginTop:8, fontSize:9, color:C.muted, fontFamily:"'League Spartan',sans-serif", letterSpacing:"0.1em", textTransform:"uppercase", textAlign:"center" }}>
              Tap a team to pick
            </div>
          )}
        </div>
      </div>
    );
  };

  const champCode = TEAM_FLAGS[champion];

  // Round renderer with escalating visual drama
  const renderRound = (config) => {
    const { title, matches, roundLabel, accentColor, columns, cardSize, headerSize } = config;
    const pickedCount = matches.filter(m => knockoutPicks[m.id]).length;
    return (
      <div style={{ marginBottom:36 }}>
        <div style={{ marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:28, height:2, background:accentColor }} />
          <div style={{
            fontFamily:"'League Spartan',sans-serif",
            fontSize:headerSize, fontWeight:900,
            color:accentColor, textTransform:"uppercase",
            letterSpacing:"0.14em",
          }}>{title}</div>
          <div style={{ flex:1, height:1, background:C.border }} />
          <div style={{
            fontSize:10, color:C.muted,
            fontFamily:"'League Spartan',sans-serif", fontWeight:700,
            letterSpacing:"0.1em", textTransform:"uppercase",
            background:pickedCount === matches.length ? C.tealDim : "transparent",
            border:pickedCount === matches.length ? `1px solid ${C.tealBorder}` : "none",
            padding:"3px 8px", borderRadius:4,
          }}>{pickedCount} / {matches.length}</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:`repeat(auto-fill, minmax(${cardSize}px, 1fr))`, gap:12 }}>
          {matches.map(m => m.card)}
        </div>
      </div>
    );
  };

  // Build R32 cards
  const r32Cards = R32_MATCHES.map(m => {
    const homeData = resolveR32Team(m.home);
    const awayData = resolveR32Team(m.away);
    return { id:m.id, card: (
      <MatchCard key={m.id} matchId={m.id} roundLabel="R32"
        homeTeam={homeData.team} awayTeam={awayData.team}
        homeSource={homeData.source} awaySource={awayData.source}
      />
    )};
  });

  // Build R16, QF, SF based on previous round picks
  const buildDownstreamCards = (matches, roundLabel) => matches.map(m => {
    const homeWinner = getWinnerOfMatch(m.src[0]);
    const awayWinner = getWinnerOfMatch(m.src[1]);
    return { id:m.id, card: (
      <MatchCard key={m.id} matchId={m.id} roundLabel={roundLabel}
        homeTeam={homeWinner} awayTeam={awayWinner}
        homeSource={`Winner M${m.src[0]}`} awaySource={`Winner M${m.src[1]}`}
      />
    )};
  });

  const r16Cards = buildDownstreamCards(R16_MATCHES, "R16");
  const qfCards = buildDownstreamCards(QF_MATCHES, "QF");
  const sfCards = buildDownstreamCards(SF_MATCHES, "SF");

  // Third place: losers of SF
  const sfLoser = (matchId) => {
    const pick = knockoutPicks[matchId];
    if (!pick) return null;
    const m = SF_MATCHES.find(x => x.id === matchId);
    if (!m) return null;
    const home = getWinnerOfMatch(m.src[0]);
    const away = getWinnerOfMatch(m.src[1]);
    if (home && away) return pick === home ? away : home;
    return null;
  };
  const tpHome = sfLoser(101);
  const tpAway = sfLoser(102);
  const finalHome = getWinnerOfMatch(101);
  const finalAway = getWinnerOfMatch(102);
  const finalWinner = knockoutPicks[104];
  const finalHomeFlag = TEAM_FLAGS[finalHome];
  const finalAwayFlag = TEAM_FLAGS[finalAway];
  const finalWinnerFlag = TEAM_FLAGS[finalWinner];

  return (
    <div className="fade-in">
      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:"'League Spartan',sans-serif",fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:C.gold,fontWeight:700,marginBottom:6 }}>
          Full Knockout Bracket
        </div>
        <p style={{ fontSize:12,color:C.muted,fontFamily:"'Quicksand',sans-serif", lineHeight:1.6 }}>
          Pick winners for each round. R32 populates from group stage results. Subsequent rounds populate as you make your picks. Tap a team to select them as your winner. Your Final pick syncs with the Champion tab.
        </p>
      </div>

      {/* ── ROUND OF 32 ── (16 matches, compact grid) */}
      {renderRound({
        title: "Round of 32",
        matches: r32Cards,
        roundLabel: "R32",
        accentColor: C.green,
        cardSize: 260,
        headerSize: 13,
      })}

      {/* ── ROUND OF 16 ── (8 matches, slightly larger) */}
      {renderRound({
        title: "Round of 16",
        matches: r16Cards,
        roundLabel: "R16",
        accentColor: C.green,
        cardSize: 280,
        headerSize: 14,
      })}

      {/* ── QUARTERFINALS ── (4 matches, gold accents) */}
      {renderRound({
        title: "Quarterfinals",
        matches: qfCards,
        roundLabel: "QF",
        accentColor: C.gold,
        cardSize: 320,
        headerSize: 15,
      })}

      {/* ── SEMIFINALS ── (only 2, side-by-side hero treatment) */}
      <div style={{ marginBottom:40 }}>
        <div style={{ marginBottom:18, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:32, height:2, background:C.gold }} />
          <div style={{
            fontFamily:"'League Spartan',sans-serif",
            fontSize:18, fontWeight:900, color:C.gold,
            textTransform:"uppercase", letterSpacing:"0.18em",
          }}>Semifinals</div>
          <div style={{ flex:1, height:1, background:C.border }} />
          <div style={{
            fontSize:10, color:C.muted,
            fontFamily:"'League Spartan',sans-serif", fontWeight:700,
            letterSpacing:"0.1em", textTransform:"uppercase",
          }}>{sfCards.filter(m => knockoutPicks[m.id]).length} / 2</div>
        </div>
        <div style={{
          display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))", gap:16,
        }}>
          {SF_MATCHES.map(m => {
            const homeWinner = getWinnerOfMatch(m.src[0]);
            const awayWinner = getWinnerOfMatch(m.src[1]);
            const pick = knockoutPicks[m.id];
            const canPick = !!(homeWinner && awayWinner);
            return (
              <div key={m.id} style={{
                background:`linear-gradient(135deg, ${C.greenDeep} 0%, #000 100%)`,
                border:`2px solid ${pick ? C.gold : "rgba(196,159,75,0.4)"}`,
                borderRadius:10, padding:"18px 18px",
                boxShadow: pick ? `0 0 30px rgba(196,159,75,0.15)` : "none",
                transition:"all 0.3s",
              }}>
                <div style={{
                  fontFamily:"'League Spartan',sans-serif", fontSize:10,
                  color:C.gold, fontWeight:900, letterSpacing:"0.14em",
                  textTransform:"uppercase", marginBottom:14, textAlign:"center",
                }}>Semifinal · Match {m.id}</div>
                <TeamPill team={homeWinner} source={`Winner M${m.src[0]}`}
                  isPick={pick === homeWinner} isClickable={canPick}
                  onClick={() => onKnockoutPick(m.id, homeWinner)}
                />
                <div style={{ display:"flex", alignItems:"center", gap:8, margin:"10px 0" }}>
                  <div style={{ flex:1, height:1, background:C.border }} />
                  <span style={{ fontSize:10, color:C.gold, fontFamily:"'League Spartan',sans-serif", fontWeight:900, letterSpacing:"0.14em" }}>VS</span>
                  <div style={{ flex:1, height:1, background:C.border }} />
                </div>
                <TeamPill team={awayWinner} source={`Winner M${m.src[1]}`}
                  isPick={pick === awayWinner} isClickable={canPick}
                  onClick={() => onKnockoutPick(m.id, awayWinner)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── THIRD PLACE PLAYOFF ── (small, bronze styling, almost an aside) */}
      <div style={{ marginBottom:40 }}>
        <div style={{ marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:20, height:1, background:"#CD7F32" }} />
          <div style={{
            fontFamily:"'League Spartan',sans-serif", fontSize:12, fontWeight:900,
            color:"#CD7F32", textTransform:"uppercase", letterSpacing:"0.14em",
          }}>🥉 Third Place Playoff</div>
          <div style={{ flex:1, height:1, background:C.border }} />
        </div>
        <div style={{ maxWidth:380, margin:"0 auto" }}>
          <div style={{
            background:C.surface, border:`1px solid rgba(205,127,50,0.3)`,
            borderRadius:8, padding:"14px 16px",
          }}>
            <div style={{
              fontFamily:"'Quicksand',sans-serif", fontSize:10, color:"#CD7F32",
              letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10, textAlign:"center",
            }}>Bronze medal match · Match 103</div>
            <TeamPill team={tpHome} source="Loser SF1"
              isPick={knockoutPicks[103] === tpHome} isClickable={!!(tpHome && tpAway)}
              onClick={() => onKnockoutPick(103, tpHome)}
            />
            <div style={{ display:"flex", alignItems:"center", gap:8, margin:"7px 0" }}>
              <div style={{ flex:1, height:1, background:C.border }} />
              <span style={{ fontSize:9, color:"#CD7F32", fontFamily:"'League Spartan',sans-serif", fontWeight:700, letterSpacing:"0.1em" }}>VS</span>
              <div style={{ flex:1, height:1, background:C.border }} />
            </div>
            <TeamPill team={tpAway} source="Loser SF2"
              isPick={knockoutPicks[103] === tpAway} isClickable={!!(tpHome && tpAway)}
              onClick={() => onKnockoutPick(103, tpAway)}
            />
          </div>
        </div>
      </div>

      {/* ── THE FINAL ── (full hero treatment, trophy, MetLife Stadium graphic) */}
      <div style={{ marginBottom:24, position:"relative" }}>
        {/* Section header */}
        <div style={{ marginBottom:24, display:"flex", alignItems:"center", gap:14, justifyContent:"center" }}>
          <div style={{ width:60, height:2, background:`linear-gradient(90deg, transparent, ${C.gold})` }} />
          <div style={{
            fontFamily:"'League Spartan',sans-serif",
            fontSize:"clamp(20px, 4vw, 28px)", fontWeight:900,
            color:C.gold, textTransform:"uppercase",
            letterSpacing:"0.2em",
            textShadow:`0 0 20px rgba(196,159,75,0.4)`,
          }}>The Final</div>
          <div style={{ width:60, height:2, background:`linear-gradient(90deg, ${C.gold}, transparent)` }} />
        </div>

        <div style={{
          background:`linear-gradient(135deg, ${C.greenDeep} 0%, #000 40%, ${C.greenDeep} 100%)`,
          border:`3px solid ${C.gold}`, borderRadius:16,
          padding:"32px 24px 36px",
          position:"relative", overflow:"hidden",
          boxShadow: finalWinner
            ? `0 0 80px rgba(196,159,75,0.25), inset 0 0 60px rgba(196,159,75,0.05)`
            : `0 0 40px rgba(196,159,75,0.1)`,
        }}>
          {/* Background trophy watermark */}
          <div style={{
            position:"absolute", right:-50, top:-30,
            color:"rgba(196,159,75,0.06)", width:320, height:320,
            pointerEvents:"none",
          }} dangerouslySetInnerHTML={{ __html:TROPHY_SVG }} />

          <div style={{ position:"relative", textAlign:"center" }}>
            {/* Trophy + stadium info */}
            <div className="trophy-glow" style={{
              color:C.gold, width:80, height:80, margin:"0 auto 16px",
            }} dangerouslySetInnerHTML={{ __html:TROPHY_SVG }} />

            <div style={{
              fontFamily:"'League Spartan',sans-serif", fontSize:13, color:C.gold,
              fontWeight:900, letterSpacing:"0.22em", textTransform:"uppercase",
              marginBottom:4,
            }}>MetLife Stadium</div>
            <div style={{
              fontFamily:"'Quicksand',sans-serif", fontSize:12, color:C.muted,
              letterSpacing:"0.12em", marginBottom:28,
            }}>East Rutherford · New Jersey · July 19, 2026</div>

            {/* If winner already picked, show champion big */}
            {finalWinner ? (
              <div style={{ marginBottom:24 }}>
                {finalWinnerFlag && (
                  <div style={{ marginBottom:14, display:"inline-block", position:"relative" }}>
                    <div style={{
                      position:"absolute", inset:-15,
                      background:"radial-gradient(ellipse, rgba(196,159,75,0.3) 0%, transparent 70%)",
                      filter:"blur(15px)",
                    }} />
                    <img src={`https://flagcdn.com/192x144/${finalWinnerFlag}.png`} alt={finalWinner}
                      style={{
                        width:140, height:105, objectFit:"cover", borderRadius:6,
                        border:`2px solid ${C.gold}`,
                        boxShadow:`0 0 30px rgba(196,159,75,0.4)`,
                        position:"relative",
                      }}
                      onError={e=>{e.target.src=`https://flagcdn.com/h120/${finalWinnerFlag}.png`;}}
                    />
                  </div>
                )}
                <div style={{
                  fontFamily:"'League Spartan',sans-serif",
                  fontSize:"clamp(28px, 6vw, 44px)", fontWeight:900,
                  color:C.white, textTransform:"uppercase",
                  letterSpacing:"-0.02em", marginBottom:6,
                  textShadow:`0 0 30px rgba(196,159,75,0.5)`,
                }}>{finalWinner}</div>
                <div style={{
                  fontFamily:"'League Spartan',sans-serif", fontSize:11,
                  color:C.gold, fontWeight:700, letterSpacing:"0.22em",
                  textTransform:"uppercase",
                }}>◆ Your 2026 Champion ◆</div>
              </div>
            ) : null}

            {/* Pick interface (only show when both finalists known) */}
            {finalHome && finalAway ? (
              <div style={{
                background:"rgba(0,0,0,0.4)", border:`1px solid ${C.border}`,
                borderRadius:10, padding:"16px 18px", maxWidth:420, margin:"0 auto",
              }}>
                <div style={{
                  fontFamily:"'League Spartan',sans-serif", fontSize:10,
                  color:C.muted, letterSpacing:"0.14em", textTransform:"uppercase",
                  marginBottom:12, fontWeight:700,
                }}>{finalWinner ? "Change Your Pick" : "Pick Your Champion"}</div>

                <div onClick={() => onKnockoutPick(104, finalHome)} style={{
                  display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                  background: finalWinner === finalHome ? "rgba(196,159,75,0.18)" : "rgba(90,148,123,0.06)",
                  border:`1px solid ${finalWinner === finalHome ? C.gold : C.tealBorder}`,
                  borderRadius:6, cursor:"pointer", marginBottom:8, transition:"all 0.15s",
                }}>
                  {finalHomeFlag && <img src={FLAG_URL(finalHomeFlag)} alt={finalHome} style={{ width:24, height:18, objectFit:"cover", borderRadius:2 }} />}
                  <span style={{
                    fontFamily:"'League Spartan',sans-serif", fontSize:14, fontWeight:700,
                    color: finalWinner === finalHome ? C.gold : C.white, flex:1, textAlign:"left",
                    textTransform:"uppercase", letterSpacing:"0.04em",
                  }}>{finalHome}</span>
                  {finalWinner === finalHome && <span style={{ color:C.gold, fontSize:14 }}>✓</span>}
                </div>

                <div style={{ display:"flex", alignItems:"center", gap:8, margin:"6px 0" }}>
                  <div style={{ flex:1, height:1, background:C.border }} />
                  <span style={{ fontSize:11, color:C.gold, fontFamily:"'League Spartan',sans-serif", fontWeight:900, letterSpacing:"0.2em" }}>FINAL</span>
                  <div style={{ flex:1, height:1, background:C.border }} />
                </div>

                <div onClick={() => onKnockoutPick(104, finalAway)} style={{
                  display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                  background: finalWinner === finalAway ? "rgba(196,159,75,0.18)" : "rgba(90,148,123,0.06)",
                  border:`1px solid ${finalWinner === finalAway ? C.gold : C.tealBorder}`,
                  borderRadius:6, cursor:"pointer", transition:"all 0.15s",
                }}>
                  {finalAwayFlag && <img src={FLAG_URL(finalAwayFlag)} alt={finalAway} style={{ width:24, height:18, objectFit:"cover", borderRadius:2 }} />}
                  <span style={{
                    fontFamily:"'League Spartan',sans-serif", fontSize:14, fontWeight:700,
                    color: finalWinner === finalAway ? C.gold : C.white, flex:1, textAlign:"left",
                    textTransform:"uppercase", letterSpacing:"0.04em",
                  }}>{finalAway}</span>
                  {finalWinner === finalAway && <span style={{ color:C.gold, fontSize:14 }}>✓</span>}
                </div>
              </div>
            ) : (
              <div style={{
                background:"rgba(0,0,0,0.3)", border:`1px dashed ${C.border}`,
                borderRadius:10, padding:"24px 18px", maxWidth:420, margin:"0 auto",
              }}>
                <div style={{ fontSize:13, color:C.muted, fontFamily:"'Quicksand',sans-serif", lineHeight:1.6 }}>
                  Complete your Semifinal picks to choose the World Cup Champion here.
                </div>
                <div style={{ marginTop:10, fontSize:11, color:C.dim, fontFamily:"'Quicksand',sans-serif" }}>
                  Or pick directly in the <span style={{ color:C.gold }}>Champion</span> tab — they sync.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Champion Tab ──────────────────────────────────────────────────────────────
function ChampionTab({ champion, scores, liveScores, knockoutPicks, userName, setTab }) {
  const champCode = TEAM_FLAGS[champion];
  const stats = calcUserStats(scores, liveScores || {}, champion, knockoutPicks || {});

  // Bracket journey — picks across all knockout rounds
  const allPicks = Object.entries(knockoutPicks || {}).map(([id, team]) => ({
    id: parseInt(id), team, flag: TEAM_FLAGS[team]
  }));

  // Group bracket picks by round
  const r32Picks = allPicks.filter(p => p.id >= 73 && p.id <= 88);
  const r16Picks = allPicks.filter(p => p.id >= 89 && p.id <= 96);
  const qfPicks = allPicks.filter(p => p.id >= 97 && p.id <= 100);
  const sfPicks = allPicks.filter(p => p.id >= 101 && p.id <= 102);
  const finalPick = allPicks.find(p => p.id === 104);
  const thirdPick = allPicks.find(p => p.id === 103);

  // Fun stats — most-picked team across the bracket
  const teamCounts = {};
  allPicks.forEach(p => { teamCounts[p.team] = (teamCounts[p.team] || 0) + 1; });
  const mostPicked = Object.entries(teamCounts).sort((a,b) => b[1] - a[1])[0];

  // Total predictions submitted (group scores + knockout picks)
  const groupPredictionsCount = Object.values(scores || {}).filter(s => s.home !== "" && s.away !== "").length;
  const knockoutPicksCount = allPicks.length;

  const awardCount = [
    stats.exact >= 1, (stats.exact + stats.correct) >= 1,
    stats.avgDiff !== null && parseFloat(stats.avgDiff) <= 1.5,
    stats.longestStreak >= 3, stats.heartbreakers >= 1,
    stats.boldCalls >= 1, stats.goalfests >= 1, stats.realist >= 1,
    stats.groupWinnersHit >= 1, stats.perfectGroups >= 1,
    stats.defensiveCalls >= 1, stats.firstMatchExact,
    stats.longestStreak >= 5,
  ].filter(Boolean).length;

  if (!champion) {
    // No champion picked yet — direct the user to the Bracket tab
    return (
      <div className="fade-in" style={{ maxWidth:560, margin:"0 auto" }}>
        <div style={{
          background:`linear-gradient(135deg, ${C.greenDeep} 0%, #000 60%, ${C.greenDeep} 100%)`,
          border:`2px solid ${C.green}`, borderRadius:12,
          padding:"40px 28px", textAlign:"center", position:"relative", overflow:"hidden",
        }}>
          <div style={{
            position:"absolute", top:"50%", left:"50%",
            transform:"translate(-50%,-50%)", width:400, height:300,
            background:"radial-gradient(ellipse, rgba(196,159,75,0.08) 0%, transparent 70%)",
            pointerEvents:"none",
          }} />
          <div className="trophy-glow" style={{ color:C.gold, width:72, height:72, margin:"0 auto 18px", position:"relative" }} dangerouslySetInnerHTML={{ __html:TROPHY_SVG }} />
          <div style={{
            fontFamily:"'League Spartan',sans-serif", fontSize:"clamp(22px, 5vw, 32px)",
            fontWeight:900, color:C.white, textTransform:"uppercase",
            letterSpacing:"-0.01em", marginBottom:10, position:"relative",
          }}>
            No Champion Yet
          </div>
          <p style={{
            fontFamily:"'Quicksand',sans-serif", fontSize:13, color:C.muted,
            marginBottom:24, lineHeight:1.7, position:"relative",
            maxWidth:380, marginLeft:"auto", marginRight:"auto",
          }}>
            Your champion is whoever you pick to win <span style={{ color:C.gold, fontWeight:600 }}>The Final</span>. Complete your bracket predictions to crown them here.
          </p>
          <button onClick={() => setTab && setTab("bracket")} style={{
            background:C.green, border:"none", borderRadius:6,
            color:"#fff", fontFamily:"'League Spartan',sans-serif",
            fontSize:12, fontWeight:700, letterSpacing:"0.12em",
            textTransform:"uppercase", padding:"12px 28px",
            cursor:"pointer", position:"relative",
          }}>Go to The Bracket →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth:760, margin:"0 auto" }}>

      {/* ── HERO: Big flag + champion display ── */}
      <div style={{
        background:`linear-gradient(135deg, ${C.greenDeep} 0%, #000 50%, ${C.greenDeep} 100%)`,
        border:`2px solid ${C.gold}`, borderRadius:14,
        padding:"36px 28px", textAlign:"center", marginBottom:24,
        position:"relative", overflow:"hidden",
        boxShadow:`0 0 50px rgba(196,159,75,0.15)`,
      }}>
        {/* Background trophy watermark */}
        <div style={{
          position:"absolute", right:-40, top:-30,
          color:"rgba(196,159,75,0.05)", width:280, height:280,
          pointerEvents:"none",
        }} dangerouslySetInnerHTML={{ __html:TROPHY_SVG }} />

        <div style={{ position:"relative" }}>
          <div style={{
            fontFamily:"'League Spartan',sans-serif", fontSize:10,
            color:C.gold, fontWeight:700, letterSpacing:"0.22em",
            textTransform:"uppercase", marginBottom:14,
          }}>
            ◆ Your Champion Pick ◆
          </div>

          {/* MASSIVE flag */}
          {champCode && (
            <div style={{ marginBottom:18, display:"inline-block", position:"relative" }}>
              <div style={{
                position:"absolute", inset:-20,
                background:`radial-gradient(ellipse, rgba(196,159,75,0.25) 0%, transparent 70%)`,
                filter:"blur(20px)",
              }} />
              <img
                src={`https://flagcdn.com/256x192/${champCode}.png`}
                alt={champion}
                style={{
                  width:"min(280px, 70vw)",
                  height:"auto", aspectRatio:"4/3",
                  objectFit:"cover", borderRadius:8,
                  boxShadow:`0 0 40px rgba(196,159,75,0.3), 0 12px 32px rgba(0,0,0,0.5)`,
                  border:`2px solid ${C.gold}`,
                  position:"relative",
                }}
                onError={e=>{e.target.src=`https://flagcdn.com/h120/${champCode}.png`;}}
              />
            </div>
          )}

          {/* Champion name + trophy */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:14, marginBottom:8 }}>
            <div className="trophy-glow" style={{ color:C.gold, width:36, height:36 }} dangerouslySetInnerHTML={{ __html:TROPHY_SVG }} />
            <div style={{
              fontFamily:"'League Spartan',sans-serif",
              fontSize:"clamp(28px, 6vw, 44px)", fontWeight:900,
              color:C.white, textTransform:"uppercase",
              letterSpacing:"-0.02em",
              textShadow:`0 0 24px rgba(196,159,75,0.4)`,
            }}>
              {champion}
            </div>
            <div className="trophy-glow" style={{ color:C.gold, width:36, height:36, transform:"scaleX(-1)" }} dangerouslySetInnerHTML={{ __html:TROPHY_SVG }} />
          </div>

          <div style={{
            fontFamily:"'Quicksand',sans-serif", fontSize:11, color:C.muted,
            letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:18,
          }}>
            Your 2026 World Cup Champion
          </div>

          <button onClick={() => setTab && setTab("bracket")} style={{
            background:"none", border:`1px solid ${C.border}`, borderRadius:6,
            color:C.muted, fontFamily:"'League Spartan',sans-serif",
            fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase",
            padding:"9px 22px", cursor:"pointer",
          }}>Change in The Bracket →</button>

          <div style={{ marginTop:14, fontSize:10, color:C.dim, fontFamily:"'Quicksand',sans-serif" }}>
            Picks sync between Overview and The Bracket
          </div>
        </div>
      </div>

      {/* ── PROFILE STATS HEADER ── */}
      <div style={{ marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:20, height:1, background:C.green }} />
        <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:11, fontWeight:900, color:C.gold, textTransform:"uppercase", letterSpacing:"0.14em" }}>
          {userName ? `${userName}'s Profile` : "Your Profile"}
        </div>
        <div style={{ flex:1, height:1, background:C.border }} />
      </div>

      {/* Stats grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:10, marginBottom:24 }}>
        {[
          { label:"Total Points", value:stats.totalPts, color:C.gold, icon:"⭐" },
          { label:"Predictions", value:groupPredictionsCount, color:C.white, icon:"📋" },
          { label:"Accuracy", value:`${stats.accuracy}%`, color:C.green, icon:"🎯" },
          { label:"Awards Won", value:`${awardCount}/13`, color:C.gold, icon:"🏅" },
          { label:"Exact Scores", value:stats.exact, color:C.exact, icon:"💯" },
          { label:"Bracket Picks", value:knockoutPicksCount, color:C.white, icon:"⚽" },
        ].map(stat => (
          <div key={stat.label} style={{
            background:C.surface, border:`1px solid ${C.border}`,
            borderRadius:8, padding:"16px 12px", textAlign:"center",
          }}>
            <div style={{ fontSize:18, marginBottom:4 }}>{stat.icon}</div>
            <div style={{
              fontFamily:"'League Spartan',sans-serif", fontSize:26, fontWeight:900,
              color:stat.color, lineHeight:1,
            }}>{stat.value}</div>
            <div style={{
              fontFamily:"'League Spartan',sans-serif", fontSize:9,
              color:C.muted, letterSpacing:"0.12em", textTransform:"uppercase",
              marginTop:6, fontWeight:700,
            }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── BRACKET JOURNEY ── */}
      {(r32Picks.length > 0 || r16Picks.length > 0 || finalPick) && (
        <>
          <div style={{ marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:20, height:1, background:C.green }} />
            <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:11, fontWeight:900, color:C.gold, textTransform:"uppercase", letterSpacing:"0.14em" }}>
              Your Bracket Journey
            </div>
            <div style={{ flex:1, height:1, background:C.border }} />
          </div>

          <div style={{
            background:C.surface, border:`1px solid ${C.border}`,
            borderRadius:8, padding:"18px 18px", marginBottom:24,
          }}>
            {[
              { label:"Round of 32", picks:r32Picks, max:16 },
              { label:"Round of 16", picks:r16Picks, max:8 },
              { label:"Quarterfinals", picks:qfPicks, max:4 },
              { label:"Semifinals", picks:sfPicks, max:2 },
              { label:"Third Place", picks:thirdPick ? [thirdPick] : [], max:1 },
              { label:"Final Champion", picks:finalPick ? [finalPick] : [], max:1, highlight:true },
            ].map(round => (
              <div key={round.label} style={{ marginBottom:14, lastChild:{marginBottom:0} }}>
                <div style={{
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  marginBottom:8,
                }}>
                  <div style={{
                    fontFamily:"'League Spartan',sans-serif", fontSize:10,
                    color:round.highlight ? C.gold : C.muted,
                    fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase",
                  }}>{round.label}</div>
                  <div style={{
                    fontFamily:"'League Spartan',sans-serif", fontSize:9,
                    color:C.dim, letterSpacing:"0.1em",
                  }}>{round.picks.length} / {round.max}</div>
                </div>
                {round.picks.length > 0 ? (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {round.picks.map(p => (
                      <div key={p.id} style={{
                        display:"flex", alignItems:"center", gap:6,
                        background:round.highlight ? "rgba(196,159,75,0.12)" : C.tealDim,
                        border:`1px solid ${round.highlight ? C.gold : C.tealBorder}`,
                        borderRadius:4, padding:"4px 9px",
                      }}>
                        {p.flag && <img src={FLAG_URL(p.flag)} alt={p.team} style={{ width:14, height:10, objectFit:"cover", borderRadius:2 }} />}
                        <span style={{
                          fontFamily:"'Quicksand',sans-serif", fontSize:11,
                          color:round.highlight ? C.gold : C.white, fontWeight:600,
                        }}>{p.team}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    fontFamily:"'Quicksand',sans-serif", fontSize:11, color:C.dim,
                    fontStyle:"italic",
                  }}>No picks yet</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── FUN STATS / INSIGHTS ── */}
      {(mostPicked || stats.longestStreak > 0 || stats.boldCalls > 0) && (
        <>
          <div style={{ marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:20, height:1, background:C.green }} />
            <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:11, fontWeight:900, color:C.gold, textTransform:"uppercase", letterSpacing:"0.14em" }}>
              Insights
            </div>
            <div style={{ flex:1, height:1, background:C.border }} />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:10, marginBottom:24 }}>
            {mostPicked && (
              <div style={{
                background:C.surface, border:`1px solid ${C.border}`,
                borderRadius:8, padding:"14px 16px",
              }}>
                <div style={{ fontSize:18, marginBottom:6 }}>🏅</div>
                <div style={{
                  fontFamily:"'League Spartan',sans-serif", fontSize:10,
                  color:C.muted, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4,
                }}>Most Picked Team</div>
                <div style={{
                  fontFamily:"'League Spartan',sans-serif", fontSize:15,
                  color:C.white, fontWeight:900, textTransform:"uppercase",
                }}>{mostPicked[0]}</div>
                <div style={{ fontFamily:"'Quicksand',sans-serif", fontSize:11, color:C.green, marginTop:2 }}>
                  Picked {mostPicked[1]}x across bracket
                </div>
              </div>
            )}

            {stats.longestStreak > 0 && (
              <div style={{
                background:C.surface, border:`1px solid ${C.border}`,
                borderRadius:8, padding:"14px 16px",
              }}>
                <div style={{ fontSize:18, marginBottom:6 }}>🔥</div>
                <div style={{
                  fontFamily:"'League Spartan',sans-serif", fontSize:10,
                  color:C.muted, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4,
                }}>Hottest Streak</div>
                <div style={{
                  fontFamily:"'League Spartan',sans-serif", fontSize:22,
                  color:C.gold, fontWeight:900,
                }}>{stats.longestStreak}</div>
                <div style={{ fontFamily:"'Quicksand',sans-serif", fontSize:11, color:C.green, marginTop:2 }}>
                  Correct picks in a row
                </div>
              </div>
            )}

            {stats.boldCalls > 0 && (
              <div style={{
                background:C.surface, border:`1px solid ${C.border}`,
                borderRadius:8, padding:"14px 16px",
              }}>
                <div style={{ fontSize:18, marginBottom:6 }}>⚡</div>
                <div style={{
                  fontFamily:"'League Spartan',sans-serif", fontSize:10,
                  color:C.muted, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4,
                }}>Boldest Calls Nailed
                </div>
                <div style={{
                  fontFamily:"'League Spartan',sans-serif", fontSize:22,
                  color:C.gold, fontWeight:900,
                }}>{stats.boldCalls}</div>
                <div style={{ fontFamily:"'Quicksand',sans-serif", fontSize:11, color:C.green, marginTop:2 }}>
                  Exact picks · 3+ goal margin
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <div style={{
        textAlign:"center", marginTop:8,
        fontFamily:"'Quicksand',sans-serif", fontSize:11, color:C.dim, lineHeight:1.6,
      }}>
        See full awards & competition rankings on the Leaderboard tab.
      </div>
    </div>
  );
}

// ── Stats Engine for Awards Section ───────────────────────────────────────────
function calcUserStats(userScores, liveScores, champion, knockoutPicks) {
  let exact = 0, correct = 0, wrong = 0;
  let totalDiff = 0, diffCount = 0;
  let heartbreakers = 0;
  let boldCalls = 0;
  let goalfests = 0;
  let realist = 0;
  let currentStreak = 0, longestStreak = 0;
  let totalPts = 0;
  let defensiveCalls = 0; // correct 0-0 or 1-0/0-1 picks
  let firstMatchExact = false;
  let perGroupTracker = {}; // {A: {total:0, correct:0}}

  // Track which match index (chronological) we're on across all groups
  const allMatchKeys = [];
  Object.keys(GROUPS).forEach(gKey => {
    GROUPS[gKey].matches.forEach((_, idx) => {
      allMatchKeys.push(`${gKey}-${idx}`);
    });
  });

  Object.keys(GROUPS).forEach(gKey => {
    perGroupTracker[gKey] = { total: 0, correct: 0 };
    GROUPS[gKey].matches.forEach((_, idx) => {
      const key = `${gKey}-${idx}`;
      const user = userScores?.[key];
      const live = liveScores?.[key];
      const r = scoreResult(user, live);
      if (!r) return;

      totalPts += SCORE_PTS[r];
      perGroupTracker[gKey].total++;

      // First Blood — exact score on the very first match of the tournament (A-0)
      if (key === "A-0" && r === "exact") firstMatchExact = true;

      if (r === "exact" || r === "correct") {
        perGroupTracker[gKey].correct++;
      }

      if (r === "exact") {
        exact++;
        const realDiff = Math.abs((live.home - live.away));
        if (realDiff >= 3) boldCalls++;
        if ((live.home + live.away) >= 3) goalfests++;
        if ((live.home === 1 && live.away === 0) || (live.home === 0 && live.away === 1)) realist++;
        // Defensive: 0-0, 1-0, 0-1
        if ((live.home === 0 && live.away === 0) ||
            (live.home === 1 && live.away === 0) ||
            (live.home === 0 && live.away === 1)) defensiveCalls++;
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else if (r === "correct") {
        correct++;
        if ((live.home + live.away) >= 3) goalfests++;
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        wrong++;
        const ph = parseInt(user.home), pa = parseInt(user.away);
        const homeOff = Math.abs(ph - live.home);
        const awayOff = Math.abs(pa - live.away);
        if (homeOff + awayOff === 1) heartbreakers++;
        currentStreak = 0;
      }

      const ph = parseInt(user.home), pa = parseInt(user.away);
      totalDiff += Math.abs(ph - live.home) + Math.abs(pa - live.away);
      diffCount++;
    });
  });

  const avgDiff = diffCount > 0 ? (totalDiff / diffCount).toFixed(2) : null;
  const totalPredictions = exact + correct + wrong;
  const accuracy = totalPredictions > 0 ? Math.round(((exact + correct) / totalPredictions) * 100) : 0;

  // Group Whisperer — count groups where user predicted the actual 1st-place team correctly
  let groupWinnersHit = 0;
  Object.keys(GROUPS).forEach(gKey => {
    // Calculate actual standings from live scores only
    const liveOnly = {};
    GROUPS[gKey].matches.forEach((_, idx) => {
      const k = `${gKey}-${idx}`;
      if (liveScores[k]?.status === "FINISHED") liveOnly[k] = liveScores[k];
    });
    const userOnly = {};
    GROUPS[gKey].matches.forEach((_, idx) => {
      const k = `${gKey}-${idx}`;
      if (userScores[k]) userOnly[k] = userScores[k];
    });
    // Only count if group fully completed
    const allDone = GROUPS[gKey].matches.every((_, idx) => liveScores[`${gKey}-${idx}`]?.status === "FINISHED");
    if (allDone) {
      const actualStandings = calcStandings(gKey, {}, liveScores);
      const userStandings = calcStandings(gKey, userScores, {});
      if (actualStandings[0]?.team === userStandings[0]?.team) groupWinnersHit++;
    }
  });

  // Group Stage Sweeper — got every match in a single group correct (3+ correct of 6)
  let perfectGroups = 0;
  Object.keys(perGroupTracker).forEach(gKey => {
    if (perGroupTracker[gKey].total === 6 && perGroupTracker[gKey].correct === 6) perfectGroups++;
  });

  return {
    exact, correct, wrong,
    avgDiff, totalPredictions, accuracy,
    heartbreakers, boldCalls, goalfests, realist,
    longestStreak, totalPts,
    defensiveCalls, firstMatchExact, groupWinnersHit, perfectGroups,
  };
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
function LeaderboardTab({ userName, scores, liveScores, champion, knockoutPicks }) {
  const [entries, setEntries] = useState([]);
  const [allPredictions, setAllPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Refresh leaderboard from Supabase every 5s
  useEffect(() => {
    const fetchEntries = async () => {
      const rows = await loadAllPredictions();
      // Map Supabase rows to leaderboard entry shape used by the rest of the UI
      const mapped = rows.map(r => ({
        name: r.name,
        champion: r.champion,
        pts: 0, // calculated dynamically from live scores below
        scores: r.scores || {},
        knockoutPicks: r.knockout_picks || {},
      }));
      setEntries(mapped);
      setAllPredictions(rows);
      setLoading(false);
    };
    fetchEntries();
    const interval = setInterval(fetchEntries, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculate real points from live scores
  const calcPoints = (userScores) => {
    let pts = 0;
    Object.keys(GROUPS).forEach(gKey => {
      GROUPS[gKey].matches.forEach(([,],idx) => {
        const key = `${gKey}-${idx}`;
        const r = scoreResult(userScores?.[key], liveScores[key]);
        if(r) pts += SCORE_PTS[r];
      });
    });
    return pts;
  };

  if(loading) return <div style={{ color:C.muted,fontFamily:"'Quicksand',sans-serif",fontSize:13,padding:20 }}>Loading...</div>;
  const myPts = calcPoints(scores);

  // Always include current user if they have a name set, even if shared storage hasn't synced yet
  let workingEntries = [...entries];
  if (userName && !workingEntries.find(e => e.name === userName)) {
    workingEntries.push({ name: userName, pts: 0, champion, scores: scores, knockoutPicks });
  }
  // Calculate points dynamically for every entry using their stored scores vs live results
  const enriched = workingEntries.map(e => {
    const userScores = e.name === userName ? scores : (e.scores || {});
    const pts = calcPoints(userScores);
    return { ...e, pts };
  });
  const sorted = [...enriched].sort((a,b)=>b.pts-a.pts);

  // Dynamic text sizing — bigger for top 3, normal for 4+
  const getRowSize = (i) => {
    if (i === 0) return { name: 22, pts: 36, padding: "22px 20px", rankSize: 30 };
    if (i === 1) return { name: 18, pts: 30, padding: "18px 20px", rankSize: 26 };
    if (i === 2) return { name: 16, pts: 26, padding: "16px 20px", rankSize: 22 };
    return { name: 14, pts: 22, padding: "14px 20px", rankSize: 20 };
  };

  const medalColor = i => i === 0 ? C.gold : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : C.muted;

  // Calculate my stats for awards
  const myStats = calcUserStats(scores, liveScores, champion, knockoutPicks);

  // Build awards list with progress
  const awards = [
    { id:"sharpshooter", title:"Sharpshooter", subtitle:"Most exact scorelines", value:myStats.exact, suffix:"exact", icon:"🎯", unlocked:myStats.exact >= 1 },
    { id:"pundit", title:"The Pundit", subtitle:"Correct results called", value:myStats.exact + myStats.correct, suffix:"correct", icon:"📊", unlocked:(myStats.exact + myStats.correct) >= 1 },
    { id:"mathematician", title:"Goal Mathematician", subtitle:"Avg scoreline difference", value:myStats.avgDiff || "—", suffix:"off avg", icon:"📐", unlocked:myStats.avgDiff !== null && parseFloat(myStats.avgDiff) <= 1.5 },
    { id:"streak", title:"Streak Master", subtitle:"Longest correct streak", value:myStats.longestStreak, suffix:"in a row", icon:"🔥", unlocked:myStats.longestStreak >= 3 },
    { id:"heartbreak", title:"Heartbreak Kid", subtitle:"Off by just one goal", value:myStats.heartbreakers, suffix:"close calls", icon:"💔", unlocked:myStats.heartbreakers >= 1 },
    { id:"bold", title:"Bold Caller", subtitle:"Exact picks · 3+ goal margin", value:myStats.boldCalls, suffix:"bold", icon:"⚡", unlocked:myStats.boldCalls >= 1 },
    { id:"goalfest", title:"Goal Gambler", subtitle:"Correct on 3+ goal matches", value:myStats.goalfests, suffix:"goalfests", icon:"⚽", unlocked:myStats.goalfests >= 1 },
    { id:"realist", title:"The Realist", subtitle:"Correct 1-0 / 0-1 picks", value:myStats.realist, suffix:"grinders", icon:"🛡️", unlocked:myStats.realist >= 1 },
    { id:"whisperer", title:"Group Whisperer", subtitle:"Group winners correctly called", value:myStats.groupWinnersHit, suffix:"of 12", icon:"🔮", unlocked:myStats.groupWinnersHit >= 1 },
    { id:"sweeper", title:"Group Sweeper", subtitle:"All 6 matches in a group correct", value:myStats.perfectGroups, suffix:"perfect", icon:"🧹", unlocked:myStats.perfectGroups >= 1 },
    { id:"defensive", title:"Defensive Mastermind", subtitle:"Exact on 0-0, 1-0 or 0-1 matches", value:myStats.defensiveCalls, suffix:"clean", icon:"🧱", unlocked:myStats.defensiveCalls >= 1 },
    { id:"firstblood", title:"First Blood", subtitle:"Exact score on tournament opener", value:myStats.firstMatchExact ? "✓" : "—", suffix:myStats.firstMatchExact ? "nailed it" : "Match A-0", icon:"🩸", unlocked:myStats.firstMatchExact },
    { id:"crystalball", title:"Crystal Ball", subtitle:"5+ exact scores in a row", value:myStats.longestStreak, suffix:"streak", icon:"🔯", unlocked:myStats.longestStreak >= 5 },
    { id:"oracle", title:"The Oracle", subtitle:"Picked the actual champion", value:champion || "—", suffix:champion ? "selected" : "no pick", icon:"👁️", unlocked:false }, // unlocked logic determined post-final
    { id:"laughs", title:"Last Laugh", subtitle:"Exact score on the final", value:knockoutPicks?.[104] || "—", suffix:knockoutPicks?.[104] ? "picked" : "no pick", icon:"🏆", unlocked:false },
  ];

  const leader = sorted[0];
  const leaderFlag = leader && TEAM_FLAGS[leader.champion];

  if (sorted.length === 0) {
    return (
      <div className="fade-in" style={{ maxWidth:600, margin:"0 auto" }}>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:40, textAlign:"center" }}>
          <div style={{ color:C.gold, width:48, height:48, margin:"0 auto 14px" }} dangerouslySetInnerHTML={{ __html:TROPHY_SVG }} />
          <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:18, fontWeight:900, color:C.white, textTransform:"uppercase", marginBottom:8 }}>
            No Entries Yet
          </div>
          <p style={{ color:C.muted, fontFamily:"'Quicksand',sans-serif", fontSize:13, lineHeight:1.7 }}>
            Save your predictions to appear here, then share the app link with friends to start the competition.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth:700, margin:"0 auto" }}>

      {/* ── LEADER HERO ── */}
      <div style={{
        background:`linear-gradient(135deg, ${C.greenDeep} 0%, #000 60%, ${C.greenDeep} 100%)`,
        border:`2px solid ${C.gold}`,
        borderRadius:12, padding:"28px 24px",
        marginBottom:24, textAlign:"center",
        position:"relative", overflow:"hidden",
        boxShadow:`0 0 40px rgba(196,159,75,0.15)`,
      }}>
        {/* Background trophy watermark */}
        <div style={{
          position:"absolute", right:-20, top:-20,
          color:"rgba(196,159,75,0.04)", width:200, height:200,
          pointerEvents:"none",
        }} dangerouslySetInnerHTML={{ __html:TROPHY_SVG }} />

        {/* Gold gradient glow */}
        <div style={{
          position:"absolute", top:"50%", left:"50%",
          transform:"translate(-50%,-50%)", width:400, height:200,
          background:"radial-gradient(ellipse, rgba(196,159,75,0.15) 0%, transparent 70%)",
          pointerEvents:"none",
        }} />

        <div style={{ position:"relative" }}>
          {/* Crown label */}
          <div style={{
            fontFamily:"'League Spartan',sans-serif", fontSize:10,
            color:C.gold, fontWeight:900, letterSpacing:"0.22em",
            textTransform:"uppercase", marginBottom:14,
          }}>
            ◆ Current Leader ◆
          </div>

          {/* Trophy icon + name */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:14, marginBottom:8 }}>
            <div className="trophy-glow" style={{ color:C.gold, width:44, height:44 }} dangerouslySetInnerHTML={{ __html:TROPHY_SVG }} />
            <div style={{
              fontFamily:"'League Spartan',sans-serif",
              fontSize:"clamp(24px,5vw,38px)", fontWeight:900,
              color:C.white, textTransform:"uppercase",
              letterSpacing:"-0.02em",
              textShadow:`0 0 24px rgba(196,159,75,0.5)`,
            }}>
              {leader.name}
            </div>
            <div className="trophy-glow" style={{ color:C.gold, width:44, height:44, transform:"scaleX(-1)" }} dangerouslySetInnerHTML={{ __html:TROPHY_SVG }} />
          </div>

          {leader.champion && leaderFlag && (
            <div style={{ fontFamily:"'Quicksand',sans-serif", fontSize:11, color:C.muted, marginTop:4, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              Picks <img src={FLAG_URL(leaderFlag)} alt={leader.champion} style={{ width:16, height:12, objectFit:"cover", borderRadius:2 }} /> {leader.champion} to lift it
            </div>
          )}

          {/* Big points */}
          <div style={{ marginTop:14 }}>
            <span style={{
              fontFamily:"'League Spartan',sans-serif",
              fontSize:48, fontWeight:900, color:C.gold,
              lineHeight:1,
            }}>{leader.pts}</span>
            <span style={{
              fontFamily:"'League Spartan',sans-serif",
              fontSize:14, color:C.muted, marginLeft:8,
              letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:700,
            }}>pts</span>
          </div>

          {leader.name === userName && (
            <div style={{
              marginTop:12, display:"inline-block",
              fontFamily:"'League Spartan',sans-serif", fontSize:10, fontWeight:700,
              letterSpacing:"0.14em", textTransform:"uppercase",
              color:C.green, background:C.tealDim,
              border:`1px solid ${C.tealBorder}`, borderRadius:20,
              padding:"4px 14px",
            }}>★ That's You ★</div>
          )}
        </div>
      </div>

      {/* ── STANDINGS LIST ── */}
      <div style={{ marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:20, height:1, background:C.green }} />
        <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:11, fontWeight:900, color:C.gold, textTransform:"uppercase", letterSpacing:"0.14em" }}>
          Standings
        </div>
        <div style={{ flex:1, height:1, background:C.border }} />
      </div>

      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden", marginBottom:28 }}>
        {sorted.map((entry, i) => {
          const code = TEAM_FLAGS[entry.champion];
          const size = getRowSize(i);
          const isLeader = i === 0;
          const isMe = entry.name === userName;
          return (
            <div key={entry.name} style={{
              display:"flex", alignItems:"center",
              padding:size.padding,
              borderTop:i>0?`1px solid ${C.border}`:"none",
              background:isLeader
                ? `linear-gradient(90deg, rgba(196,159,75,0.08) 0%, rgba(196,159,75,0.02) 100%)`
                : isMe ? "rgba(90,148,123,0.06)" : "transparent",
              position:"relative",
            }}>
              {/* Gold left accent for leader */}
              {isLeader && (
                <div style={{
                  position:"absolute", left:0, top:0, bottom:0, width:3,
                  background:`linear-gradient(180deg, ${C.gold}, ${C.greenDark})`,
                }} />
              )}

              <div style={{
                fontFamily:"'League Spartan',sans-serif",
                fontSize:size.rankSize, fontWeight:900,
                color:medalColor(i), width:42, textAlign:"center",
                textShadow:isLeader?`0 0 12px rgba(196,159,75,0.6)`:"none",
              }}>
                {i+1}
              </div>

              <div style={{ flex:1, marginLeft:10 }}>
                <div style={{
                  fontSize:size.name, fontWeight:isLeader?900:700,
                  fontFamily:"'League Spartan',sans-serif",
                  textTransform:"uppercase", letterSpacing:"0.03em",
                  color:isLeader ? C.gold : isMe ? C.green : C.white,
                  display:"flex", alignItems:"center", gap:8,
                }}>
                  {entry.name}
                  {isLeader && <span style={{ fontSize:14, color:C.gold }}>♛</span>}
                  {isMe && <span style={{ fontSize:9, color:C.green, letterSpacing:"0.1em" }}>YOU</span>}
                </div>
                {entry.champion && code && (
                  <div style={{ fontSize:11, color:C.muted, marginTop:3, fontFamily:"'Quicksand',sans-serif", display:"flex", alignItems:"center", gap:5 }}>
                    <img src={FLAG_URL(code)} alt={entry.champion} style={{ width:14, height:10, objectFit:"cover", borderRadius:2 }} />
                    {entry.champion}
                  </div>
                )}
              </div>

              <div style={{ textAlign:"right" }}>
                <div style={{
                  fontSize:size.pts, fontWeight:900,
                  fontFamily:"'League Spartan',sans-serif",
                  color:isLeader ? C.gold : C.white,
                  lineHeight:1,
                }}>{entry.pts}</div>
                <div style={{ fontSize:9, color:C.muted, letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:"'League Spartan',sans-serif", marginTop:2 }}>pts</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── PERSONAL STATS / AWARDS ── */}
      <div style={{ marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:20, height:1, background:C.green }} />
        <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:11, fontWeight:900, color:C.gold, textTransform:"uppercase", letterSpacing:"0.14em" }}>
          Your Stats & Awards
        </div>
        <div style={{ flex:1, height:1, background:C.border }} />
      </div>

      {/* Stats summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(120px, 1fr))", gap:10, marginBottom:20 }}>
        {[
          { label:"Predictions", value:myStats.totalPredictions, color:C.white },
          { label:"Accuracy", value:`${myStats.accuracy}%`, color:C.green },
          { label:"Exact Scores", value:myStats.exact, color:C.exact },
          { label:"Avg Off By", value:myStats.avgDiff ?? "—", color:C.gold },
        ].map(stat => (
          <div key={stat.label} style={{
            background:C.surface, border:`1px solid ${C.border}`,
            borderRadius:6, padding:"12px 14px", textAlign:"center",
          }}>
            <div style={{
              fontFamily:"'League Spartan',sans-serif", fontSize:24, fontWeight:900,
              color:stat.color, lineHeight:1,
            }}>{stat.value}</div>
            <div style={{
              fontFamily:"'League Spartan',sans-serif", fontSize:9,
              color:C.muted, letterSpacing:"0.12em", textTransform:"uppercase",
              marginTop:6, fontWeight:700,
            }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Awards grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:10, marginBottom:24 }}>
        {awards.map(award => (
          <div key={award.id} style={{
            background: award.unlocked ? `linear-gradient(135deg, rgba(196,159,75,0.08), ${C.surface})` : C.surface,
            border:`1px solid ${award.unlocked ? "rgba(196,159,75,0.3)" : C.border}`,
            borderRadius:6, padding:"14px 16px",
            opacity: award.unlocked ? 1 : 0.5,
            position:"relative", overflow:"hidden",
          }}>
            {award.unlocked && (
              <div style={{
                position:"absolute", top:8, right:8,
                fontSize:8, color:C.gold, fontFamily:"'League Spartan',sans-serif",
                fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase",
                background:"rgba(196,159,75,0.12)", border:"1px solid rgba(196,159,75,0.3)",
                borderRadius:3, padding:"2px 6px",
              }}>Unlocked</div>
            )}
            <div style={{ fontSize:28, marginBottom:6 }}>{award.icon}</div>
            <div style={{
              fontFamily:"'League Spartan',sans-serif", fontSize:13, fontWeight:900,
              color:award.unlocked?C.gold:C.muted, textTransform:"uppercase",
              letterSpacing:"0.04em", marginBottom:2,
            }}>{award.title}</div>
            <div style={{
              fontFamily:"'Quicksand',sans-serif", fontSize:10, color:C.muted,
              marginBottom:8, lineHeight:1.4,
            }}>{award.subtitle}</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
              <span style={{
                fontFamily:"'League Spartan',sans-serif", fontSize:22, fontWeight:900,
                color:award.unlocked?C.white:C.dim, lineHeight:1,
              }}>{award.value}</span>
              <span style={{
                fontFamily:"'League Spartan',sans-serif", fontSize:9,
                color:C.muted, letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:700,
              }}>{award.suffix}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize:11, color:C.dim, lineHeight:1.6, fontFamily:"'Quicksand',sans-serif", textAlign:"center" }}>
        Scoring: 3 pts correct result · 5 pts exact scoreline · Updates automatically as real results come in
      </div>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("groups");
  const [scores, setScores] = useState({});
  const [champion, setChampion] = useState("");
  const [userName, setUserName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liveScores, setLiveScores] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [liveStatus, setLiveStatus] = useState(null);
  const [knockoutPicks, setKnockoutPicks] = useState({});

  // Load saved state from Supabase using the locally-stored user name
  useEffect(()=>{
    (async()=>{
      const storedName = getStoredName();
      if (storedName) {
        setUserName(storedName);
        const d = await loadUserPredictions(storedName);
        if (d) {
          setScores(d.scores || {});
          setChampion(d.champion || "");
          setKnockoutPicks(d.knockout_picks || {});
        }
      }
      setLoading(false);
    })();
  },[]);

  // Fetch live scores on mount and every 90 seconds
  useEffect(()=>{
    const fetchAndParse = async () => {
      const raw = await fetchLiveMatches();
      if(raw){
        const parsed = parseApiMatches(raw);
        setLiveScores(parsed);
        setLastUpdated(new Date().toLocaleTimeString());
        const hasLive = Object.values(parsed).some(s=>s.status==="IN_PLAY"||s.status==="PAUSED");
        const hasFinished = Object.values(parsed).some(s=>s.status==="FINISHED");
        if(hasLive) setLiveStatus("Live now");
        else if(hasFinished) setLiveStatus("Results available");
        else setLiveStatus(null);
      }
    };
    fetchAndParse();
    const interval = setInterval(fetchAndParse, 90000);
    return ()=>clearInterval(interval);
  },[]);

  const handleScore = useCallback((key,side,val)=>{
    setScores(prev=>({...prev,[key]:{...(prev[key]||{home:"",away:""}), [side]:val}}));
    setSaved(false);
  },[]);

  // Auto-save: debounced save to Supabase whenever data changes
  useEffect(() => {
    if (!userName) return;
    const timer = setTimeout(async () => {
      const ok = await saveUserPredictions(userName, scores, champion, knockoutPicks);
      if (ok) setSaved(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, [scores, champion, knockoutPicks, userName]);

  const handleSave = async () => {
    const name = userName || nameInput.trim();
    if (!name) return;
    if (!userName) {
      setUserName(name);
      setStoredName(name);
      // Load any existing predictions for this name
      const existing = await loadUserPredictions(name);
      if (existing) {
        setScores(existing.scores || {});
        setChampion(existing.champion || "");
        setKnockoutPicks(existing.knockout_picks || {});
      }
    }
    const ok = await saveUserPredictions(name, scores, champion, knockoutPicks);
    if (ok) setSaved(true);
  };

  if(loading) return (
    <div style={{ background:"#000",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ fontFamily:"'League Spartan',sans-serif",fontSize:18,color:C.green,textTransform:"uppercase",letterSpacing:"0.1em" }}>Loading...</div>
    </div>
  );

  const qualifyingThirds = getThirdPlaceQualifiers(scores, liveScores);

  return (
    <>
      <style>{css}</style>
      <div style={{ background:C.bg,minHeight:"100vh",color:C.white,fontFamily:"'Quicksand',sans-serif" }}>
        <Hero liveStatus={liveStatus} />
        <Nav tab={tab} setTab={setTab} />
        <div style={{ maxWidth:1100,margin:"0 auto",padding:"28px 16px 60px" }}>

          {!userName&&(
            <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"16px 20px",marginBottom:24,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap" }}>
              <div style={{ flex:1,minWidth:200 }}>
                <div style={{ fontFamily:"'League Spartan',sans-serif",fontSize:12,fontWeight:700,color:C.white,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2 }}>Enter your name</div>
                <div style={{ fontFamily:"'Quicksand',sans-serif",fontSize:12,color:C.muted }}>Save predictions and join the leaderboard</div>
              </div>
              <input placeholder="Your name" value={nameInput} onChange={e=>setNameInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSave()} style={{ background:"#050D08",border:`1px solid ${C.border}`,borderRadius:6,color:C.white,fontFamily:"'Quicksand',sans-serif",fontSize:14,fontWeight:500,padding:"9px 14px",flex:1,minWidth:160 }} />
              <button className="save-btn" onClick={handleSave} style={{ background:C.green,border:"none",borderRadius:6,color:"#fff",fontFamily:"'League Spartan',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",padding:"9px 22px",cursor:"pointer" }}>Enter</button>
            </div>
          )}

          {userName&&tab==="groups"&&(
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <div style={{ fontSize:11,color:C.muted,fontFamily:"'Quicksand',sans-serif" }}>Signed in as <span style={{ color:C.green,fontWeight:700 }}>{userName}</span></div>
              <div style={{
                display:"flex", alignItems:"center", gap:6,
                fontFamily:"'League Spartan',sans-serif", fontSize:10, fontWeight:700,
                letterSpacing:"0.12em", textTransform:"uppercase",
                color:saved ? C.green : C.muted,
              }}>
                <span style={{
                  width:6, height:6, borderRadius:"50%",
                  background:saved ? C.green : C.gold,
                  display:"inline-block",
                }} className={!saved ? "live-dot" : ""} />
                {saved ? "Auto-saved" : "Saving..."}
              </div>
            </div>
          )}

          {tab==="groups"&&(
            <div>
              <div style={{ fontFamily:"'League Spartan',sans-serif",fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:C.gold,fontWeight:700,marginBottom:16 }}>All 12 Groups — 72 Matches</div>
              <ThirdPlaceTracker scores={scores} liveScores={liveScores} />
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(330px,1fr))",gap:12 }}>
                {Object.keys(GROUPS).map(g=><GroupCard key={g} groupKey={g} scores={scores} onScore={handleScore} qualifyingThirds={qualifyingThirds} liveScores={liveScores} />)}
              </div>
            </div>
          )}

          {tab==="results"&&<ResultsTab liveScores={liveScores} scores={scores} lastUpdated={lastUpdated} />}
          {tab==="bracket"&&<BracketTab scores={scores} liveScores={liveScores} champion={champion} knockoutPicks={knockoutPicks} onKnockoutPick={(id,pick)=>{
            setKnockoutPicks(p=>({...p,[id]:pick}));
            // Two-way sync: final match pick = champion
            if (id === 104) setChampion(pick);
          }} />}
          {tab==="champion"&&<ChampionTab
            champion={champion}
            scores={scores}
            liveScores={liveScores}
            knockoutPicks={knockoutPicks}
            userName={userName}
            setTab={setTab}
          />}
          {tab==="leaderboard"&&<LeaderboardTab userName={userName} scores={scores} liveScores={liveScores} champion={champion} knockoutPicks={knockoutPicks} />}
        </div>

        {/* Footer */}
        <footer style={{
          borderTop:`1px solid ${C.border}`,
          background:`linear-gradient(180deg, #000 0%, ${C.greenDeep} 100%)`,
          padding:"32px 20px 28px",
          textAlign:"center",
        }}>
          <div style={{
            fontFamily:"'Quicksand',sans-serif", fontSize:11,
            color:C.muted, letterSpacing:"0.16em", textTransform:"uppercase",
            marginBottom:10,
          }}>
            Site Designed By
          </div>
          <div style={{
            fontFamily:"'League Spartan',sans-serif",
            fontSize:28, fontWeight:900,
            color:C.white, letterSpacing:"-0.04em",
            lineHeight:1, display:"inline-flex", alignItems:"baseline",
          }}>
            petty<span style={{ color:C.green }}>.</span>
          </div>
          <div style={{
            marginTop:20, fontFamily:"'Quicksand',sans-serif",
            fontSize:10, color:C.dim, letterSpacing:"0.1em",
          }}>
            © 2026 · Built for the love of the game
          </div>
        </footer>
      </div>
    </>
  );
}
