import { useState, useEffect, useCallback, useRef } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
const API_KEY = "91d5bb3d161b46c081cbe26611058ca0";
// On deploy this becomes: const API_KEY = import.meta.env.VITE_FOOTBALL_API_KEY;
// Direct calls blocked by CORS in browser — on deploy, route through /api/matches proxy
// For now we use a CORS proxy for development/preview purposes
const API_BASE = `https://corsproxy.io/?https://api.football-data.org/v4/competitions/WC/matches`;

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

// ── Storage ───────────────────────────────────────────────────────────────────
async function loadData(key, shared=false) {
  try{const r=await window.storage.get(key,shared);return r?JSON.parse(r.value):null;}catch{return null;}
}
async function saveData(key, value, shared=false) {
  try{await window.storage.set(key,JSON.stringify(value),shared);}catch{}
}

// ── Live API Fetch ────────────────────────────────────────────────────────────
async function fetchLiveMatches() {
  try {
    const res = await fetch(API_BASE, {
      headers: { "X-Auth-Token": API_KEY }
    });
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
      <div style={{ display:"flex",justifyContent:"center",flexWrap:"wrap",gap:"6px 18px",fontSize:11,color:C.muted,fontFamily:"'Quicksand',sans-serif",letterSpacing:"0.08em" }}>
        {["June 11 — July 19, 2026","48 Teams","12 Groups","104 Matches","MetLife Stadium Final"].map((item,i,arr)=>(
          <span key={item} style={{ display:"flex",alignItems:"center",gap:18 }}>
            {item}{i<arr.length-1&&<span style={{ color:C.dim,marginLeft:-8 }}>·</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav({ tab, setTab }) {
  return (
    <div style={{ borderBottom:`1px solid ${C.border}`,background:C.bg,position:"sticky",top:0,zIndex:100 }}>
      <div style={{ maxWidth:1100,margin:"0 auto",display:"flex",overflowX:"auto" }}>
        {[["groups","Groups"],["results","Live Results"],["bracket","Bracket / R32"],["champion","Champion"],["leaderboard","Leaderboard"]].map(([id,label])=>(
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
  const statusLabel = liveScore?.status === "IN_PLAY" || liveScore?.status === "PAUSED" ? "LIVE" :
                      liveScore?.status === "FINISHED" ? "FT" :
                      liveScore?.status === "SCHEDULED" ? null : null;

  return (
    <div style={{ borderTop:`1px solid ${C.border}` }}>
      <div style={{ display:"flex",alignItems:"center",padding:"7px 12px",gap:8 }}>
        {/* Home */}
        <span style={{ flex:1,fontSize:11,color:C.muted,textAlign:"right",fontFamily:"'Quicksand',sans-serif",display:"flex",alignItems:"center",justifyContent:"flex-end",gap:5 }}>
          {home}<Flag team={home} size={13} />
        </span>

        {/* User prediction */}
        <div style={{ display:"flex",alignItems:"center",gap:4 }}>
          <ScoreInput value={s.home} onChange={v=>onScore(matchKey,"home",v)} disabled={liveScore?.status==="FINISHED"} />
          <span style={{ color:C.green,fontSize:11,fontFamily:"'League Spartan',sans-serif",fontWeight:700 }}>:</span>
          <ScoreInput value={s.away} onChange={v=>onScore(matchKey,"away",v)} disabled={liveScore?.status==="FINISHED"} />
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

// ── Bracket Tab ───────────────────────────────────────────────────────────────
function BracketTab({ scores, liveScores, champion, knockoutPicks, onKnockoutPick }) {
  const winners = getGroupWinners(scores, liveScores);

  const TeamSlot = ({ group, pos, thirdFrom }) => {
    if (pos === "third") return (
      <div style={{ display:"flex",alignItems:"center",gap:6,padding:"4px 8px",background:C.tealDim,border:`1px solid ${C.tealBorder}`,borderRadius:4,minWidth:130 }}>
        <span style={{ fontSize:9,fontFamily:"'League Spartan',sans-serif",fontWeight:700,color:C.green,textTransform:"uppercase",letterSpacing:"0.06em" }}>3rd</span>
        <span style={{ fontSize:10,color:C.green,fontFamily:"'Quicksand',sans-serif" }}>Grp {thirdFrom}</span>
      </div>
    );
    const standing = pos==="winner"?winners[group]?.first:winners[group]?.second;
    const hasData = standing?.played>0;
    const team = hasData?standing.team:null;
    return (
      <div style={{ display:"flex",alignItems:"center",gap:6,padding:"4px 8px",background:hasData?"rgba(196,159,75,0.07)":"#080808",border:`1px solid ${hasData?"rgba(196,159,75,0.25)":C.border}`,borderRadius:4,minWidth:130 }}>
        <span style={{ fontSize:9,color:hasData?C.gold:C.dim,fontFamily:"'League Spartan',sans-serif",fontWeight:700,width:14 }}>{pos==="winner"?"1":"2"}</span>
        {team?<Flag team={team} size={13} />:<span style={{ width:17,height:13,background:C.border,borderRadius:2,display:"inline-block" }} />}
        <span style={{ fontSize:11,color:hasData?C.white:C.dim,fontFamily:"'Quicksand',sans-serif",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{team||"TBD"}</span>
      </div>
    );
  };

  const champCode = TEAM_FLAGS[champion];

  return (
    <div className="fade-in">
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:"'League Spartan',sans-serif",fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:C.gold,fontWeight:700,marginBottom:6 }}>Official Round of 32 Bracket</div>
        <p style={{ fontSize:12,color:C.muted,fontFamily:"'Quicksand',sans-serif" }}>
          Official FIFA-confirmed R32 pairings. Group stage winners/runners-up populate as results come in. Third-place slots show which groups they come from — exact assignment via FIFA Matrix once all 8 thirds are known.
        </p>
      </div>

      <div style={{ textAlign:"center",marginBottom:28 }}>
        <div style={{ display:"inline-block",background:`linear-gradient(135deg,${C.greenDeep} 0%,#000 100%)`,border:`2px solid ${C.green}`,borderRadius:12,padding:"20px 32px" }}>
          <div className="trophy-glow" style={{ color:C.gold,width:64,height:64,margin:"0 auto 12px" }} dangerouslySetInnerHTML={{ __html:TROPHY_SVG }} />
          {champion ? (
            <>
              {champCode&&<img src={FLAG_URL(champCode)} alt={champion} style={{ width:32,height:24,objectFit:"cover",borderRadius:3,marginBottom:4 }} />}
              <div style={{ fontFamily:"'League Spartan',sans-serif",fontSize:14,fontWeight:900,color:C.gold,textTransform:"uppercase" }}>{champion}</div>
              <div style={{ fontSize:9,color:C.muted,letterSpacing:"0.1em",marginTop:2,fontFamily:"'League Spartan',sans-serif",textTransform:"uppercase" }}>Your Pick</div>
            </>
          ) : <div style={{ fontSize:11,color:C.muted,fontFamily:"'Quicksand',sans-serif" }}>Pick your champion →</div>}
        </div>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10 }}>
        {R32_MATCHES.map(m=>(
          <div key={m.id} style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,overflow:"hidden" }}>
            <div style={{ padding:"6px 10px",borderBottom:`1px solid ${C.border}`,background:`linear-gradient(90deg,${C.greenDark},#050D08)`,display:"flex",alignItems:"center",gap:8 }}>
              <div style={{ width:3,height:14,background:C.green,borderRadius:1 }} />
              <span style={{ fontFamily:"'League Spartan',sans-serif",fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.12em" }}>{m.label} · R32</span>
            </div>
            <div style={{ padding:"10px" }}>
              <TeamSlot group={m.home.group} pos={m.home.pos} thirdFrom={m.home.from} />
              <div style={{ display:"flex",alignItems:"center",gap:8,margin:"6px 0" }}>
                <div style={{ flex:1,height:1,background:C.border }} />
                <span style={{ fontSize:9,color:C.green,fontFamily:"'League Spartan',sans-serif",fontWeight:700 }}>VS</span>
                <div style={{ flex:1,height:1,background:C.border }} />
              </div>
              <TeamSlot group={m.away.group} pos={m.away.pos} thirdFrom={m.away.from} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Champion Tab ──────────────────────────────────────────────────────────────
function ChampionTab({ champion, setChampion, onSave, saved }) {
  const champCode = TEAM_FLAGS[champion];
  return (
    <div className="fade-in" style={{ maxWidth:480,margin:"0 auto" }}>
      {champion ? (
        <div style={{ textAlign:"center",background:C.surface,border:`2px solid ${C.green}`,borderRadius:10,padding:40 }}>
          <div className="trophy-glow" style={{ color:C.gold,width:52,height:52,margin:"0 auto 16px" }} dangerouslySetInnerHTML={{ __html:TROPHY_SVG }} />
          {champCode&&<img src={FLAG_URL(champCode)} alt={champion} style={{ width:64,height:48,objectFit:"cover",borderRadius:4,marginBottom:12 }} />}
          <div style={{ fontFamily:"'League Spartan',sans-serif",fontSize:26,fontWeight:900,color:C.white,textTransform:"uppercase",letterSpacing:"-0.01em",marginBottom:6 }}>{champion}</div>
          <div style={{ fontFamily:"'Quicksand',sans-serif",fontSize:11,color:C.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:28 }}>Your 2026 World Cup Champion</div>
          <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
            <button onClick={()=>setChampion("")} style={{ background:"none",border:`1px solid ${C.border}`,borderRadius:6,color:C.muted,fontFamily:"'League Spartan',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",padding:"9px 18px",cursor:"pointer" }}>Change</button>
            <button className="save-btn" onClick={onSave} style={{ background:C.green,border:"none",borderRadius:6,color:"#fff",fontFamily:"'League Spartan',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",padding:"9px 20px",cursor:"pointer" }}>{saved?"Saved":"Save Pick"}</button>
          </div>
        </div>
      ) : (
        <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:28 }}>
          <div style={{ fontFamily:"'League Spartan',sans-serif",fontSize:20,fontWeight:900,color:C.white,textTransform:"uppercase",marginBottom:8 }}>Who lifts the trophy?</div>
          <p style={{ fontFamily:"'Quicksand',sans-serif",fontSize:13,color:C.muted,marginBottom:20,lineHeight:1.6 }}>The final is played at MetLife Stadium, New Jersey on July 19, 2026.</p>
          <select value={champion} onChange={e=>setChampion(e.target.value)} style={{ width:"100%",background:"#050D08",border:`1px solid ${C.border}`,borderRadius:6,color:C.white,fontFamily:"'Quicksand',sans-serif",fontSize:13,fontWeight:500,padding:"11px 14px",cursor:"pointer" }}>
            <option value="">Select a team...</option>
            {Object.entries(GROUPS).map(([gk,g])=>(
              <optgroup key={gk} label={`Group ${gk}`}>
                {g.teams.map(t=><option key={t} value={t}>{t}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
function LeaderboardTab({ userName, scores, liveScores }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{(async()=>{const d=await loadData("twg-v5-leaderboard",true);setEntries(d||[]);setLoading(false);})();},[]);

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
  const enriched = entries.map(e => ({ ...e, pts: e.name === userName ? myPts : e.pts }));
  const sorted = [...enriched].sort((a,b)=>b.pts-a.pts);
  const medalColor = i=>i===0?C.gold:i===1?"#C0C0C0":i===2?"#CD7F32":C.muted;

  return (
    <div className="fade-in" style={{ maxWidth:600,margin:"0 auto" }}>
      <div style={{ background:C.surface,border:`2px solid ${C.border}`,borderRadius:8,overflow:"hidden" }}>
        {sorted.length===0 ? (
          <div style={{ padding:32,textAlign:"center",color:C.muted,fontFamily:"'Quicksand',sans-serif",fontSize:13,lineHeight:1.7 }}>
            No entries yet. Save your predictions to appear here, then share the app link with friends.
          </div>
        ) : sorted.map((entry,i)=>{
          const code=TEAM_FLAGS[entry.champion];
          return (
            <div key={entry.name} style={{ display:"flex",alignItems:"center",padding:"16px 20px",borderTop:i>0?`1px solid ${C.border}`:"none",background:entry.name===userName?"rgba(90,148,123,0.06)":"transparent" }}>
              <div style={{ fontFamily:"'League Spartan',sans-serif",fontSize:22,fontWeight:900,color:medalColor(i),width:36,textAlign:"center" }}>{i+1}</div>
              <div style={{ flex:1,marginLeft:12 }}>
                <div style={{ fontSize:14,fontWeight:700,fontFamily:"'League Spartan',sans-serif",textTransform:"uppercase",letterSpacing:"0.04em",color:entry.name===userName?C.green:C.white }}>
                  {entry.name}{entry.name===userName&&<span style={{ fontSize:9,color:C.green,letterSpacing:"0.1em",marginLeft:8 }}>YOU</span>}
                </div>
                {entry.champion&&code&&<div style={{ fontSize:11,color:C.muted,marginTop:2,fontFamily:"'Quicksand',sans-serif",display:"flex",alignItems:"center",gap:5 }}><img src={FLAG_URL(code)} alt={entry.champion} style={{ width:16,height:12,objectFit:"cover",borderRadius:2 }} />{entry.champion}</div>}
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:24,fontWeight:700,fontFamily:"'League Spartan',sans-serif",color:C.white }}>{entry.pts}</div>
                <div style={{ fontSize:9,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'League Spartan',sans-serif" }}>pts</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop:14,fontSize:12,color:C.dim,lineHeight:1.6,fontFamily:"'Quicksand',sans-serif" }}>
        Scoring: 3 pts correct result · 5 pts exact scoreline · Updates automatically as real results come in.
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

  // Load saved state
  useEffect(()=>{
    (async()=>{
      const d=await loadData("twg-v5-user");
      if(d){setUserName(d.name||"");setScores(d.scores||{});setChampion(d.champion||"");setKnockoutPicks(d.knockoutPicks||{});}
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

  const handleSave = async () => {
    const name=userName||nameInput.trim();
    if(!name) return;
    if(!userName) setUserName(name);
    await saveData("twg-v5-user",{name,scores,champion,knockoutPicks});
    const board=(await loadData("twg-v5-leaderboard",true))||[];
    const idx=board.findIndex(e=>e.name===name);
    const entry={name,pts:0,champion,updatedAt:Date.now()};
    if(idx>=0)board[idx]=entry;else board.push(entry);
    await saveData("twg-v5-leaderboard",board,true);
    setSaved(true);
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
              <button className="save-btn" onClick={handleSave} style={{ background:saved?"#1C3D2C":C.green,border:`1px solid ${saved?C.border:"transparent"}`,borderRadius:6,color:saved?C.muted:"#fff",fontFamily:"'League Spartan',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",padding:"8px 20px",cursor:"pointer",transition:"all 0.15s" }}>{saved?"Saved":"Save Predictions"}</button>
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
          {tab==="bracket"&&<BracketTab scores={scores} liveScores={liveScores} champion={champion} knockoutPicks={knockoutPicks} onKnockoutPick={(id,pick)=>setKnockoutPicks(p=>({...p,[id]:pick}))} />}
          {tab==="champion"&&<ChampionTab champion={champion} setChampion={c=>{setChampion(c);setSaved(false);}} onSave={handleSave} saved={saved} />}
          {tab==="leaderboard"&&<LeaderboardTab userName={userName} scores={scores} liveScores={liveScores} />}
        </div>
      </div>
    </>
  );
}
