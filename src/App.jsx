import { useState, useEffect, useCallback, useRef } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
// Env vars from Vercel; fallback values are placeholders only.
const SUPABASE_URL = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) || "";
const SUPABASE_KEY = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_KEY) || "";
// On deploy the football-data.org API is proxied through /api/matches
// (a Vercel serverless function in /api/matches.js) — frontend never sees the API key.
const API_BASE = "/api/matches";

const TROPHY_SVG = `<svg fill="currentColor" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><g><g><path d="M384,449.963v-12.629c0-17.643-14.357-32-32-32h-15.104c-19.989-34.176-27.52-93.973-27.563-127.659c3.349-6.059,6.549-11.712,9.237-16.341c17.557-30.379,44.096-99.072,44.096-133.333v-4.821c0-5.845-0.043-10.368-0.192-14.336c0.085-0.619,0.192-1.707,0.192-2.176C362.667,47.851,314.816,0,256,0S149.333,47.851,149.333,106.667c0,13.141,2.645,25.835,7.211,37.717c0.043,0.213-0.021,0.427,0.021,0.64l46.763,185.728c-9.493,31.317-23.019,62.037-28.779,74.581H160c-17.643,0-32,14.357-32,32v12.629c-12.395,4.416-21.333,16.149-21.333,30.037v21.333c0,5.888,4.779,10.667,10.667,10.667h277.333c5.888,0,10.667-4.779,10.667-10.667V480C405.333,466.112,396.395,454.379,384,449.963z M256,21.333c40.107,0,73.579,27.883,82.709,64.747c-9.323,1.856-12.672,12.373-16.704,27.072c-1.792,6.528-3.691,12.843-5.76,18.859c-6.677-14.912-21.568-25.344-38.912-25.344c-18.667,0-34.389,12.117-40.171,28.843c-2.453-5.333-4.843-10.965-7.232-17.003c-7.04-17.792-13.12-33.173-27.285-33.173c-4.117,0-7.851,1.771-10.496,4.992c-7.296,8.875-5.269,28.096,3.819,76.352c-15.936-15.744-25.301-37.141-25.301-60.011C170.667,59.605,208.939,21.333,256,21.333z M298.667,149.333c0,11.755-9.557,21.333-21.333,21.333S256,161.088,256,149.333c0-11.755,9.557-21.333,21.333-21.333S298.667,137.579,298.667,149.333z M189.76,189.483c3.84,3.051,7.893,5.845,12.203,8.384c5.717,29.824,11.371,61.099,11.371,79.467c0,1.536-0.149,3.221-0.235,4.821L189.76,189.483z M234.667,277.333c0-22.933-7.168-59.904-14.101-95.659c-3.243-16.789-7.189-37.035-9.536-53.035c9.472,23.893,23.829,56.832,56.939,62.251c3.029,0.683,6.144,1.109,9.365,1.109c3.392,0,6.656-0.491,9.835-1.259c34.816-6.123,47.445-43.371,54.165-67.435V128c0,27.157-23.061,91.2-42.219,124.373C285.12,276.565,256,326.912,256,373.333c0,5.888,4.779,10.667,10.667,10.667s10.667-4.779,10.667-10.667c0-18.496,5.717-38.229,13.184-56.619c3.136,28.309,9.664,62.016,22.08,88.619H197.952C210.347,377.365,234.667,317.333,234.667,277.333z M149.333,437.333c0-5.888,4.8-10.667,10.667-10.667h192c5.867,0,10.667,4.779,10.667,10.667V448H149.333V437.333z M384,490.667H128V480c0-5.888,4.8-10.667,10.667-10.667h234.667C379.2,469.333,384,474.112,384,480V490.667z"/></g></g></svg>`;
const PETTY_LOGO_BASE64 = "data:image/png;base64,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";

const FLAG_URL = (code) => `https://flagcdn.com/24x18/${code}.png`;

// Pick the closest VALID flagcdn fixed-width asset so flags never stretch/pixelate at larger
// display sizes. flagcdn only serves these exact width folders — any other value 404s.
function flagSrcForSize(code, size) {
  const validWidths = [20, 40, 80, 160, 320, 640, 1280, 2560];
  const target = validWidths.find(w => w >= size * 1.5) || validWidths[validWidths.length - 1];
  return `https://flagcdn.com/w${target}/${code}.png`;
}

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
  // Aliases — the knockout bracket data (R32_MATCHES) uses these name variants
  // for a few teams instead of the group-stage canonical name. Same flag either way.
  USA:"us","DR Congo":"cd","Ivory Coast":"ci",
};

// Map API team names to our app team names
const API_NAME_MAP = {
  "Mexico":"Mexico","South Africa":"South Africa","Korea Republic":"South Korea","Czechia":"Czechia",
  "Canada":"Canada","Bosnia and Herzegovina":"Bosnia & Herzegovina","Bosnia-Herzegovina":"Bosnia & Herzegovina","Qatar":"Qatar","Switzerland":"Switzerland",
  "Brazil":"Brazil","Morocco":"Morocco","Haiti":"Haiti","Scotland":"Scotland",
  "USA":"United States","United States":"United States","Paraguay":"Paraguay","Australia":"Australia","Türkiye":"Turkiye","Turkey":"Turkiye",
  "Germany":"Germany","Curaçao":"Curacao","Curacao":"Curacao","Côte d'Ivoire":"Cote d'Ivoire","Ivory Coast":"Cote d'Ivoire","Ecuador":"Ecuador",
  "Netherlands":"Netherlands","Japan":"Japan","Sweden":"Sweden","Tunisia":"Tunisia",
  "Belgium":"Belgium","Egypt":"Egypt","IR Iran":"Iran","Iran":"Iran","New Zealand":"New Zealand",
  "Spain":"Spain","Cape Verde":"Cabo Verde","Cape Verde Islands":"Cabo Verde","Saudi Arabia":"Saudi Arabia","Uruguay":"Uruguay",
  "France":"France","Senegal":"Senegal","Iraq":"Iraq","Norway":"Norway",
  "Argentina":"Argentina","Algeria":"Algeria","Austria":"Austria","Jordan":"Jordan",
  "Portugal":"Portugal","DR Congo":"Congo DR","Uzbekistan":"Uzbekistan","Colombia":"Colombia",
  "England":"England","Croatia":"Croatia","Ghana":"Ghana","Panama":"Panama",
};

function Flag({ team, size = 16 }) {
  const code = TEAM_FLAGS[team];
  if (!code) return null;
  return <img src={flagSrcForSize(code, size)} alt={team} style={{ width: size * 1.33, height: size, objectFit: "cover", borderRadius: 2, flexShrink: 0, display: "inline-block", verticalAlign: "middle" }} onError={e => e.target.style.display="none"} />;
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

// ── R32 Confirmed Fixtures ────────────────────────────────────────────────────
// Hardcoded from official FIFA R32 schedule. Two slots (Spain's opponent and
// Switzerland's opponent) are still TBD pending tonight's Group J/L results.
// ── One-time migration support ──────────────────────────────────────────────
// The R32 match numbering below was corrected against official FIFA sources.
// Before the fix, these 16 IDs pointed at different (wrong) team pairs. Anyone
// who saved a knockout pick before this fix has it stored under the OLD id.
// This is the OLD mapping, kept only so migrateKnockoutPicks can recover those
// picks — never used anywhere else.
const OLD_R32_MATCHES = [
  { id:73, home:"South Africa",    away:"Canada" },
  { id:74, home:"Brazil",          away:"Japan" },
  { id:75, home:"Germany",         away:"Paraguay" },
  { id:76, home:"Netherlands",     away:"Morocco" },
  { id:77, home:"Ivory Coast",     away:"Norway" },
  { id:78, home:"France",          away:"Sweden" },
  { id:79, home:"Mexico",          away:"Ecuador" },
  { id:80, home:"England",         away:"DR Congo" },
  { id:81, home:"Belgium",         away:"Senegal" },
  { id:82, home:"USA",             away:"Bosnia & Herzegovina" },
  { id:83, home:"Spain",           away:"Austria" },
  { id:84, home:"Portugal",        away:"Croatia" },
  { id:85, home:"Switzerland",     away:"Algeria" },
  { id:86, home:"Australia",       away:"Egypt" },
  { id:87, home:"Argentina",       away:"Cabo Verde" },
  { id:88, home:"Colombia",        away:"Ghana" },
];

const R32_MATCHES = [
  { id:73, home:"South Africa",        away:"Canada",                   date:"Jun 28", time:"3:00 PM ET" },
  { id:74, home:"Germany",             away:"Paraguay",                 date:"Jun 28", time:"4:30 PM ET" },
  { id:75, home:"Netherlands",         away:"Morocco",                  date:"Jun 29", time:"1:00 PM ET" },
  { id:76, home:"Brazil",              away:"Japan",                    date:"Jun 29", time:"1:00 PM ET" },
  { id:77, home:"France",              away:"Sweden",                   date:"Jun 30", time:"5:00 PM ET" },
  { id:78, home:"Ivory Coast",         away:"Norway",                   date:"Jun 30", time:"1:00 PM ET" },
  { id:79, home:"Mexico",              away:"Ecuador",                  date:"Jun 30", time:"9:00 PM ET" },
  { id:80, home:"England",             away:"DR Congo",                 date:"Jul 1",  time:"12:00 PM ET" },
  { id:81, home:"USA",                 away:"Bosnia & Herzegovina",     date:"Jul 1",  time:"8:00 PM ET" },
  { id:82, home:"Belgium",             away:"Senegal",                  date:"Jul 1",  time:"4:00 PM ET" },
  { id:83, home:"Portugal",            away:"Croatia",                  date:"Jul 2",  time:"7:00 PM ET" },
  { id:84, home:"Spain",               away:"Austria",                  date:"Jul 2",  time:"3:00 PM ET" },
  { id:85, home:"Switzerland",         away:"Algeria",                  date:"Jul 2",  time:"11:00 PM ET" },
  { id:86, home:"Argentina",           away:"Cabo Verde",               date:"Jul 3",  time:"6:00 PM ET" },
  { id:87, home:"Colombia",            away:"Ghana",                    date:"Jul 3",  time:"9:30 PM ET" },
  { id:88, home:"Australia",           away:"Egypt",                    date:"Jul 3",  time:"2:00 PM ET" },
];

// Recovers picks saved before the R32 numbering fix. R32 (73-88) picks are fully
// recoverable — same 16 team pairs, just relocated to correct IDs, so we can find
// the right new home for each one with total confidence, orientation preserved.
// R16-through-Final picks (89-104) are NOT recoverable — the matchups downstream
// of a wrong R32 numbering don't correspond to anything real in the corrected
// bracket, so guessing at them risks assigning someone a pick they never made.
// Those are cleared; the person needs to re-pick from R16 onward.
// Self-verifying and safe to run on every load: if a pick already matches the
// current (correct) team pair for its id, it's left untouched — so this can
// never double-migrate or corrupt already-correct data.
function migrateKnockoutPicks(picks) {
  if (!picks || typeof picks !== "object") return picks || {};
  const migrated = {};
  Object.entries(picks).forEach(([idStr, val]) => {
    const id = parseInt(idStr, 10);
    if (isNaN(id)) return;
    const pickTeam = typeof val === "string" ? val : val?.team;
    if (id < 73 || id > 88) return; // R16+ — dropped, not recoverable
    const newMatch = R32_MATCHES.find(m => m.id === id);
    const alreadyCorrect = newMatch && (pickTeam === newMatch.home || pickTeam === newMatch.away);
    if (alreadyCorrect) {
      migrated[id] = val;
      return;
    }
    const oldMatch = OLD_R32_MATCHES.find(m => m.id === id);
    if (!oldMatch) return;
    const correctSlot = R32_MATCHES.find(m =>
      (m.home === oldMatch.home && m.away === oldMatch.away) ||
      (m.home === oldMatch.away && m.away === oldMatch.home)
    );
    if (correctSlot) migrated[correctSlot.id] = val; // orientation verified to match in every case
  });
  return migrated;
}

// Verified, confirmed-final results for knockout matches that are 100% complete.
// home/away = the regulation+extra-time scoreline (before penalties, if any).
// winner = the team that actually advanced (accounts for penalty shootouts).
// Only add an entry here once a match is fully over — same ground-truth pattern
// used for HARDCODED_RESULTS in the group stage. Cross-verified against multiple
// independent sources (Wikipedia, FourFourTwo, NBC, ESPN) before being added.
const HARDCODED_KO_RESULTS = {
  73: { home:0, away:1, winner:"Canada" },                                    // South Africa 0-1 Canada
  74: { home:1, away:1, winner:"Paraguay", decidedBy:"pens" },                // Germany 1-1 Paraguay (Paraguay won 4-3 on penalties)
  75: { home:1, away:1, winner:"Morocco", decidedBy:"pens" },                 // Netherlands 1-1 Morocco (Morocco won 3-2 on penalties)
  76: { home:2, away:1, winner:"Brazil" },                                    // Brazil 2-1 Japan
  77: { home:3, away:0, winner:"France" },                                    // France 3-0 Sweden
  78: { home:1, away:2, winner:"Norway" },                                    // Ivory Coast 1-2 Norway
  79: { home:2, away:0, winner:"Mexico" },                                    // Mexico 2-0 Ecuador
  80: { home:2, away:1, winner:"England" },                                   // England 2-1 DR Congo (Kane brace, 75', 86')
  81: { home:2, away:0, winner:"USA" },                                       // USA 2-0 Bosnia & Herzegovina
  82: { home:3, away:2, winner:"Belgium", decidedBy:"aet" },                  // Belgium 3-2 Senegal (Tielemans, 120+5')
  83: { home:2, away:1, winner:"Portugal" },                                  // Portugal 2-1 Croatia
  84: { home:3, away:0, winner:"Spain" },                                     // Spain 3-0 Austria
  85: { home:2, away:0, winner:"Switzerland" },                               // Switzerland 2-0 Algeria
};

// Official FIFA knockout bracket sourcing — which earlier match(es) feed into each
// later match, and whether the WINNER or LOSER of each source advances.
// Verified against FIFA.com's official schedule page, CBS Sports, and NBC Sports
// (all three independently agree on this exact wiring). This is the single source
// of truth for both the user-facing bracket (BracketTab) and the real-results
// resolver (resolveKnockoutMatch) — keeping them identical avoids the two ever
// disagreeing about who's playing whom.
const KO_SOURCES = {
  89:{ src:[74,77], type:"winner" }, 90:{ src:[73,75], type:"winner" },
  91:{ src:[76,78], type:"winner" }, 92:{ src:[79,80], type:"winner" },
  93:{ src:[83,84], type:"winner" }, 94:{ src:[81,82], type:"winner" },
  95:{ src:[86,88], type:"winner" }, 96:{ src:[85,87], type:"winner" },
  97:{ src:[89,90], type:"winner" }, 98:{ src:[93,94], type:"winner" },
  99:{ src:[91,92], type:"winner" }, 100:{ src:[95,96], type:"winner" },
  101:{ src:[97,98], type:"winner" }, 102:{ src:[99,100], type:"winner" },
  103:{ src:[101,102], type:"loser" },   // Third-place playoff — SF losers
  104:{ src:[101,102], type:"winner" },  // Final — SF winners
};

// Parse non-group-stage matches from the live API into a flat list keyed by team
// names (not by our internal match IDs, since the API has no concept of them).
// The resolver below matches these against expected team pairs computed from
// KO_SOURCES, so this works regardless of how the API labels its own rounds.
function parseApiKnockoutMatches(apiMatches) {
  if (!apiMatches) return [];
  return apiMatches
    .filter(m => m.stage && m.stage !== "GROUP_STAGE")
    .map(m => {
      const home = API_NAME_MAP[m.homeTeam?.name] || m.homeTeam?.name;
      const away = API_NAME_MAP[m.awayTeam?.name] || m.awayTeam?.name;
      const score = m.score?.fullTime;
      return {
        home, away,
        homeScore: score?.home ?? null,
        awayScore: score?.away ?? null,
        status: m.status,
        utcDate: m.utcDate,
      };
    })
    .filter(m => m.home && m.away);
}

// A few teams have two name variants in play: R32_MATCHES uses one, the live API
// (normalized through API_NAME_MAP) uses another. Canonicalize both sides before
// comparing so matching never silently fails on a naming mismatch.
const TEAM_NAME_CANONICAL = {
  "USA": "United States",
  "DR Congo": "Congo DR",
  "Ivory Coast": "Cote d'Ivoire",
};
function canonicalTeamName(name) {
  return TEAM_NAME_CANONICAL[name] || name;
}
function findKnockoutApiMatch(koMatches, teamA, teamB) {
  const a = canonicalTeamName(teamA), b = canonicalTeamName(teamB);
  return koMatches.find(m => {
    const mh = canonicalTeamName(m.home), ma = canonicalTeamName(m.away);
    return (mh === a && ma === b) || (mh === b && ma === a);
  }) || null;
}

// Recursively resolves the REAL-WORLD result of a knockout match — not any user's
// pick. Base case is an R32 match (fixed, known teams). For later rounds, first
// resolves both source matches to find out which two real teams are actually
// playing, then looks for that pairing in the live API knockout feed.
// Returns { home, away, teamA, teamB, winner, loser, status } — home/away are
// oriented to teamA/teamB regardless of the API's own home/away order.
// Returns null only when a required source match can't be resolved at all yet.
function resolveKnockoutMatch(matchId, koApiMatches) {
  const r32 = R32_MATCHES.find(m => m.id === matchId);
  let teamA, teamB;

  if (r32) {
    teamA = r32.home; teamB = r32.away;
  } else {
    const source = KO_SOURCES[matchId];
    if (!source) return null;
    const [aId, bId] = source.src;
    const resA = resolveKnockoutMatch(aId, koApiMatches);
    const resB = resolveKnockoutMatch(bId, koApiMatches);
    if (!resA || !resB) return null;
    teamA = source.type === "loser" ? resA.loser : resA.winner;
    teamB = source.type === "loser" ? resB.loser : resB.winner;
    if (!teamA || !teamB) {
      // Sources aren't decided yet — return a placeholder so the UI can still
      // show "TBD" without breaking, but with no winner/score.
      return { home:null, away:null, teamA:teamA||null, teamB:teamB||null, winner:null, loser:null, status:"SCHEDULED" };
    }
  }

  // Ground truth first — never trust the API over a verified hardcoded result.
  const hard = HARDCODED_KO_RESULTS[matchId];
  if (hard) {
    return {
      home: hard.home, away: hard.away, teamA, teamB,
      winner: hard.winner, loser: hard.winner === teamA ? teamB : teamA,
      status: "FINISHED", decidedBy: hard.decidedBy || null,
    };
  }

  // Fall back to live API data, matched purely by team-name pair.
  const live = findKnockoutApiMatch(koApiMatches, teamA, teamB);
  if (!live || live.homeScore === null || live.status === "SCHEDULED" || live.status === "TIMED") {
    return { home:null, away:null, teamA, teamB, winner:null, loser:null, status: live?.status || "SCHEDULED", decidedBy:null };
  }
  const aScore = live.home === teamA ? live.homeScore : live.awayScore;
  const bScore = live.home === teamA ? live.awayScore : live.homeScore;
  let winner = null;
  if (live.status === "FINISHED") {
    winner = aScore > bScore ? teamA : bScore > aScore ? teamB : null;
  }
  return {
    home: aScore, away: bScore, teamA, teamB,
    winner, loser: winner ? (winner === teamA ? teamB : teamA) : null,
    status: live.status, decidedBy: null,
  };
}

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
    // Use live score if it has data (regardless of status — API sometimes returns stale
    // SCHEDULED/TIMED status on matches that are clearly done). Fall back to user score.
    const hasLiveData = live && live.home !== null && live.home !== undefined && live.home !== "";
    const src = hasLiveData ? live : user;
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
function scoreResult(pred, real, matchKey) {
  // Use hardcoded result if available — never rely solely on API status
  const ground = matchKey ? (HARDCODED_RESULTS[matchKey] || real) : real;
  if (!pred || pred.home === "" || pred.away === "") return null;
  if (!ground || ground.home === null || ground.home === undefined || ground.home === "") return null;
  const ph = parseInt(pred.home), pa = parseInt(pred.away);
  const rh = parseInt(ground.home), ra = parseInt(ground.away);
  if (isNaN(ph) || isNaN(pa) || isNaN(rh) || isNaN(ra)) return null;
  // Only score if the match is actually complete
  if (ground.status === "SCHEDULED" || ground.status === "TIMED") return null;
  if (ph === rh && pa === ra) return "exact";
  const predRes = ph > pa ? "H" : ph < pa ? "A" : "D";
  const realRes = rh > ra ? "H" : rh < ra ? "A" : "D";
  if (predRes === realRes) return "correct";
  return "wrong";
}

const SCORE_PTS = { exact: 5, correct: 3, wrong: 0 };

// Score a knockout match prediction against the real result.
// pred = { team, home, away } or string (old format)
// real = { home, away, winner } where winner is the team that advanced
function scoreKnockoutResult(pred, real) {
  if (!pred || !real) return null;
  const predTeam = typeof pred === "string" ? pred : pred.team;
  const predHome = pred && typeof pred !== "string" ? parseInt(pred.home) : NaN;
  const predAway = pred && typeof pred !== "string" ? parseInt(pred.away) : NaN;
  if (!predTeam || !real.winner) return null;
  const correctWinner = predTeam === real.winner;
  if (!correctWinner) return "wrong";
  // Check exact score
  if (!isNaN(predHome) && !isNaN(predAway) &&
      real.home !== undefined && real.home !== null &&
      predHome === parseInt(real.home) && predAway === parseInt(real.away)) {
    return "exact";
  }
  return "correct";
}

// All 32 knockout match IDs, R32 through Final.
const ALL_KO_IDS = [...R32_MATCHES.map(m => m.id), ...Object.keys(KO_SOURCES).map(Number)];

// Computes total knockout points for a user's picks against real results, plus a
// breakdown (exact/correct/wrong counts and how many picks have been scored so far).
function calcTotalKnockoutPoints(knockoutPicks, koApiMatches) {
  let pts = 0, exact = 0, correct = 0, wrong = 0, scored = 0;
  ALL_KO_IDS.forEach(id => {
    const pred = knockoutPicks?.[id];
    if (!pred) return;
    const real = resolveKnockoutMatch(id, koApiMatches || []);
    if (!real || !real.winner) return; // match not decided yet — don't score
    const result = scoreKnockoutResult(pred, real);
    if (!result) return;
    scored++;
    pts += SCORE_PTS[result];
    if (result === "exact") exact++;
    else if (result === "correct") correct++;
    else wrong++;
  });
  return { total: pts, exact, correct, wrong, scored };
}

// ── Group Order Scoring ───────────────────────────────────────────────────────
// Rewards predicting the full 1st-4th finishing order of a group.
// +2 pts per team in its exact correct slot (max 8 for 4 teams)
// +10 bonus if all 4 slots are exactly right ("Perfect Group")
const GROUP_ORDER_PTS_PER_SLOT = 2;
const GROUP_ORDER_PERFECT_BONUS = 10;

// ── Hardcoded Group Stage Results ─────────────────────────────────────────────
// All 72 group stage matches are complete. These results are fixed historical
// facts and never change. Hardcoding them means scoring never depends on the
// API returning correct status fields — fully airtight.
// Match indices follow the order defined in GROUPS above.
const HARDCODED_RESULTS = {
  // GROUP A — matches: [Mex/SA, SKor/Cze, Mex/SKor, SA/Cze, Mex/Cze, SA/SKor]
  "A-0": { home:2, away:0, status:"FINISHED" }, // Mexico 2-0 South Africa
  "A-1": { home:2, away:1, status:"FINISHED" }, // South Korea 2-1 Czechia
  "A-2": { home:1, away:0, status:"FINISHED" }, // Mexico 1-0 South Korea
  "A-3": { home:1, away:1, status:"FINISHED" }, // South Africa 1-1 Czechia
  "A-4": { home:3, away:0, status:"FINISHED" }, // Mexico 3-0 Czechia
  "A-5": { home:1, away:0, status:"FINISHED" }, // South Africa 1-0 South Korea

  // GROUP B — matches: [Can/Bos, Qat/Swi, Can/Qat, Bos/Swi, Can/Swi, Bos/Qat]
  "B-0": { home:1, away:1, status:"FINISHED" }, // Canada 1-1 Bosnia & Herzegovina
  "B-1": { home:1, away:1, status:"FINISHED" }, // Qatar 1-1 Switzerland
  "B-2": { home:6, away:0, status:"FINISHED" }, // Canada 6-0 Qatar
  "B-3": { home:1, away:4, status:"FINISHED" }, // Bosnia 1-4 Switzerland
  "B-4": { home:1, away:2, status:"FINISHED" }, // Canada 1-2 Switzerland
  "B-5": { home:3, away:1, status:"FINISHED" }, // Bosnia 3-1 Qatar

  // GROUP C — matches: [Bra/Mor, Hai/Sco, Bra/Hai, Mor/Sco, Bra/Sco, Mor/Hai]
  "C-0": { home:1, away:1, status:"FINISHED" }, // Brazil 1-1 Morocco
  "C-1": { home:0, away:1, status:"FINISHED" }, // Haiti 0-1 Scotland
  "C-2": { home:3, away:0, status:"FINISHED" }, // Brazil 3-0 Haiti
  "C-3": { home:1, away:0, status:"FINISHED" }, // Morocco 1-0 Scotland
  "C-4": { home:3, away:0, status:"FINISHED" }, // Brazil 3-0 Scotland
  "C-5": { home:4, away:2, status:"FINISHED" }, // Morocco 4-2 Haiti

  // GROUP D — matches: [USA/Par, Aus/Tur, USA/Aus, Par/Tur, USA/Tur, Par/Aus]
  "D-0": { home:4, away:1, status:"FINISHED" }, // United States 4-1 Paraguay
  "D-1": { home:2, away:0, status:"FINISHED" }, // Australia 2-0 Turkiye
  "D-2": { home:2, away:0, status:"FINISHED" }, // United States 2-0 Australia
  "D-3": { home:0, away:1, status:"FINISHED" }, // Turkiye 0-1 Paraguay
  "D-4": { home:2, away:3, status:"FINISHED" }, // United States 2-3 Turkiye
  "D-5": { home:0, away:0, status:"FINISHED" }, // Paraguay 0-0 Australia

  // GROUP E — matches: [Ger/Cur, IvC/Ecu, Ger/IvC, Cur/Ecu, Ger/Ecu, Cur/IvC]
  "E-0": { home:7, away:1, status:"FINISHED" }, // Germany 7-1 Curacao
  "E-1": { home:1, away:0, status:"FINISHED" }, // Cote d'Ivoire 1-0 Ecuador
  "E-2": { home:2, away:1, status:"FINISHED" }, // Germany 2-1 Cote d'Ivoire
  "E-3": { home:0, away:0, status:"FINISHED" }, // Curacao 0-0 Ecuador
  "E-4": { home:1, away:2, status:"FINISHED" }, // Germany 1-2 Ecuador
  "E-5": { home:0, away:2, status:"FINISHED" }, // Curacao 0-2 Cote d'Ivoire

  // GROUP F — matches: [Ned/Jap, Swe/Tun, Ned/Swe, Jap/Tun, Ned/Tun, Jap/Swe]
  "F-0": { home:2, away:2, status:"FINISHED" }, // Netherlands 2-2 Japan
  "F-1": { home:5, away:1, status:"FINISHED" }, // Sweden 5-1 Tunisia
  "F-2": { home:5, away:1, status:"FINISHED" }, // Netherlands 5-1 Sweden
  "F-3": { home:4, away:0, status:"FINISHED" }, // Japan 4-0 Tunisia
  "F-4": { home:3, away:1, status:"FINISHED" }, // Netherlands 3-1 Tunisia
  "F-5": { home:1, away:1, status:"FINISHED" }, // Japan 1-1 Sweden

  // GROUP G — matches: [Bel/Egy, Ira/NZ, Bel/Ira, Egy/NZ, Bel/NZ, Egy/Ira]
  "G-0": { home:1, away:1, status:"FINISHED" }, // Belgium 1-1 Egypt
  "G-1": { home:2, away:2, status:"FINISHED" }, // Iran 2-2 New Zealand
  "G-2": { home:0, away:0, status:"FINISHED" }, // Belgium 0-0 Iran
  "G-3": { home:3, away:1, status:"FINISHED" }, // Egypt 3-1 New Zealand
  "G-4": { home:5, away:1, status:"FINISHED" }, // Belgium 5-1 New Zealand
  "G-5": { home:1, away:1, status:"FINISHED" }, // Egypt 1-1 Iran

  // GROUP H — matches: [Spa/CV, SA/Uru, Spa/SA, CV/Uru, Spa/Uru, CV/SA]
  "H-0": { home:0, away:0, status:"FINISHED" }, // Spain 0-0 Cabo Verde
  "H-1": { home:1, away:1, status:"FINISHED" }, // Saudi Arabia 1-1 Uruguay
  "H-2": { home:4, away:0, status:"FINISHED" }, // Spain 4-0 Saudi Arabia
  "H-3": { home:2, away:2, status:"FINISHED" }, // Cabo Verde 2-2 Uruguay
  "H-4": { home:1, away:0, status:"FINISHED" }, // Spain 1-0 Uruguay
  "H-5": { home:0, away:0, status:"FINISHED" }, // Cabo Verde 0-0 Saudi Arabia

  // GROUP I — matches: [Fra/Sen, Ira/Nor, Fra/Ira, Sen/Nor, Fra/Nor, Sen/Ira]
  "I-0": { home:3, away:1, status:"FINISHED" }, // France 3-1 Senegal
  "I-1": { home:1, away:4, status:"FINISHED" }, // Iraq 1-4 Norway
  "I-2": { home:3, away:0, status:"FINISHED" }, // France 3-0 Iraq
  "I-3": { home:2, away:3, status:"FINISHED" }, // Senegal 2-3 Norway
  "I-4": { home:4, away:1, status:"FINISHED" }, // France 4-1 Norway
  "I-5": { home:5, away:0, status:"FINISHED" }, // Senegal 5-0 Iraq

  // GROUP J — matches: [Arg/Alg, Aut/Jor, Arg/Aut, Alg/Jor, Arg/Jor, Alg/Aut]
  "J-0": { home:3, away:0, status:"FINISHED" }, // Argentina 3-0 Algeria
  "J-1": { home:3, away:1, status:"FINISHED" }, // Austria 3-1 Jordan
  "J-2": { home:2, away:0, status:"FINISHED" }, // Argentina 2-0 Austria
  "J-3": { home:2, away:1, status:"FINISHED" }, // Algeria 2-1 Jordan
  "J-4": { home:3, away:1, status:"FINISHED" }, // Argentina 3-1 Jordan
  "J-5": { home:3, away:3, status:"FINISHED" }, // Algeria 3-3 Austria

  // GROUP K — matches: [Por/Con, Uzb/Col, Por/Uzb, Con/Col, Col/Por, Con/Uzb]
  "K-0": { home:1, away:1, status:"FINISHED" }, // Portugal 1-1 Congo DR
  "K-1": { home:1, away:3, status:"FINISHED" }, // Uzbekistan 1-3 Colombia
  "K-2": { home:5, away:0, status:"FINISHED" }, // Portugal 5-0 Uzbekistan
  "K-3": { home:0, away:1, status:"FINISHED" }, // Congo DR 0-1 Colombia
  "K-4": { home:0, away:0, status:"FINISHED" }, // Colombia 0-0 Portugal
  "K-5": { home:3, away:1, status:"FINISHED" }, // Congo DR 3-1 Uzbekistan

  // GROUP L — matches: [Eng/Cro, Gha/Pan, Eng/Gha, Cro/Pan, Eng/Pan, Cro/Gha]
  "L-0": { home:4, away:2, status:"FINISHED" }, // England 4-2 Croatia
  "L-1": { home:1, away:0, status:"FINISHED" }, // Ghana 1-0 Panama
  "L-2": { home:0, away:0, status:"FINISHED" }, // England 0-0 Ghana
  "L-3": { home:1, away:0, status:"FINISHED" }, // Croatia 1-0 Panama
  "L-4": { home:2, away:0, status:"FINISHED" }, // England 2-0 Panama
  "L-5": { home:2, away:1, status:"FINISHED" }, // Croatia 2-1 Ghana
};

// Returns { points, correctSlots, isPerfect, actualOrder, predictedOrder } for one group,
// or null if the group isn't fully finished yet (can't score an incomplete group).
function calcGroupOrderScore(groupKey, userScores, liveScores) {
  const group = GROUPS[groupKey];
  if (!group) return null;

  // Merge live API data with hardcoded results — hardcoded always wins
  const mergedLive = { ...(liveScores || {}), ...HARDCODED_RESULTS };

  // Don't score a group that has any match currently in progress per API
  const hasLive = group.matches.some((_, idx) => {
    const s = mergedLive[`${groupKey}-${idx}`]?.status;
    return s === "IN_PLAY" || s === "PAUSED";
  });
  if (hasLive) return null;

  // Actual standings — from hardcoded results (ground truth)
  const actualStandings = calcStandings(groupKey, {}, mergedLive);

  // All 4 teams must have played 3 games for the group to be complete
  const allPlayed = actualStandings.length === 4 && actualStandings.every(team => team.played === 3);
  if (!allPlayed) return null;

  // Predicted standings — use user's entered scores where they exist.
  // For Day 1 matches locked before the app launched (A-0, A-1), give the real
  // result as a freebie since users had no opportunity to enter them.
  // Every other blank = no prediction = group can't score for order.
  const DAY1_FREEBIES = { "A-0": true, "A-1": true };
  const blendedForPrediction = {};
  group.matches.forEach((_, idx) => {
    const key = `${groupKey}-${idx}`;
    const userEntry = userScores?.[key];
    const hasUserEntry = userEntry &&
      userEntry.home !== "" && userEntry.home !== null && userEntry.home !== undefined &&
      userEntry.away !== "" && userEntry.away !== null && userEntry.away !== undefined;
    if (hasUserEntry) {
      blendedForPrediction[key] = userEntry; // user's actual prediction — never override
    } else if (DAY1_FREEBIES[key]) {
      blendedForPrediction[key] = HARDCODED_RESULTS[key]; // hardcoded freebie
    }
    // Any other blank = no prediction, group won't score
  });

  const predictedStandings = calcStandings(groupKey, blendedForPrediction, {});

  // All 4 teams must have played 3 games in the predicted standings
  const predictedAllPlayed = predictedStandings.length === 4 &&
    predictedStandings.every(team => team.played === 3);
  if (!predictedAllPlayed) return null;

  const actualOrder = actualStandings.map(s => s.team);
  const predictedOrder = predictedStandings.map(s => s.team);

  let correctSlots = 0;
  for (let i = 0; i < 4; i++) {
    if (actualOrder[i] === predictedOrder[i]) correctSlots++;
  }
  const isPerfect = correctSlots === 4;
  const points = (correctSlots * GROUP_ORDER_PTS_PER_SLOT) + (isPerfect ? GROUP_ORDER_PERFECT_BONUS : 0);

  return { points, correctSlots, isPerfect, actualOrder, predictedOrder };
}

// Total group-order points across all 12 groups for one user
function calcTotalGroupOrderPoints(userScores, liveScores) {
  let total = 0;
  let perfectCount = 0;
  let groupsScored = 0;
  Object.keys(GROUPS).forEach(gKey => {
    const result = calcGroupOrderScore(gKey, userScores, liveScores);
    if (result) {
      total += result.points;
      groupsScored++;
      if (result.isPerfect) perfectCount++;
    }
  });
  return { total, perfectCount, groupsScored };
}


// ── Storage (Supabase) ────────────────────────────────────────────────────────
const SUPABASE_HEADERS = SUPABASE_KEY ? {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
} : null;

async function saveUserPredictions(name, scores, champion, knockoutPicks) {
  if (!SUPABASE_URL || !SUPABASE_HEADERS) return false;
  try {
    // Safety net: if we're about to save an empty scores object, first check whether a row
    // already exists with real data. If so, refuse — this is almost certainly the app trying
    // to save before it finished loading, and would silently destroy real saved predictions.
    const scoresEmpty = !scores || Object.keys(scores).length === 0;
    if (scoresEmpty) {
      const existing = await loadUserPredictions(name);
      if (existing && existing.scores && Object.keys(existing.scores).length > 0) {
        console.warn("Refused to overwrite existing predictions with empty scores for", name);
        return false;
      }
    }
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
    let matchIdx = group.matches.findIndex(([h,a]) => h===homeTeam&&a===awayTeam);
    let reversed = false;
    if (matchIdx === -1) {
      matchIdx = group.matches.findIndex(([h,a]) => h===awayTeam&&a===homeTeam);
      reversed = true;
    }
    if (matchIdx === -1) return;

    const key = `${groupLetter}-${matchIdx}`;
    const score = m.score?.fullTime;
    const homeScore = score?.home ?? null;
    const awayScore = score?.away ?? null;
    result[key] = {
      home: reversed ? awayScore : homeScore,
      away: reversed ? homeScore : awayScore,
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
  gold:"#C49F4B", white:"#FFFFFF", muted:"#5A7A6A", dim:"#1E3329", mutedLight:"#A8C2B5",
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

  /* Responsive grid: uses --cols (desktop column count) but steps down on narrow
     viewports so cards never force horizontal scroll on mobile. */
  .balanced-grid{
    display:grid;
    grid-template-columns:repeat(var(--cols, 4), 1fr);
    align-items:stretch;
  }
  .balanced-grid > *{ min-width:0; }
  @media (max-width: 640px){
    .balanced-grid{ grid-template-columns:repeat(2, 1fr) !important; }
  }
  @media (max-width: 380px){
    .balanced-grid{ grid-template-columns:repeat(1, 1fr) !important; }
  }
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
        {[["groups","Group Stage Picks"],["actual","Official Group Scores"],["bracket","Knockout Stage Picks"],["koactual","Official Knockout Scores"],["champion","Your Tournament Stats"],["leaderboard","Leaderboard"]].map(([id,label])=>(
          <button key={id} className="nav-btn" onClick={()=>setTab(id)} style={{ background:"none",border:"none",borderBottom:tab===id?`2px solid ${C.green}`:"2px solid transparent",color:tab===id?C.green:C.muted,fontFamily:"'League Spartan',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",padding:"13px 20px 11px",cursor:"pointer",whiteSpace:"nowrap" }}>
            {label}{id==="koactual"&&<span style={{ marginLeft:5,fontSize:8,color:C.green,verticalAlign:"middle" }}>●</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Tab Page Descriptions — short centered subtitle shown under nav per tab ───
const TAB_DESCRIPTIONS = {
  groups: "Predict every group stage match yourself. Standings, third-place race, and points update live as results come in.",
  actual: "The final group stage — every match, every standing, locked in once the real World Cup group stage wrapped.",
  bracket: "Pick your way through the knockout rounds, from the Round of 32 to the Final. Your champion pick lives here.",
  koactual: "The real knockout stage as it unfolds — live matches, most recent results, and the road to the Final.",
  champion: "Every prediction, every point, every accolade earned — your full tournament breakdown in one place.",
  leaderboard: "See who's leading the competition and who's holding the title in every award category.",
};

function PageHeader({ tab }) {
  const desc = TAB_DESCRIPTIONS[tab];
  if (!desc) return null;
  return (
    <div style={{
      textAlign:"center", maxWidth:640, margin:"20px auto 0",
      padding:"0 16px",
      fontFamily:"'Quicksand',sans-serif", fontSize:13,
      color:C.mutedLight, lineHeight:1.7,
    }}>
      {desc}
    </div>
  );
}

// Centered gold banner used to separate major sections within a tab (e.g. Official Game Scores / Official Group Table)
function SectionBanner({ title, lastUpdated }) {
  return (
    <div style={{
      background:`linear-gradient(135deg, ${C.greenDark} 0%, #031A0E 100%)`,
      border:`2px solid ${C.gold}`, borderRadius:10,
      padding:"16px 20px", marginBottom:20,
      textAlign:"center", position:"relative",
      boxShadow:"0 0 24px rgba(196,159,75,0.08)",
    }}>
      <div style={{ fontFamily:"'League Spartan',sans-serif",fontSize:22,fontWeight:900,color:C.gold,textTransform:"uppercase",letterSpacing:"0.06em",lineHeight:1.1 }}>
        {title}
      </div>
      {lastUpdated && (
        <div style={{ fontSize:10,color:C.mutedLight,fontFamily:"'Quicksand',sans-serif",marginTop:6 }}>
          Updated {lastUpdated}
        </div>
      )}
    </div>
  );
}


function ScoreInput({ value, onChange, disabled }) {
  const handleChange = (raw) => {
    if (raw === "") { onChange(""); return; }
    // Strip anything that isn't a digit (blocks '.', '-', 'e', etc.)
    const digitsOnly = raw.replace(/[^\d]/g, "");
    if (digitsOnly === "") { onChange(""); return; }
    let num = parseInt(digitsOnly, 10);
    if (num > 99) num = 99;
    onChange(String(num));
  };
  return (
    <input
      className="score-input"
      type="number"
      inputMode="numeric"
      min={0}
      max={99}
      step={1}
      value={value}
      onChange={e=>handleChange(e.target.value)}
      onKeyDown={e=>{ if (["-","+","e","E","."].includes(e.key)) e.preventDefault(); }}
      onPaste={e=>{
        const text = (e.clipboardData||window.clipboardData).getData("text");
        if (!/^\d+$/.test(text)) e.preventDefault();
      }}
      placeholder="–"
      disabled={disabled}
      style={{ width:36,height:32,background:disabled?"#050D08":"#050D08",border:`1px solid ${C.border}`,borderRadius:4,color:disabled?C.muted:C.white,textAlign:"center",fontSize:15,fontWeight:700,fontFamily:"'League Spartan',sans-serif",transition:"border-color 0.15s,background 0.15s",opacity:disabled?0.5:1 }}
    />
  );
}

// ── Match Row with live result comparison ─────────────────────────────────────
function MatchRow({ home, away, matchKey, userScore, liveScore, onScore, groupKey, forceUnlock }) {
  const s = userScore || { home:"", away:"" };
  const result = scoreResult(userScore, liveScore);
  const resultColors = { exact:C.exact, correct:C.correct, wrong:C.wrong };
  const isLocked = !forceUnlock && (liveScore?.status === "FINISHED" || liveScore?.status === "IN_PLAY" || liveScore?.status === "PAUSED");
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
      {/* Lock badge for finished/live matches (hidden when force-unlocked for re-entry) */}
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
      {forceUnlock && isFinished && (
        <div style={{
          position:"absolute", top:6, left:6,
          fontSize:8, fontFamily:"'League Spartan',sans-serif",
          fontWeight:700, color:C.gold,
          letterSpacing:"0.1em", textTransform:"uppercase",
          background:"rgba(196,159,75,0.12)",
          border:`1px solid rgba(196,159,75,0.4)`,
          borderRadius:3, padding:"1px 5px",
          display:"flex", alignItems:"center", gap:3,
        }}>
          <span style={{ fontSize:7 }}>✎</span>
          Re-entry mode
        </div>
      )}

      <div style={{
        display:"flex", alignItems:"center",
        padding: (isLocked || (forceUnlock && isFinished)) ? "18px 12px 7px" : "7px 12px",
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
        <span style={{ flex:1,fontSize:11,color:C.mutedLight,fontFamily:"'Quicksand',sans-serif",display:"flex",alignItems:"center",gap:5 }}>
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

// ── Official Group Scores — Merged Live Results + Official Standings ─────────
function ActualTab({ liveScores, scores, lastUpdated }) {
  const EMPTY = {};
  const qualifyingThirds = getThirdPlaceQualifiers(EMPTY, liveScores);
  const [showFinished, setShowFinished] = useState(false);

  const anyFinished = Object.values(liveScores).some(s=>s.status==="FINISHED");

  // Build full match list with group/team context — group stage is complete, so
  // every match here is either finished or hasn't been resolved by the API yet.
  const allMatches = [];
  Object.keys(GROUPS).forEach(gKey => {
    GROUPS[gKey].matches.forEach(([home,away],idx) => {
      const key = `${gKey}-${idx}`;
      const live = liveScores[key];
      const user = scores[key];
      if (live) allMatches.push({ gKey, idx, key, home, away, live, user });
    });
  });

  const finished = allMatches.filter(m=>m.live.status==="FINISHED");

  const MatchCard = ({ m, compact }) => {
    const result = scoreResult(m.user, m.live);
    const ptColors = { exact:C.exact, correct:C.correct, wrong:C.wrong };
    return (
      <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:compact?"10px 12px":"12px 14px",display:"flex",alignItems:"center",gap:10 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:9,fontFamily:"'League Spartan',sans-serif",color:C.mutedLight,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:5,fontWeight:700 }}>Group {m.gKey}</div>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <span style={{ display:"flex",alignItems:"center",gap:5,fontSize:12,fontFamily:"'Quicksand',sans-serif",color:C.white,flex:1,justifyContent:"flex-end",fontWeight:600 }}>
              {m.home}<Flag team={m.home} size={14} />
            </span>
            <div style={{ textAlign:"center",minWidth:60 }}>
              <div style={{ fontSize:16,fontWeight:900,fontFamily:"'League Spartan',sans-serif",color:C.white }}>
                {m.live.home !== null ? `${m.live.home} : ${m.live.away}` : "VS"}
              </div>
              <div style={{ fontSize:9,color:C.mutedLight,fontFamily:"'League Spartan',sans-serif",letterSpacing:"0.08em",fontWeight:700,marginTop:2 }}>FT</div>
            </div>
            <span style={{ display:"flex",alignItems:"center",gap:5,fontSize:12,fontFamily:"'Quicksand',sans-serif",color:C.white,flex:1,fontWeight:600 }}>
              <Flag team={m.away} size={14} />{m.away}
            </span>
          </div>
        </div>
        {m.user && m.user.home !== "" && (
          <div style={{ textAlign:"right",flexShrink:0,borderLeft:`1px solid ${C.border}`,paddingLeft:12 }}>
            <div style={{ fontSize:9,color:C.mutedLight,fontFamily:"'League Spartan',sans-serif",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3,fontWeight:700 }}>Your Pick</div>
            <div style={{ fontSize:14,fontWeight:900,fontFamily:"'League Spartan',sans-serif",color:result?ptColors[result]:C.white }}>{m.user.home}:{m.user.away}</div>
            {result && <div style={{ fontSize:9,color:ptColors[result],fontFamily:"'League Spartan',sans-serif",fontWeight:700,textTransform:"uppercase",marginTop:1 }}>{result==="exact"?"+5":result==="correct"?"+3":"0"} pts</div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fade-in">
      {/* Header banner — Official Game Scores */}
      <SectionBanner title="★ Official Game Scores ★" lastUpdated={lastUpdated} />

      <div style={{ textAlign:"center",padding:"6px 16px 20px",color:C.mutedLight,fontFamily:"'Quicksand',sans-serif",fontSize:12 }}>
        The group stage wrapped on June 27 — every match below is final.
      </div>

      {/* ── ACCORDION: Finished matches ── */}
      {finished.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <button onClick={()=>setShowFinished(!showFinished)} style={{
            width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
            padding:"12px 16px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center",
            fontFamily:"'League Spartan',sans-serif",
          }}>
            <span style={{ fontSize:11, color:C.white, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" }}>
              Finished Matches <span style={{ color:C.muted, fontWeight:500 }}>({finished.length})</span>
            </span>
            <span style={{ fontSize:11, color:C.green }}>{showFinished ? "▲ Hide" : "▼ Show"}</span>
          </button>
          {showFinished && (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10, marginTop:12 }}>
              {finished.slice().reverse().map(m=><MatchCard key={m.key} m={m} compact />)}
            </div>
          )}
        </div>
      )}

      {!anyFinished && (
        <div style={{ textAlign:"center",padding:"24px 16px",color:C.mutedLight,fontFamily:"'Quicksand',sans-serif",fontSize:13,border:`1px dashed ${C.border}`,borderRadius:8,marginBottom:20 }}>
          No matches finished yet — group standings will populate as results come in.
        </div>
      )}

      {/* Second banner — Official Group Table */}
      <SectionBanner title="★ Official Group Table ★" />

      <ThirdPlaceTracker scores={EMPTY} liveScores={liveScores} />

      {/* ── Group standings grid ── */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(330px,1fr))",gap:12 }}>
        {Object.keys(GROUPS).map(g => {
          const standings = calcStandings(g, EMPTY, liveScores);
          const hasLive = GROUPS[g].matches.some((_,i) => {
            const k = `${g}-${i}`;
            return liveScores[k]?.status === "IN_PLAY" || liveScores[k]?.status === "PAUSED";
          });
          return (
            <div key={g} className="group-card fade-in" style={{ background:C.surface,border:`2px solid ${hasLive?C.green:C.gold}`,borderRadius:8,overflow:"hidden" }}>
              <div style={{ padding:"11px 14px",borderBottom:`1px solid ${C.border}`,background:`linear-gradient(135deg,${C.greenDark} 0%,#031A0E 100%)`,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <div style={{ width:4,height:22,background:C.green,borderRadius:2,flexShrink:0 }} />
                  <span style={{ fontFamily:"'League Spartan',sans-serif",fontSize:16,fontWeight:900,color:C.white,letterSpacing:"0.05em",textTransform:"uppercase" }}>Group {g}</span>
                  {hasLive && <span className="live-dot" style={{ fontSize:8,color:C.green }}>● LIVE</span>}
                </div>
                <div style={{ display:"flex",gap:4 }}>
                  {standings.slice(0,2).map(row=><Flag key={row.team} team={row.team} size={14} />)}
                </div>
              </div>
              <table style={{ width:"100%",borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ fontSize:9,color:C.muted,fontFamily:"'League Spartan',sans-serif",textTransform:"uppercase",letterSpacing:"0.08em" }}>
                    <th style={{ textAlign:"left",padding:"6px 8px" }}>#</th>
                    <th style={{ textAlign:"left",padding:"6px 8px" }}>Team</th>
                    <th style={{ padding:"6px 4px" }}>P</th>
                    <th style={{ padding:"6px 4px" }}>GD</th>
                    <th style={{ padding:"6px 8px" }}>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row,i)=>{
                    const isThird = i===2;
                    const inThirdRace = isThird && qualifyingThirds.has(row.team);
                    return (
                      <tr key={row.team} style={{
                        fontSize:12, fontFamily:"'Quicksand',sans-serif",
                        color: i<2 ? C.white : (inThirdRace ? C.green : C.muted),
                        background: i<2 ? "rgba(90,148,123,0.08)" : inThirdRace ? "rgba(90,148,123,0.04)" : "transparent",
                        borderTop:`1px solid ${C.border}`,
                      }}>
                        <td style={{ padding:"7px 8px",fontWeight:700 }}>{i+1}</td>
                        <td style={{ padding:"7px 8px",display:"flex",alignItems:"center",gap:6,fontWeight:i<2?700:500 }}>
                          <Flag team={row.team} size={13} />{row.team}
                          {isThird && inThirdRace && <span style={{ fontSize:8,color:C.green,border:`1px solid ${C.green}`,borderRadius:4,padding:"1px 4px",fontFamily:"'League Spartan',sans-serif" }}>IN</span>}
                        </td>
                        <td style={{ textAlign:"center",padding:"7px 4px" }}>{row.played}</td>
                        <td style={{ textAlign:"center",padding:"7px 4px",color: row.gd>0?C.green:row.gd<0?C.wrong:C.muted }}>{row.gd>0?`+${row.gd}`:row.gd}</td>
                        <td style={{ textAlign:"center",padding:"7px 8px",fontWeight:900,color:C.gold }}>{row.pts}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GroupCard({ groupKey, scores, onScore, qualifyingThirds, liveScores, forceUnlock }) {
  const [open, setOpen] = useState(false);
  const group = GROUPS[groupKey];
  const safeLive = liveScores || {};

  // Group Stage Picks shows the user's PREDICTED standings — based on their entries only.
  // Live data must not bleed in here or it overwrites their picks with real results.
  // We pass empty liveScores so calcStandings uses only user-entered scores.
  const standings = calcStandings(groupKey, scores, {});

  // check if any match in this group is live
  const hasLive = group.matches.some((_,i) => {
    const k = `${groupKey}-${i}`;
    return safeLive[k]?.status === "IN_PLAY" || safeLive[k]?.status === "PAUSED";
  });

  // Per-group match score tally (for display only — not what "perfect" means)
  let correct = 0, scored = 0;
  group.matches.forEach((_,idx) => {
    const key = `${groupKey}-${idx}`;
    const r = scoreResult(scores[key], safeLive[key], key);
    if (r !== null) { scored++; if (r === "exact" || r === "correct") correct++; }
  });
  const hasAnyScored = scored > 0;

  // Perfect GROUP ORDER — predicted the exact 1st/2nd/3rd/4th finishing order correctly.
  // This is what "perfect group" means — nothing to do with individual match scores.
  const groupOrderResult = calcGroupOrderScore(groupKey, scores, safeLive);
  const isPerfectOrder = groupOrderResult?.isPerfect ?? false;

  const borderColor = isPerfectOrder ? C.gold : hasLive ? C.green : C.border;
  const headerGlow = isPerfectOrder ? "0 0 20px rgba(196,159,75,0.25)" : "none";

  return (
    <div className="group-card fade-in" style={{ background:C.surface, border:`2px solid ${borderColor}`, borderRadius:8, overflow:"hidden", boxShadow:headerGlow }}>
      <div style={{ padding:"11px 14px", borderBottom:`1px solid ${C.border}`, background:`linear-gradient(135deg,${C.greenDark} 0%,#031A0E 100%)`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
          <div style={{ width:4, height:22, background:isPerfectOrder ? C.gold : C.green, borderRadius:2, flexShrink:0 }} />
          <span style={{ fontFamily:"'League Spartan',sans-serif", fontSize:16, fontWeight:900, color:isPerfectOrder ? C.gold : C.white, letterSpacing:"0.05em", textTransform:"uppercase" }}>
            Group {groupKey}
          </span>
          {hasLive && <span className="live-dot" style={{ fontSize:8, color:C.green }}>● LIVE</span>}
          {isPerfectOrder && (
            <span style={{ fontSize:9, background:"rgba(196,159,75,0.2)", border:`1px solid ${C.gold}`, borderRadius:4, padding:"2px 7px", fontFamily:"'League Spartan',sans-serif", fontWeight:900, color:C.gold, letterSpacing:"0.08em", textTransform:"uppercase", flexShrink:0 }}>
              ★ Perfect Order
            </span>
          )}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          {hasAnyScored && (
            <span style={{ fontFamily:"'League Spartan',sans-serif", fontSize:10, fontWeight:700, color:C.mutedLight, letterSpacing:"0.06em" }}>
              {correct}/{scored}
            </span>
          )}
          {standings.slice(0,2).map(row=><Flag key={row.team} team={row.team} size={14} />)}
        </div>
      </div>

      {/* Standings */}
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr style={{ background:"#050D08", borderBottom:`1px solid ${C.border}` }}>
            {["#","Team","P","GD","Pts"].map((h,i)=>(
              <th key={h} style={{ padding:i===0?"6px 4px 6px 12px":"6px 8px", textAlign:i>1?"right":"left", fontSize:9, letterSpacing:"0.12em", color:C.muted, textTransform:"uppercase", fontWeight:600, fontFamily:"'League Spartan',sans-serif" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standings.map((row,i)=>{
            const top2=i<2, isThird=i===2;
            const thirdIn=isThird&&qualifyingThirds&&qualifyingThirds.has(row.team)&&row.played>0;
            return (
              <tr key={row.team} style={{ background:top2?"rgba(90,148,123,0.08)":thirdIn?"rgba(90,148,123,0.12)":"transparent", borderTop:`1px solid ${C.border}` }}>
                <td style={{ padding:"8px 4px 8px 12px" }}>
                  <div style={{ width:18, height:18, borderRadius:3, background:i===0?C.gold:i===1?C.green:thirdIn?"#1C3D2C":"transparent", color:i===0?"#000":i<=1||thirdIn?"#fff":C.dim, fontSize:9, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'League Spartan',sans-serif", border:thirdIn&&i===2?`1px solid ${C.green}`:"none" }}>{i+1}</div>
                </td>
                <td style={{ padding:"7px 8px", fontSize:12, color:top2?C.white:thirdIn?C.green:C.muted, fontFamily:"'Quicksand',sans-serif", fontWeight:500 }}>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:7 }}>
                    <Flag team={row.team} size={14} />{row.team}
                    {thirdIn&&<span style={{ fontSize:8, letterSpacing:"0.1em", textTransform:"uppercase", color:C.green, background:C.tealDim, border:`1px solid ${C.tealBorder}`, borderRadius:3, padding:"1px 5px", fontWeight:700, fontFamily:"'League Spartan',sans-serif" }}>IN</span>}
                  </span>
                </td>
                <td style={{ padding:"7px 8px", textAlign:"right", fontSize:12, color:C.muted, fontFamily:"'League Spartan',sans-serif" }}>{row.played}</td>
                <td style={{ padding:"7px 8px", textAlign:"right", fontSize:12, fontWeight:700, fontFamily:"'League Spartan',sans-serif", color:row.gd>0?C.posGreen:row.gd<0?C.negRed:C.muted }}>{row.gd>0?`+${row.gd}`:row.gd}</td>
                <td style={{ padding:"7px 12px 7px 8px", textAlign:"right", fontSize:13, fontWeight:700, fontFamily:"'League Spartan',sans-serif", color:top2?C.gold:thirdIn?C.green:C.muted }}>{row.pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Matches — collapsed by default, expand individually to enter picks */}
      <div style={{ borderTop:`1px solid ${C.border}` }}>
        <button onClick={()=>setOpen(!open)} style={{
          width:"100%", background:"none", border:"none",
          color:C.mutedLight, fontFamily:"'League Spartan',sans-serif",
          fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase",
          padding:"9px 14px", cursor:"pointer", textAlign:"left",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          fontWeight:700, transition:"color 0.15s",
        }}>
          <span>Scores & Predictions</span>
          <span style={{ fontSize:9, color:C.green }}>{open ? "▲ Hide" : "▼ Show"}</span>
        </button>
        {open && group.matches.map(([home,away],idx)=>{
          const key=`${groupKey}-${idx}`;
          return (
            <MatchRow key={key} home={home} away={away} matchKey={key} userScore={scores[key]} liveScore={liveScores[key]} onScore={onScore} groupKey={groupKey} forceUnlock={forceUnlock} />
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
                <div style={{ fontSize:10,color:C.mutedLight,fontFamily:"'Quicksand',sans-serif" }}>Group {t.groupKey}</div>
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

// ── Approximate scheduled dates for R16 through Final (R32 dates live on R32_MATCHES) ──
const KO_DATES = {
  89:"Jul 4", 90:"Jul 4", 91:"Jul 5", 92:"Jul 5",
  93:"Jul 6", 94:"Jul 6", 95:"Jul 7", 96:"Jul 7",
  97:"Jul 9", 98:"Jul 10", 99:"Jul 11", 100:"Jul 11",
  101:"Jul 14", 102:"Jul 15", 103:"Jul 18", 104:"Jul 19",
};
function koRoundLabel(id) {
  if (id <= 88) return "Round of 32";
  if (id <= 96) return "Round of 16";
  if (id <= 100) return "Quarterfinal";
  if (id <= 102) return "Semifinal";
  if (id === 103) return "Third Place";
  return "Final";
}
function koDateFor(id) {
  const r32 = R32_MATCHES.find(m=>m.id===id);
  return r32 ? r32.date : (KO_DATES[id] || "");
}
// Extract { team, home, away } from a knockoutPicks entry, handling both the old
// string format and the current object format.
function getKoPick(knockoutPicks, id) {
  const p = knockoutPicks?.[id];
  if (!p) return null;
  return typeof p === "string" ? { team: p, home: "", away: "" } : p;
}

// ── Official Knockout Scores — real results only, cascading live → most recent → upcoming ──
function OfficialKnockoutTab({ koApiMatches, knockoutPicks }) {
  const results = ALL_KO_IDS.map(id => ({ id, ...resolveKnockoutMatch(id, koApiMatches || []) }));
  const live = results.filter(r => r.status === "IN_PLAY" || r.status === "PAUSED");
  const finished = results.filter(r => r.status === "FINISHED").sort((a,b) => b.id - a.id);
  const upcoming = results.filter(r => r.status !== "FINISHED" && r.status !== "IN_PLAY" && r.status !== "PAUSED");

  const ptColors = { exact:C.exact, correct:C.correct, wrong:C.wrong };

  const TeamLabel = ({ team, align, isWinner, isLoser }) => (
    <span style={{
      display:"flex",alignItems:"center",gap:6,fontSize:13,fontFamily:"'Quicksand',sans-serif",
      color: isWinner ? C.gold : isLoser ? C.mutedLight : team?C.white:C.mutedLight,
      fontWeight: isWinner ? 800 : 600,
      flex:1,justifyContent:align==="right"?"flex-end":"flex-start",
    }}>
      {align==="right" && (team ? team : "TBD")}
      {isWinner && align==="right" && <span style={{ fontSize:11 }}>✓</span>}
      {team ? <Flag team={team} size={16} /> : <span style={{ fontSize:16 }}>🏳️</span>}
      {isWinner && align!=="right" && <span style={{ fontSize:11 }}>✓</span>}
      {align!=="right" && (team ? team : "TBD")}
    </span>
  );

  const KOMatchCard = ({ r }) => {
    const pick = getKoPick(knockoutPicks, r.id);
    const result = pick && r.winner ? scoreKnockoutResult(pick, r) : null;
    const isDraw = r.home !== null && r.home === r.away;
    const decidedLabel = r.decidedBy === "pens" ? "Pens" : r.decidedBy === "aet" ? "AET" : isDraw && r.winner ? "Pens" : null;
    return (
      <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"12px 14px",display:"flex",alignItems:"center",gap:10 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:9,fontFamily:"'League Spartan',sans-serif",color:C.mutedLight,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:5,fontWeight:700 }}>
            {koRoundLabel(r.id)} · {koDateFor(r.id)}
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <TeamLabel team={r.teamA} align="right" isWinner={r.winner===r.teamA} isLoser={r.winner&&r.winner!==r.teamA} />
            <div style={{ textAlign:"center",minWidth:56 }}>
              <div style={{ fontSize:16,fontWeight:900,fontFamily:"'League Spartan',sans-serif",color:C.white }}>
                {r.home !== null ? `${r.home} : ${r.away}` : "VS"}
              </div>
              <div style={{ fontSize:9,color:decidedLabel?C.gold:C.mutedLight,fontFamily:"'League Spartan',sans-serif",letterSpacing:"0.08em",fontWeight:700,marginTop:2 }}>
                {decidedLabel ? `FT (${decidedLabel})` : "FT"}
              </div>
            </div>
            <TeamLabel team={r.teamB} align="left" isWinner={r.winner===r.teamB} isLoser={r.winner&&r.winner!==r.teamB} />
          </div>
        </div>
        {pick && pick.team && (
          <div style={{ textAlign:"right",flexShrink:0,borderLeft:`1px solid ${C.border}`,paddingLeft:12 }}>
            <div style={{ fontSize:9,color:C.mutedLight,fontFamily:"'League Spartan',sans-serif",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3,fontWeight:700 }}>Your Pick</div>
            <div style={{ fontSize:13,fontWeight:900,fontFamily:"'League Spartan',sans-serif",color:result?ptColors[result]:C.white }}>{pick.team}</div>
            {result && <div style={{ fontSize:9,color:ptColors[result],fontFamily:"'League Spartan',sans-serif",fontWeight:700,textTransform:"uppercase",marginTop:1 }}>{result==="exact"?"+5":result==="correct"?"+3":"0"} pts</div>}
          </div>
        )}
      </div>
    );
  };

  const KOUpcomingCard = ({ r }) => (
    <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,opacity:0.75 }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:9,fontFamily:"'League Spartan',sans-serif",color:C.mutedLight,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:5,fontWeight:700 }}>
          {koRoundLabel(r.id)} · {koDateFor(r.id)}
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <TeamLabel team={r.teamA} align="right" />
          <div style={{ fontSize:11,color:C.mutedLight,fontFamily:"'League Spartan',sans-serif",fontWeight:700,minWidth:30,textAlign:"center" }}>VS</div>
          <TeamLabel team={r.teamB} align="left" />
        </div>
      </div>
    </div>
  );

  const KOLiveHero = ({ r }) => (
    <div style={{
      background:`linear-gradient(135deg, ${C.greenDeep} 0%, #000 60%, ${C.greenDeep} 100%)`,
      border:`2px solid ${C.green}`, borderRadius:12,
      padding:"20px 22px", textAlign:"center", position:"relative", overflow:"hidden",
      boxShadow:`0 0 36px rgba(90,148,123,0.18)`,
    }}>
      <div style={{
        display:"inline-flex", alignItems:"center", gap:7,
        background:C.tealDim, border:`1px solid ${C.tealBorder}`, borderRadius:20,
        padding:"4px 14px", marginBottom:14,
      }}>
        <span className="live-dot" style={{ width:7,height:7,borderRadius:"50%",background:C.green,display:"inline-block" }} />
        <span style={{ fontFamily:"'League Spartan',sans-serif",fontSize:10,color:C.green,fontWeight:900,letterSpacing:"0.16em",textTransform:"uppercase" }}>Live Now</span>
      </div>
      <div style={{ fontFamily:"'League Spartan',sans-serif",fontSize:9,color:C.mutedLight,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:14 }}>{koRoundLabel(r.id)}</div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"clamp(14px,4vw,36px)", flexWrap:"wrap" }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, minWidth:100 }}>
          <Flag team={r.teamA} size={28} />
          <span style={{ fontFamily:"'League Spartan',sans-serif",fontSize:"clamp(12px,2.4vw,15px)",fontWeight:900,color:C.white,textTransform:"uppercase" }}>{r.teamA}</span>
        </div>
        <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:"clamp(34px,6.5vw,48px)", fontWeight:900, color:C.green, lineHeight:1, textShadow:`0 0 20px rgba(90,148,123,0.5)` }}>
          {r.home ?? 0} : {r.away ?? 0}
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, minWidth:100 }}>
          <Flag team={r.teamB} size={28} />
          <span style={{ fontFamily:"'League Spartan',sans-serif",fontSize:"clamp(12px,2.4vw,15px)",fontWeight:900,color:C.white,textTransform:"uppercase" }}>{r.teamB}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <SectionBanner title="★ Official Knockout Scores ★" />

      {live.length > 0 ? (
        <div style={{ marginBottom:24 }}>
          <div style={{ display:"grid", gridTemplateColumns: live.length===1?"1fr":"repeat(auto-fit,minmax(320px,1fr))", gap:14 }}>
            {live.map(r => <KOLiveHero key={r.id} r={r} />)}
          </div>
        </div>
      ) : (
        <div style={{ textAlign:"center",padding:"18px 16px",color:C.mutedLight,fontFamily:"'Quicksand',sans-serif",fontSize:13,border:`1px dashed ${C.border}`,borderRadius:8,marginBottom:20 }}>
          No knockout matches live right now.
        </div>
      )}

      {finished.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:"'League Spartan',sans-serif",fontSize:11,color:C.gold,fontWeight:900,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:12 }}>
            Results — Most Recent First
          </div>
          <div style={{ display:"grid",gap:10 }}>
            {finished.map(r => <KOMatchCard key={r.id} r={r} />)}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontFamily:"'League Spartan',sans-serif",fontSize:11,color:C.mutedLight,fontWeight:900,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:12 }}>
            Upcoming
          </div>
          <div style={{ display:"grid",gap:8 }}>
            {upcoming.map(r => <KOUpcomingCard key={r.id} r={r} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Bracket Tab — Full Knockout Through Final ─────────────────────────────────
function BracketTab({ scores, liveScores, champion, knockoutPicks, onKnockoutPick, koApiMatches }) {
  // Bracket is now unlocked — R32 fixtures confirmed

  // Determine team that won an R32 match based on user pick — handles both old string
  // format { 73: "Brazil" } and new object format { 73: { team: "Brazil", home:2, away:1 } }
  const getPickTeam = (matchId) => {
    const p = knockoutPicks[matchId];
    if (!p) return null;
    return typeof p === "string" ? p : p.team || null;
  };
  const getWinnerOfMatch = getPickTeam;

  // A match is locked from editing once it's actually live or finished in the real
  // world — same principle as the group stage locking, just driven by the real
  // knockout resolver instead of the group liveScores object.
  const isKoMatchLocked = (matchId) => {
    const real = resolveKnockoutMatch(matchId, koApiMatches || []);
    return !!(real && (real.status === "IN_PLAY" || real.status === "PAUSED" || real.status === "FINISHED"));
  };
  const koMatchStatus = (matchId) => resolveKnockoutMatch(matchId, koApiMatches || [])?.status || null;

  // Small lock badge, matching the group stage's visual language
  const LockBadge = ({ status }) => (
    <span style={{
      fontSize:8, fontFamily:"'League Spartan',sans-serif", fontWeight:700,
      color: status === "FINISHED" ? C.muted : C.green,
      letterSpacing:"0.1em", textTransform:"uppercase",
      background: status === "FINISHED" ? "rgba(40,40,40,0.6)" : C.tealDim,
      border:`1px solid ${status === "FINISHED" ? C.border : C.tealBorder}`,
      borderRadius:3, padding:"1px 6px", display:"inline-flex", alignItems:"center", gap:3,
    }}>
      <span style={{ fontSize:7 }}>🔒</span>{status === "FINISHED" ? "Locked" : "Locked · Live"}
    </span>
  );

  // Round structure is derived from KO_SOURCES — the single source of truth also
  // used by resolveKnockoutMatch for real results, so the picks bracket and the
  // real bracket can never disagree about who plays whom.
  const R16_MATCHES = [89,90,91,92,93,94,95,96].map(id => ({ id, src: KO_SOURCES[id].src }));
  const QF_MATCHES = [97,98,99,100].map(id => ({ id, src: KO_SOURCES[id].src }));
  const SF_MATCHES = [101,102].map(id => ({ id, src: KO_SOURCES[id].src }));
  const THIRD_PLACE = { id:103, srcLosers: KO_SOURCES[103].src };
  const FINAL = { id:104, src: KO_SOURCES[104].src };

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

  // Generic match card with team picker + score prediction inputs
  const MatchCard = ({ matchId, label, roundLabel, homeTeam, awayTeam, homeSource, awaySource }) => {
    const pickData = knockoutPicks[matchId];
    const pickTeam = pickData ? (typeof pickData === "string" ? pickData : pickData.team) : null;
    const pickHome = pickData && typeof pickData !== "string" ? pickData.home : "";
    const pickAway = pickData && typeof pickData !== "string" ? pickData.away : "";
    const locked = isKoMatchLocked(matchId);
    const canPick = !!(homeTeam && awayTeam) && !locked;

    const handleScoreInput = (side, val) => {
      const currentTeam = pickTeam;
      if (side === "home") onKnockoutPick(matchId, currentTeam || homeTeam, val, pickAway);
      else onKnockoutPick(matchId, currentTeam || homeTeam, pickHome, val);
    };

    // Auto-pick winner from score if score is entered and no team picked yet
    const handleScoreChange = (side, val) => {
      const h = side === "home" ? val : pickHome;
      const a = side === "away" ? val : pickAway;
      const hNum = parseInt(h), aNum = parseInt(a);
      let team = pickTeam;
      if (!isNaN(hNum) && !isNaN(aNum) && hNum !== aNum) {
        team = hNum > aNum ? homeTeam : awayTeam;
      }
      if (side === "home") onKnockoutPick(matchId, team || pickTeam, val, pickAway);
      else onKnockoutPick(matchId, team || pickTeam, pickHome, val);
    };

    // Stepper helper — no keyboard input so no scroll jump on mobile
    const ScoreStepper = ({ team, value, onInc, onDec }) => (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, flex:1 }}>
        {team && <span style={{ fontSize:8, color:C.mutedLight, fontFamily:"'League Spartan',sans-serif", textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:70, textAlign:"center" }}>{team}</span>}
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <button onClick={onDec} style={{ width:26, height:26, borderRadius:4, border:`1px solid ${C.border}`, background:"#050D08", color:C.white, fontFamily:"'League Spartan',sans-serif", fontSize:14, fontWeight:900, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>−</button>
          <div style={{ width:32, height:32, borderRadius:4, border:`1px solid ${value !== "" ? C.green : C.border}`, background:"#050D08", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'League Spartan',sans-serif", fontSize:16, fontWeight:900, color:value !== "" ? C.white : C.muted }}>
            {value !== "" ? value : "—"}
          </div>
          <button onClick={onInc} style={{ width:26, height:26, borderRadius:4, border:`1px solid ${C.border}`, background:"#050D08", color:C.white, fontFamily:"'League Spartan',sans-serif", fontSize:14, fontWeight:900, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>+</button>
        </div>
      </div>
    );

    const adjustScore = (side, delta) => {
      const cur = side === "home" ? parseInt(pickHome) : parseInt(pickAway);
      const next = Math.max(0, (isNaN(cur) ? 0 : cur) + delta);
      handleScoreChange(side, String(next));
    };

    return (
      <div style={{
        background:C.surface, border:`1px solid ${pickTeam ? C.gold : C.border}`,
        borderRadius:6, overflow:"hidden", transition:"border-color 0.2s",
      }}>
        <div style={{
          padding:"6px 10px", borderBottom:`1px solid ${C.border}`,
          background:`linear-gradient(90deg,${C.greenDark},#050D08)`,
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:8,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:3, height:14, background:C.green, borderRadius:1 }} />
            <span style={{ fontFamily:"'League Spartan',sans-serif", fontSize:9, fontWeight:700, color:C.mutedLight, textTransform:"uppercase", letterSpacing:"0.12em" }}>
              Match {matchId} · {roundLabel}
            </span>
          </div>
          {locked ? <LockBadge status={koMatchStatus(matchId)} /> : pickTeam && <span style={{ fontSize:8, color:C.gold, fontFamily:"'League Spartan',sans-serif", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>Picked</span>}
        </div>

        <div style={{ padding:"10px" }}>
          <TeamPill
            team={homeTeam} source={homeSource}
            isPick={pickTeam === homeTeam}
            isClickable={canPick}
            onClick={() => onKnockoutPick(matchId, homeTeam, pickHome, pickAway)}
          />
          <div style={{ display:"flex", alignItems:"center", gap:8, margin:"6px 0" }}>
            <div style={{ flex:1, height:1, background:C.border }} />
            <span style={{ fontSize:9, color:C.green, fontFamily:"'League Spartan',sans-serif", fontWeight:700 }}>VS</span>
            <div style={{ flex:1, height:1, background:C.border }} />
          </div>
          <TeamPill
            team={awayTeam} source={awaySource}
            isPick={pickTeam === awayTeam}
            isClickable={canPick}
            onClick={() => onKnockoutPick(matchId, awayTeam, pickHome, pickAway)}
          />

          {homeTeam && awayTeam && !locked && (
            <div style={{ marginTop:10, borderTop:`1px solid ${C.border}`, paddingTop:10 }}>
              <div style={{ fontSize:8, color:C.mutedLight, fontFamily:"'League Spartan',sans-serif", letterSpacing:"0.1em", textTransform:"uppercase", textAlign:"center", marginBottom:8 }}>
                Predict final score
              </div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                <ScoreStepper team={homeTeam} value={pickHome} onInc={() => adjustScore("home", 1)} onDec={() => adjustScore("home", -1)} />
                <span style={{ fontFamily:"'League Spartan',sans-serif", fontSize:14, color:C.mutedLight, fontWeight:900 }}>:</span>
                <ScoreStepper team={awayTeam} value={pickAway} onInc={() => adjustScore("away", 1)} onDec={() => adjustScore("away", -1)} />
              </div>
              {!pickTeam && pickHome === "" && (
                <div style={{ marginTop:6, fontSize:8, color:C.muted, fontFamily:"'League Spartan',sans-serif", letterSpacing:"0.08em", textTransform:"uppercase", textAlign:"center" }}>
                  Tap a team or use + to predict the score
                </div>
              )}
            </div>
          )}

          {homeTeam && awayTeam && locked && (pickHome !== "" || pickTeam) && (
            <div style={{ marginTop:10, borderTop:`1px solid ${C.border}`, paddingTop:10, textAlign:"center" }}>
              <div style={{ fontSize:8, color:C.mutedLight, fontFamily:"'League Spartan',sans-serif", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>
                Your locked prediction
              </div>
              <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:16, fontWeight:900, color:C.mutedLight }}>
                {pickHome !== "" ? `${pickHome} : ${pickAway}` : pickTeam}
              </div>
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
    const pickedCount = matches.filter(m => getPickTeam(m.id)).length;
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
  // A round is complete once every match in it has a real, finished result — determined
  // via resolveKnockoutMatch (hardcoded ground truth first, live API second), not by
  // looking group-stage-shaped liveScores up by numeric ID (which never matched anything).
  const isRoundComplete = (matchIds) => matchIds.every(id => {
    const real = resolveKnockoutMatch(id, koApiMatches || []);
    return real && real.status === "FINISHED" && !!real.winner;
  });

  const r32Complete = isRoundComplete(R32_MATCHES.map(m => m.id));
  const r16Complete = isRoundComplete(R16_MATCHES.map(m => m.id));
  const qfComplete = isRoundComplete(QF_MATCHES.map(m => m.id));
  const sfComplete = isRoundComplete(SF_MATCHES.map(m => m.id));

  // Lock screen for a round that hasn't unlocked yet
  const RoundLocked = ({ roundName, unlocksWhen }) => (
    <div style={{
      background:C.surface, border:`1px dashed ${C.border}`, borderRadius:8,
      padding:"24px 20px", textAlign:"center", marginBottom:36,
    }}>
      <div style={{ fontSize:24, marginBottom:8 }}>🔒</div>
      <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:14, fontWeight:900, color:C.mutedLight, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>
        {roundName} Locked
      </div>
      <div style={{ fontFamily:"'Quicksand',sans-serif", fontSize:12, color:C.mutedLight, lineHeight:1.6 }}>
        Unlocks once all {unlocksWhen} matches are complete.
      </div>
    </div>
  );

  const r32Cards = R32_MATCHES.map(m => ({
    id: m.id,
    card: (
      <MatchCard key={m.id} matchId={m.id} roundLabel={`R32 · ${m.date}`}
        homeTeam={m.home === "TBD" ? null : m.home}
        awayTeam={m.away === "TBD" ? null : m.away}
        homeSource={m.home === "TBD" ? "TBD" : m.home}
        awaySource={m.away === "TBD" ? "TBD" : m.away}
      />
    ),
  }));

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
  const finalWinner = getPickTeam(104);
  const finalHomeFlag = TEAM_FLAGS[finalHome];
  const finalAwayFlag = TEAM_FLAGS[finalAway];
  const finalWinnerFlag = TEAM_FLAGS[finalWinner];

  return (
    <div className="fade-in">
      <div style={{ marginBottom:24, textAlign:"center" }}>
        <div style={{ fontFamily:"'League Spartan',sans-serif",fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:C.gold,fontWeight:700,marginBottom:6 }}>
          Full Knockout Bracket
        </div>
        <p style={{ fontSize:12,color:C.mutedLight,fontFamily:"'Quicksand',sans-serif", lineHeight:1.6, maxWidth:560, margin:"0 auto" }}>
          Pick winners for each round. R32 populates from group stage results. Subsequent rounds populate as you make your picks. Tap a team to select them as your winner.
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

      {/* ── ROUND OF 16 ── unlocks once all R32 results are in */}
      {r32Complete ? renderRound({
        title: "Round of 16",
        matches: r16Cards,
        roundLabel: "R16",
        accentColor: C.green,
        cardSize: 280,
        headerSize: 14,
      }) : <RoundLocked roundName="Round of 16" unlocksWhen="Round of 32" />}

      {/* ── QUARTERFINALS ── unlocks once all R16 results are in */}
      {r16Complete ? renderRound({
        title: "Quarterfinals",
        matches: qfCards,
        roundLabel: "QF",
        accentColor: C.gold,
        cardSize: 320,
        headerSize: 15,
      }) : <RoundLocked roundName="Quarterfinals" unlocksWhen="Round of 16" />}

      {/* ── SEMIFINALS ── unlocks once all QF results are in */}
      {!qfComplete ? <RoundLocked roundName="Semifinals" unlocksWhen="Quarterfinal" /> : <div style={{ marginBottom:40 }}>
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
          }}>{sfCards.filter(m => getPickTeam(m.id)).length} / 2</div>
        </div>
        <div style={{
          display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))", gap:16,
        }}>
          {SF_MATCHES.map(m => {
            const homeWinner = getWinnerOfMatch(m.src[0]);
            const awayWinner = getWinnerOfMatch(m.src[1]);
            const pickData = knockoutPicks[m.id];
            const pick = pickData ? (typeof pickData === "string" ? pickData : pickData.team) : null;
            const pickHome = pickData && typeof pickData !== "string" ? pickData.home : "";
            const pickAway = pickData && typeof pickData !== "string" ? pickData.away : "";
            const locked = isKoMatchLocked(m.id);
            const canPick = !!(homeWinner && awayWinner) && !locked;
            return (
              <div key={m.id} style={{
                background:`linear-gradient(135deg, ${C.greenDeep} 0%, #000 100%)`,
                border:`2px solid ${pick ? C.gold : "rgba(196,159,75,0.4)"}`,
                borderRadius:10, padding:"18px 18px",
                boxShadow: pick ? `0 0 30px rgba(196,159,75,0.15)` : "none",
                transition:"all 0.3s",
              }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:14 }}>
                  <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:10, color:C.gold, fontWeight:900, letterSpacing:"0.14em", textTransform:"uppercase", textAlign:"center" }}>Semifinal · Match {m.id}</div>
                  {locked && <LockBadge status={koMatchStatus(m.id)} />}
                </div>
                <TeamPill team={homeWinner} source={`Winner M${m.src[0]}`}
                  isPick={pick === homeWinner} isClickable={canPick}
                  onClick={() => onKnockoutPick(m.id, homeWinner, pickHome, pickAway)}
                />
                <div style={{ display:"flex", alignItems:"center", gap:8, margin:"10px 0" }}>
                  <div style={{ flex:1, height:1, background:C.border }} />
                  <span style={{ fontSize:10, color:C.gold, fontFamily:"'League Spartan',sans-serif", fontWeight:900, letterSpacing:"0.14em" }}>VS</span>
                  <div style={{ flex:1, height:1, background:C.border }} />
                </div>
                <TeamPill team={awayWinner} source={`Winner M${m.src[1]}`}
                  isPick={pick === awayWinner} isClickable={canPick}
                  onClick={() => onKnockoutPick(m.id, awayWinner, pickHome, pickAway)}
                />
                {canPick && (
                  <div style={{ marginTop:10, borderTop:`1px solid ${C.border}`, paddingTop:10, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                    {[["home", pickHome, homeWinner], ["away", pickAway, awayWinner]].map(([side, val, team], idx) => (
                      <React.Fragment key={side}>
                        {idx === 1 && <span style={{ fontFamily:"'League Spartan',sans-serif", fontSize:14, color:C.mutedLight, fontWeight:900 }}>:</span>}
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                          <span style={{ fontSize:8, color:C.mutedLight, fontFamily:"'League Spartan',sans-serif", textTransform:"uppercase", letterSpacing:"0.06em" }}>{team || "?"}</span>
                          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                            <button onClick={() => { const c=parseInt(val); const n=Math.max(0,(isNaN(c)?0:c)-1); const h=side==="home"?String(n):pickHome; const a=side==="away"?String(n):pickAway; const hN=parseInt(h),aN=parseInt(a); const t=!isNaN(hN)&&!isNaN(aN)&&hN!==aN?(hN>aN?homeWinner:awayWinner):pick; onKnockoutPick(m.id,t||pick,h,a); }} style={{ width:26,height:26,borderRadius:4,border:`1px solid ${C.border}`,background:"#050D08",color:C.white,fontFamily:"'League Spartan',sans-serif",fontSize:14,fontWeight:900,cursor:"pointer" }}>−</button>
                            <div style={{ width:32,height:32,borderRadius:4,border:`1px solid ${val!==""?C.green:C.border}`,background:"#050D08",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'League Spartan',sans-serif",fontSize:16,fontWeight:900,color:val!==""?C.white:C.muted }}>{val!==""?val:"—"}</div>
                            <button onClick={() => { const c=parseInt(val); const n=(isNaN(c)?0:c)+1; const h=side==="home"?String(n):pickHome; const a=side==="away"?String(n):pickAway; const hN=parseInt(h),aN=parseInt(a); const t=!isNaN(hN)&&!isNaN(aN)&&hN!==aN?(hN>aN?homeWinner:awayWinner):pick; onKnockoutPick(m.id,t||pick,h,a); }} style={{ width:26,height:26,borderRadius:4,border:`1px solid ${C.border}`,background:"#050D08",color:C.white,fontFamily:"'League Spartan',sans-serif",fontSize:14,fontWeight:900,cursor:"pointer" }}>+</button>
                          </div>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                )}
                {locked && (pickHome !== "" || pick) && (
                  <div style={{ marginTop:10, borderTop:`1px solid ${C.border}`, paddingTop:10, textAlign:"center" }}>
                    <div style={{ fontSize:8, color:C.mutedLight, fontFamily:"'League Spartan',sans-serif", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Your locked prediction</div>
                    <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:16, fontWeight:900, color:C.mutedLight }}>{pickHome !== "" ? `${pickHome} : ${pickAway}` : pick}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>}

      {/* ── THIRD PLACE PLAYOFF ── unlocks once SFs are done */}
      {!sfComplete ? <RoundLocked roundName="Third Place Playoff" unlocksWhen="Semifinal" /> : <div style={{ marginBottom:40 }}>
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
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            }}>
              Bronze medal match · Match 103
              {isKoMatchLocked(103) && <LockBadge status={koMatchStatus(103)} />}
            </div>
            <TeamPill team={tpHome} source="Loser SF1"
              isPick={getPickTeam(103) === tpHome} isClickable={!!(tpHome && tpAway) && !isKoMatchLocked(103)}
              onClick={() => { const p=knockoutPicks[103]; const ph=p&&typeof p!=="string"?p.home:""; const pa=p&&typeof p!=="string"?p.away:""; onKnockoutPick(103, tpHome, ph, pa); }}
            />
            <div style={{ display:"flex", alignItems:"center", gap:8, margin:"7px 0" }}>
              <div style={{ flex:1, height:1, background:C.border }} />
              <span style={{ fontSize:9, color:"#CD7F32", fontFamily:"'League Spartan',sans-serif", fontWeight:700, letterSpacing:"0.1em" }}>VS</span>
              <div style={{ flex:1, height:1, background:C.border }} />
            </div>
            <TeamPill team={tpAway} source="Loser SF2"
              isPick={getPickTeam(103) === tpAway} isClickable={!!(tpHome && tpAway) && !isKoMatchLocked(103)}
              onClick={() => { const p=knockoutPicks[103]; const ph=p&&typeof p!=="string"?p.home:""; const pa=p&&typeof p!=="string"?p.away:""; onKnockoutPick(103, tpAway, ph, pa); }}
            />
          </div>
        </div>
      </div>}

      {/* ── THE FINAL ── unlocks once SFs are done */}
      {sfComplete && <div style={{ marginBottom:24, position:"relative" }}>
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
              fontFamily:"'Quicksand',sans-serif", fontSize:12, color:C.mutedLight,
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

            {/* Pick interface (only show when both finalists known and not locked) */}
            {finalHome && finalAway && !isKoMatchLocked(104) ? (
              <div style={{
                background:"rgba(0,0,0,0.4)", border:`1px solid ${C.border}`,
                borderRadius:10, padding:"16px 18px", maxWidth:420, margin:"0 auto",
              }}>
                <div style={{
                  fontFamily:"'League Spartan',sans-serif", fontSize:10,
                  color:C.muted, letterSpacing:"0.14em", textTransform:"uppercase",
                  marginBottom:12, fontWeight:700,
                }}>{finalWinner ? "Change Your Pick" : "Pick Your Champion"}</div>

                {(() => {
                  const fp = knockoutPicks[104];
                  const fph = fp && typeof fp !== "string" ? fp.home : "";
                  const fpa = fp && typeof fp !== "string" ? fp.away : "";
                  return (
                    <>
                      <div onClick={() => onKnockoutPick(104, finalHome, fph, fpa)} style={{
                        display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                        background: finalWinner === finalHome ? "rgba(196,159,75,0.18)" : "rgba(90,148,123,0.06)",
                        border:`1px solid ${finalWinner === finalHome ? C.gold : C.tealBorder}`,
                        borderRadius:6, cursor:"pointer", marginBottom:8, transition:"all 0.15s",
                      }}>
                        {finalHomeFlag && <img src={FLAG_URL(finalHomeFlag)} alt={finalHome} style={{ width:24, height:18, objectFit:"cover", borderRadius:2 }} />}
                        <span style={{ fontFamily:"'League Spartan',sans-serif", fontSize:14, fontWeight:700, color: finalWinner === finalHome ? C.gold : C.white, flex:1, textAlign:"left", textTransform:"uppercase", letterSpacing:"0.04em" }}>{finalHome}</span>
                        {finalWinner === finalHome && <span style={{ color:C.gold, fontSize:14 }}>✓</span>}
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, margin:"6px 0" }}>
                        <div style={{ flex:1, height:1, background:C.border }} />
                        <span style={{ fontSize:11, color:C.gold, fontFamily:"'League Spartan',sans-serif", fontWeight:900, letterSpacing:"0.2em" }}>FINAL</span>
                        <div style={{ flex:1, height:1, background:C.border }} />
                      </div>
                      <div onClick={() => onKnockoutPick(104, finalAway, fph, fpa)} style={{
                        display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                        background: finalWinner === finalAway ? "rgba(196,159,75,0.18)" : "rgba(90,148,123,0.06)",
                        border:`1px solid ${finalWinner === finalAway ? C.gold : C.tealBorder}`,
                        borderRadius:6, cursor:"pointer", transition:"all 0.15s",
                      }}>
                        {finalAwayFlag && <img src={FLAG_URL(finalAwayFlag)} alt={finalAway} style={{ width:24, height:18, objectFit:"cover", borderRadius:2 }} />}
                        <span style={{ fontFamily:"'League Spartan',sans-serif", fontSize:14, fontWeight:700, color: finalWinner === finalAway ? C.gold : C.white, flex:1, textAlign:"left", textTransform:"uppercase", letterSpacing:"0.04em" }}>{finalAway}</span>
                        {finalWinner === finalAway && <span style={{ color:C.gold, fontSize:14 }}>✓</span>}
                      </div>
                      <div style={{ marginTop:14, borderTop:`1px solid ${C.border}`, paddingTop:14 }}>
                        <div style={{ fontSize:9, color:C.mutedLight, fontFamily:"'League Spartan',sans-serif", letterSpacing:"0.1em", textTransform:"uppercase", textAlign:"center", marginBottom:8 }}>Predict final score</div>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                          {[["home", fph, finalHome], ["away", fpa, finalAway]].map(([side, val, team], idx) => (
                            <React.Fragment key={side}>
                              {idx === 1 && <span style={{ fontFamily:"'League Spartan',sans-serif", fontSize:20, color:C.mutedLight, fontWeight:900 }}>:</span>}
                              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                                <span style={{ fontSize:8, color:C.mutedLight, fontFamily:"'League Spartan',sans-serif", textTransform:"uppercase", letterSpacing:"0.06em" }}>{team || "?"}</span>
                                <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                                  <button onClick={() => { const c=parseInt(val); const n=Math.max(0,(isNaN(c)?0:c)-1); const h=side==="home"?String(n):fph; const a=side==="away"?String(n):fpa; const hN=parseInt(h),aN=parseInt(a); const t=!isNaN(hN)&&!isNaN(aN)&&hN!==aN?(hN>aN?finalHome:finalAway):finalWinner; onKnockoutPick(104,t||finalWinner,h,a); }} style={{ width:30,height:30,borderRadius:4,border:`1px solid ${C.border}`,background:"#050D08",color:C.white,fontFamily:"'League Spartan',sans-serif",fontSize:16,fontWeight:900,cursor:"pointer" }}>−</button>
                                  <div style={{ width:40,height:40,borderRadius:4,border:`1px solid ${val!==""?C.gold:C.border}`,background:"#050D08",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'League Spartan',sans-serif",fontSize:20,fontWeight:900,color:val!==""?C.white:C.muted }}>{val!==""?val:"—"}</div>
                                  <button onClick={() => { const c=parseInt(val); const n=(isNaN(c)?0:c)+1; const h=side==="home"?String(n):fph; const a=side==="away"?String(n):fpa; const hN=parseInt(h),aN=parseInt(a); const t=!isNaN(hN)&&!isNaN(aN)&&hN!==aN?(hN>aN?finalHome:finalAway):finalWinner; onKnockoutPick(104,t||finalWinner,h,a); }} style={{ width:30,height:30,borderRadius:4,border:`1px solid ${C.border}`,background:"#050D08",color:C.white,fontFamily:"'League Spartan',sans-serif",fontSize:16,fontWeight:900,cursor:"pointer" }}>+</button>
                                </div>
                              </div>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : finalHome && finalAway && isKoMatchLocked(104) ? (
              <div style={{
                background:"rgba(0,0,0,0.4)", border:`1px solid ${C.border}`,
                borderRadius:10, padding:"16px 18px", maxWidth:420, margin:"0 auto", textAlign:"center",
              }}>
                <div style={{ marginBottom:10 }}><LockBadge status={koMatchStatus(104)} /></div>
                <div style={{ fontSize:12, color:C.mutedLight, fontFamily:"'Quicksand',sans-serif" }}>
                  Your Final pick is locked in — the match has {koMatchStatus(104)==="FINISHED"?"finished":"started"}.
                </div>
              </div>
            ) : (
              <div style={{
                background:"rgba(0,0,0,0.3)", border:`1px dashed ${C.border}`,
                borderRadius:10, padding:"24px 18px", maxWidth:420, margin:"0 auto",
              }}>
                <div style={{ fontSize:13, color:C.mutedLight, fontFamily:"'Quicksand',sans-serif", lineHeight:1.6 }}>
                  Complete your Semifinal picks to choose the World Cup Champion here.
                </div>
                <div style={{ marginTop:10, fontSize:11, color:C.mutedLight, fontFamily:"'Quicksand',sans-serif" }}>
                  Or pick directly in the <span style={{ color:C.gold }}>Your Tournament Stats</span> tab — they sync.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>}
    </div>
  );
}

// ── Your Tournament Stats — Personal Stats & Awards Hub ───────────────────────
function TournamentStatsContent({ champion, scores, liveScores, knockoutPicks, koApiMatches, displayName, readOnly, setTab }) {
  const champCode = TEAM_FLAGS[champion];
  const stats = calcUserStats(scores, liveScores || {}, champion, knockoutPicks || {}, koApiMatches || []);

  // Bracket journey — picks across all knockout rounds
  const allPicks = Object.entries(knockoutPicks || {}).map(([id, val]) => {
    const team = typeof val === "string" ? val : val?.team;
    if (!team) return null;
    return { id: parseInt(id), team, flag: TEAM_FLAGS[team] };
  }).filter(Boolean);

  const r32Picks = allPicks.filter(p => p.id >= 73 && p.id <= 88);
  const r16Picks = allPicks.filter(p => p.id >= 89 && p.id <= 96);
  const qfPicks = allPicks.filter(p => p.id >= 97 && p.id <= 100);
  const sfPicks = allPicks.filter(p => p.id >= 101 && p.id <= 102);
  const finalPick = allPicks.find(p => p.id === 104);
  const thirdPick = allPicks.find(p => p.id === 103);

  const teamCounts = {};
  allPicks.forEach(p => { teamCounts[p.team] = (teamCounts[p.team] || 0) + 1; });
  const mostPicked = Object.entries(teamCounts).sort((a,b) => b[1] - a[1])[0];

  const groupPredictionsCount = Object.values(scores || {}).filter(s => s.home !== "" && s.away !== "").length;
  const knockoutPicksCount = allPicks.length;

  // ── Award definitions (shared shape with Leaderboard's "who holds it" view) ──
  const awards = [
    { id:"sharpshooter", title:"Sharpshooter", subtitle:"Most exact scorelines called", icon:"🎯", value:stats.exact, suffix:"exact", unlocked:stats.exact >= 1 },
    { id:"pundit", title:"The Pundit", subtitle:"Most correct match results overall", icon:"📊", value:stats.exact + stats.correct, suffix:"correct", unlocked:(stats.exact + stats.correct) >= 1 },
    { id:"mathematician", title:"Goal Mathematician", subtitle:"Smallest average scoreline error", icon:"📐", value:stats.avgDiff ?? "—", suffix:"avg off", unlocked:stats.avgDiff !== null && parseFloat(stats.avgDiff) <= 1.5 },
    { id:"streak", title:"Streak Master", subtitle:"Longest run of correct picks in a row", icon:"🔥", value:stats.longestStreak, suffix:"streak", unlocked:stats.longestStreak >= 3 },
    { id:"crystalball", title:"Crystal Ball", subtitle:"5+ exact scores back to back", icon:"🔯", value:stats.longestStreak, suffix:"streak", unlocked:stats.longestStreak >= 5 },
    { id:"heartbreak", title:"Heartbreak Kid", subtitle:"Picks that missed by just one goal", icon:"💔", value:stats.heartbreakers, suffix:"close calls", unlocked:stats.heartbreakers >= 1 },
    { id:"bold", title:"Bold Caller", subtitle:"Exact picks on 3+ goal blowouts", icon:"⚡", value:stats.boldCalls, suffix:"bold", unlocked:stats.boldCalls >= 1 },
    { id:"goalfest", title:"Goal Gambler", subtitle:"Correct calls on 3+ goal matches", icon:"⚽", value:stats.goalfests, suffix:"goalfests", unlocked:stats.goalfests >= 1 },
    { id:"realist", title:"The Realist", subtitle:"Exact 1-0 / 0-1 grinder predictions", icon:"🛡️", value:stats.realist, suffix:"grinders", unlocked:stats.realist >= 1 },
    { id:"defensive", title:"Defensive Mastermind", subtitle:"Exact on 0-0, 1-0, or 0-1 results", icon:"🧱", value:stats.defensiveCalls, suffix:"clean", unlocked:stats.defensiveCalls >= 1 },
    { id:"whisperer", title:"Group Whisperer", subtitle:"Group winners correctly called", icon:"🔮", value:stats.groupWinnersHit, suffix:"of 12", unlocked:stats.groupWinnersHit >= 1 },
    { id:"sweeper", title:"Group Sweeper", subtitle:"Every match in a group called right", icon:"🧹", value:stats.perfectGroups, suffix:"perfect", unlocked:stats.perfectGroups >= 1 },
    { id:"architect", title:"Group Architect", subtitle:"Perfect 1st-4th group order calls", icon:"🏗️", value:stats.perfectGroupOrders, suffix:"perfect", unlocked:stats.perfectGroupOrders >= 1 },
    { id:"firstblood", title:"First Blood", subtitle:"Exact score on the tournament opener", icon:"🩸", value:stats.firstMatchExact ? "✓" : "—", suffix:stats.firstMatchExact ? "nailed it" : "Match A-0", unlocked:stats.firstMatchExact },
    { id:"chaos", title:"Chaos Theory", subtitle:"Correctly called draws", icon:"🌀", value:stats.correctDraws, suffix:"draws", unlocked:stats.correctDraws >= 1 },
    { id:"ironwall", title:"Iron Wall", subtitle:"Fewest goals conceded on correct picks", icon:"🧊", value:stats.ironWallAvg ?? "—", suffix:"avg conceded", unlocked:stats.ironWallAvg !== null && parseFloat(stats.ironWallAvg) <= 1 },
    { id:"comeback", title:"Comeback Trail", subtitle:"Points earned across your last 5 results", icon:"📈", value:stats.comebackPts, suffix:"pts", unlocked:stats.comebackPts >= 10 },
    { id:"specialist", title:"The Specialist", subtitle:"Your sharpest group — hit rate", icon:"🧠", value:stats.specialistGroup ? `Grp ${stats.specialistGroup}` : "—", suffix:stats.specialistGroup ? `${stats.specialistRate}% hit` : "no data", unlocked:!!stats.specialistGroup && stats.specialistRate >= 50 },
    { id:"goals", title:"Total Goals Predicted", subtitle:"Sum of every goal you've called", icon:"🥅", value:stats.totalGoalsPredicted, suffix:"goals", unlocked:stats.totalGoalsPredicted >= 1 },
    { id:"oracle", title:"The Oracle", subtitle:"Picked the actual champion", icon:"👁️", value:champion || "—", suffix:champion ? "selected" : "no pick", unlocked: (() => {
      const finalReal = resolveKnockoutMatch(104, koApiMatches || []);
      return !!champion && !!finalReal?.winner && finalReal.winner === champion;
    })() },
    { id:"laughs", title:"Last Laugh", subtitle:"Exact score on the Final itself", icon:"🏆", value:getKoPick(knockoutPicks, 104)?.team || "—", suffix:getKoPick(knockoutPicks, 104) ? "picked" : "no pick", unlocked: (() => {
      const finalReal = resolveKnockoutMatch(104, koApiMatches || []);
      const finalPickObj = getKoPick(knockoutPicks, 104);
      return finalReal?.winner ? scoreKnockoutResult(finalPickObj, finalReal) === "exact" : false;
    })() },
  ];
  const awardCount = awards.filter(a => a.unlocked).length;

  return (
    <div className="fade-in" style={{ maxWidth:880, margin:"0 auto" }}>

      {/* ── HEADER ── */}
      <div style={{
        background:`linear-gradient(135deg, ${C.greenDeep} 0%, #000 55%, ${C.greenDeep} 100%)`,
        border:`2px solid ${C.gold}`, borderRadius:14,
        padding:"32px 28px", textAlign:"center", marginBottom:24,
        position:"relative", overflow:"hidden",
        boxShadow:`0 0 50px rgba(196,159,75,0.15)`,
      }}>
        <div style={{
          position:"absolute", right:-40, top:-30,
          color:"rgba(196,159,75,0.05)", width:280, height:280,
          pointerEvents:"none",
        }} dangerouslySetInnerHTML={{ __html:TROPHY_SVG }} />

        <div style={{ position:"relative" }}>
          <div style={{
            fontFamily:"'League Spartan',sans-serif", fontSize:11,
            color:C.gold, fontWeight:700, letterSpacing:"0.24em",
            textTransform:"uppercase", marginBottom:10,
          }}>◆ Your Tournament Stats ◆</div>

          <div style={{
            fontFamily:"'League Spartan',sans-serif",
            fontSize:"clamp(26px, 5vw, 38px)", fontWeight:900,
            color:C.white, textTransform:"uppercase",
            letterSpacing:"-0.01em", marginBottom:6,
          }}>{displayName ? `${displayName}'s` : "Your"} Run So Far</div>

          <p style={{
            fontFamily:"'Quicksand',sans-serif", fontSize:13, color:C.mutedLight,
            lineHeight:1.7, maxWidth:460, margin:"0 auto",
          }}>
            Every prediction, every point, every accolade earned — all in one place.
          </p>

          {/* Champion mini-display */}
          {champion ? (
            <div style={{ marginTop:22, display:"inline-flex", alignItems:"center", gap:10, background:"rgba(196,159,75,0.1)", border:`1px solid rgba(196,159,75,0.3)`, borderRadius:30, padding:"8px 18px" }}>
              {champCode && <img src={FLAG_URL(champCode)} alt={champion} style={{ width:24, height:18, objectFit:"cover", borderRadius:2 }} />}
              <span style={{ fontFamily:"'League Spartan',sans-serif", fontSize:12, color:C.gold, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                Backing {champion} to win it all
              </span>
            </div>
          ) : readOnly ? (
            <div style={{ marginTop:22, fontSize:12, color:C.mutedLight, fontFamily:"'Quicksand',sans-serif" }}>No champion picked yet.</div>
          ) : (
            <button onClick={() => setTab && setTab("bracket")} style={{
              marginTop:22, background:C.green, border:"none", borderRadius:30,
              color:"#fff", fontFamily:"'League Spartan',sans-serif",
              fontSize:11, fontWeight:700, letterSpacing:"0.1em",
              textTransform:"uppercase", padding:"10px 22px", cursor:"pointer",
            }}>Pick Your Champion in The Bracket →</button>
          )}
        </div>
      </div>

      {/* ── HEADLINE STAT STRIP ── */}
      {(() => {
        const headlineStats = [
          { label:"Combined Points", value:stats.combinedTotalPts, color:C.gold, icon:"⭐", big:true },
          { label:"Group Stage Pts", value:stats.groupStagePts, color:C.white, icon:"📋" },
          { label:"Knockout Pts", value:stats.knockoutPts, color:C.green, icon:"🏆" },
          { label:"Accuracy", value:`${stats.accuracy}%`, color:C.green, icon:"🎯" },
          { label:"Awards Won", value:`${awardCount}/${awards.length}`, color:C.gold, icon:"🏅" },
          { label:"Exact Scores", value:stats.exact, color:C.exact, icon:"💯" },
        ];
        const cols = balancedColumns(headlineStats.length, 6);
        return (
          <div className="balanced-grid" style={{
            gap:10, marginBottom:28,
            maxWidth:780, marginLeft:"auto", marginRight:"auto",
            "--cols": cols,
          }}>
            {headlineStats.map(stat => (
              <div key={stat.label} style={{
                background:stat.big ? `linear-gradient(135deg, rgba(196,159,75,0.15), ${C.surface})` : C.surface,
                border:`1px solid ${stat.big ? "rgba(196,159,75,0.4)" : C.border}`,
                borderRadius:8, padding:stat.big ? "20px 14px" : "16px 12px", textAlign:"center",
              }}>
                <div style={{ fontSize:stat.big ? 22 : 18, marginBottom:4 }}>{stat.icon}</div>
                <div style={{
                  fontFamily:"'League Spartan',sans-serif", fontSize:stat.big ? 32 : 26, fontWeight:900,
                  color:stat.color, lineHeight:1,
                }}>{stat.value}</div>
                <div style={{
                  fontFamily:"'League Spartan',sans-serif", fontSize:9,
                  color:C.mutedLight, letterSpacing:"0.1em", textTransform:"uppercase",
                  marginTop:6, fontWeight:700,
                }}>{stat.label}</div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── GROUP STAGE vs KNOCKOUT — clear, explicit split of where points came from ── */}
      <SectionHeader title="Points Breakdown — Group Stage vs Knockout" />
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",
        gap:14, marginBottom:28, maxWidth:780, marginLeft:"auto", marginRight:"auto",
      }}>
        {/* Group Stage card */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"18px 20px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:11, color:C.mutedLight, fontWeight:900, letterSpacing:"0.12em", textTransform:"uppercase" }}>📋 Group Stage</div>
            <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:26, fontWeight:900, color:C.white }}>{stats.groupStagePts}<span style={{ fontSize:12, color:C.mutedLight, fontWeight:700 }}> pts</span></div>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, fontFamily:"'Quicksand',sans-serif", color:C.mutedLight, padding:"6px 0", borderTop:`1px solid ${C.border}` }}>
            <span>Match scoreline points</span><span style={{ color:C.white, fontWeight:700 }}>{stats.totalPts}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, fontFamily:"'Quicksand',sans-serif", color:C.mutedLight, padding:"6px 0", borderTop:`1px solid ${C.border}` }}>
            <span>Group order points</span><span style={{ color:C.white, fontWeight:700 }}>{stats.groupOrderPoints}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, fontFamily:"'Quicksand',sans-serif", color:C.mutedLight, padding:"6px 0", borderTop:`1px solid ${C.border}` }}>
            <span>Perfect group orders</span><span style={{ color:C.gold, fontWeight:700 }}>{stats.perfectGroupOrders}</span>
          </div>
        </div>

        {/* Knockout card */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"18px 20px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:11, color:C.mutedLight, fontWeight:900, letterSpacing:"0.12em", textTransform:"uppercase" }}>🏆 Knockout Stage</div>
            <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:26, fontWeight:900, color:C.green }}>{stats.knockoutPts}<span style={{ fontSize:12, color:C.mutedLight, fontWeight:700 }}> pts</span></div>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, fontFamily:"'Quicksand',sans-serif", color:C.mutedLight, padding:"6px 0", borderTop:`1px solid ${C.border}` }}>
            <span>Exact scoreline picks</span><span style={{ color:C.exact, fontWeight:700 }}>{stats.knockoutExact}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, fontFamily:"'Quicksand',sans-serif", color:C.mutedLight, padding:"6px 0", borderTop:`1px solid ${C.border}` }}>
            <span>Correct winner picks</span><span style={{ color:C.correct, fontWeight:700 }}>{stats.knockoutCorrect}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, fontFamily:"'Quicksand',sans-serif", color:C.mutedLight, padding:"6px 0", borderTop:`1px solid ${C.border}` }}>
            <span>Matches scored so far</span><span style={{ color:C.white, fontWeight:700 }}>{stats.knockoutScored} / {knockoutPicksCount}</span>
          </div>
        </div>
      </div>

      {/* ── DETAILED STATS ── */}
      <SectionHeader title="Prediction Breakdown" />
      {(() => {
        const breakdownStats = [
          { label:"Predictions Made", value:groupPredictionsCount },
          { label:"Correct Results", value:stats.correct, color:C.correct },
          { label:"Wrong Picks", value:stats.wrong, color:C.wrong },
          { label:"Avg Goal Error", value:stats.avgDiff ?? "—" },
          { label:"Best Streak", value:stats.longestStreak },
          { label:"Perfect Groups (Order)", value:stats.perfectGroupOrders, color:C.gold },
          { label:"Perfect Groups (Score)", value:stats.perfectGroups },
          { label:"Bracket Picks Made", value:knockoutPicksCount },
        ];
        const cols = balancedColumns(breakdownStats.length, 4);
        return (
          <div className="balanced-grid" style={{
            gap:10, marginBottom:28,
            maxWidth:760, marginLeft:"auto", marginRight:"auto",
            "--cols": cols,
          }}>
            {breakdownStats.map(s => (
              <div key={s.label} style={{
                background:C.surface, border:`1px solid ${C.border}`,
                borderRadius:8, padding:"12px 14px", textAlign:"center",
              }}>
                <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:20, fontWeight:900, color:s.color || C.white }}>{s.value}</div>
                <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:9, color:C.mutedLight, letterSpacing:"0.08em", textTransform:"uppercase", marginTop:4, fontWeight:700 }}>{s.label}</div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── GROUP PERFORMANCE BREAKDOWN ── */}
      {(() => {
        const safeLive = liveScores || {};
        const groupData = Object.keys(GROUPS).map(gKey => {
          let correct = 0, scored = 0;
          GROUPS[gKey].matches.forEach((_,idx) => {
            const key = `${gKey}-${idx}`;
            const r = scoreResult(scores[key], safeLive[key], key);
            if (r !== null) { scored++; if (r === "exact" || r === "correct") correct++; }
          });
          // Perfect = correct 1st/2nd/3rd/4th finishing order — not match scores
          let orderResult = null;
          try { orderResult = calcGroupOrderScore(gKey, scores, safeLive); } catch(e) {}
          const isPerfectOrder = orderResult?.isPerfect ?? false;
          return { gKey, correct, scored, isPerfectOrder, orderPts: orderResult?.points ?? 0, correctSlots: orderResult?.correctSlots ?? 0 };
        });
        const anyScored = groupData.some(g => g.scored > 0);
        if (!anyScored) return null;
        return (
          <>
            <SectionHeader title="Group Performance" />
            <div className="balanced-grid" style={{ gap:8, marginBottom:28, "--cols": balancedColumns(12, 4) }}>
              {groupData.map(({ gKey, correct, scored, isPerfectOrder, orderPts, correctSlots }) => (
                <div key={gKey} style={{
                  background: isPerfectOrder ? `linear-gradient(135deg, rgba(196,159,75,0.12), ${C.surface})` : C.surface,
                  border:`1px solid ${isPerfectOrder ? C.gold : C.border}`,
                  borderRadius:8, padding:"14px 14px 12px", textAlign:"center",
                  position:"relative", opacity: scored === 0 ? 0.4 : 1,
                }}>
                  {isPerfectOrder && (
                    <div style={{
                      position:"absolute", top:-8, left:"50%", transform:"translateX(-50%)",
                      background:C.gold, color:"#000", fontSize:8, fontWeight:900,
                      fontFamily:"'League Spartan',sans-serif", letterSpacing:"0.1em",
                      padding:"2px 8px", borderRadius:10, textTransform:"uppercase",
                      whiteSpace:"nowrap",
                    }}>★ Perfect Order</div>
                  )}
                  <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:16, fontWeight:900, color:isPerfectOrder ? C.gold : C.mutedLight, marginBottom:6 }}>
                    Group {gKey}
                  </div>
                  {scored > 0 ? (
                    <>
                      <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:20, fontWeight:900, color:correct === scored ? C.green : C.white, lineHeight:1 }}>
                        {correct}/{scored}
                      </div>
                      <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:8, color:C.mutedLight, letterSpacing:"0.1em", textTransform:"uppercase", marginTop:2, marginBottom:6 }}>
                        matches
                      </div>
                      {orderPts > 0 ? (
                        <div style={{ fontSize:9, color:isPerfectOrder ? C.gold : C.green, fontFamily:"'League Spartan',sans-serif", fontWeight:700 }}>
                          {isPerfectOrder ? "✓ Perfect order" : `${correctSlots}/4 order slots`}
                        </div>
                      ) : (
                        <div style={{ fontSize:9, color:C.mutedLight, fontFamily:"'League Spartan',sans-serif" }}>
                          order pending
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ fontFamily:"'Quicksand',sans-serif", fontSize:10, color:C.mutedLight }}>No results yet</div>
                  )}
                </div>
              ))}
            </div>
          </>
        );
      })()}

      {/* ── BRACKET JOURNEY ── */}
      {(r32Picks.length > 0 || r16Picks.length > 0 || finalPick) && (
        <>
          <SectionHeader title="Your Bracket Journey" />
          <div style={{
            background:C.surface, border:`1px solid ${C.border}`,
            borderRadius:8, padding:"18px 18px", marginBottom:28,
          }}>
            {[
              { label:"Round of 32", picks:r32Picks, max:16 },
              { label:"Round of 16", picks:r16Picks, max:8 },
              { label:"Quarterfinals", picks:qfPicks, max:4 },
              { label:"Semifinals", picks:sfPicks, max:2 },
              { label:"Third Place", picks:thirdPick ? [thirdPick] : [], max:1 },
              { label:"Final Champion", picks:finalPick ? [finalPick] : [], max:1, highlight:true },
            ].map(round => (
              <div key={round.label} style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div style={{
                    fontFamily:"'League Spartan',sans-serif", fontSize:10,
                    color:round.highlight ? C.gold : C.mutedLight,
                    fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase",
                  }}>{round.label}</div>
                  <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:9, color:C.mutedLight, letterSpacing:"0.1em" }}>{round.picks.length} / {round.max}</div>
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
                        <span style={{ fontFamily:"'Quicksand',sans-serif", fontSize:11, color:round.highlight ? C.gold : C.white, fontWeight:600 }}>{p.team}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontFamily:"'Quicksand',sans-serif", fontSize:11, color:C.mutedLight, fontStyle:"italic" }}>No picks yet</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── AWARDS GRID ── */}
      <SectionHeader title={`Awards Cabinet — ${awardCount}/${awards.length} Unlocked`} />
      <div className="balanced-grid" style={{ gap:10, marginBottom:28, maxWidth:1000, marginLeft:"auto", marginRight:"auto", "--cols": balancedColumns(awards.length, 4) }}>
        {awards.map(award => (
          <div key={award.id} style={{
            background: award.unlocked ? `linear-gradient(135deg, rgba(196,159,75,0.1), ${C.surface})` : C.surface,
            border:`1px solid ${award.unlocked ? "rgba(196,159,75,0.35)" : C.border}`,
            borderRadius:8, padding:"14px 16px",
            opacity: award.unlocked ? 1 : 0.7,
            position:"relative",
          }}>
            {award.unlocked && (
              <div style={{
                position:"absolute", top:8, right:8,
                fontSize:8, color:C.gold, fontFamily:"'League Spartan',sans-serif",
                fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase",
                background:"rgba(196,159,75,0.15)", border:"1px solid rgba(196,159,75,0.4)",
                borderRadius:3, padding:"2px 6px",
              }}>Unlocked</div>
            )}
            <div style={{ fontSize:26, marginBottom:6 }}>{award.icon}</div>
            <div style={{
              fontFamily:"'League Spartan',sans-serif", fontSize:13, fontWeight:900,
              color:award.unlocked ? C.gold : C.mutedLight, textTransform:"uppercase",
              letterSpacing:"0.04em", marginBottom:3,
            }}>{award.title}</div>
            <div style={{
              fontFamily:"'Quicksand',sans-serif", fontSize:11, color:C.mutedLight,
              marginBottom:8, lineHeight:1.5,
            }}>{award.subtitle}</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
              <span style={{
                fontFamily:"'League Spartan',sans-serif", fontSize:20, fontWeight:900,
                color:award.unlocked ? C.white : C.mutedLight, lineHeight:1,
              }}>{award.value}</span>
              <span style={{
                fontFamily:"'League Spartan',sans-serif", fontSize:9,
                color:C.mutedLight, letterSpacing:"0.08em", textTransform:"uppercase", fontWeight:700,
              }}>{award.suffix}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── INSIGHTS ── */}
      {(() => {
        const insightItems = [
          mostPicked && { key:"picked", icon:"🏅", label:"Most Picked Team", value:mostPicked[0], sub:`Picked ${mostPicked[1]}x across bracket` },
          stats.longestStreak > 0 && { key:"streak", icon:"🔥", label:"Hottest Streak", value:stats.longestStreak, sub:"Correct picks in a row", gold:true },
          stats.boldCalls > 0 && { key:"bold", icon:"⚡", label:"Boldest Calls Nailed", value:stats.boldCalls, sub:"Exact picks · 3+ goal margin", gold:true },
          stats.specialistGroup && { key:"specialist", icon:"🧠", label:"Your Best Group", value:`Group ${stats.specialistGroup}`, sub:`${stats.specialistRate}% hit rate` },
        ].filter(Boolean);
        if (insightItems.length === 0) return null;
        const cols = balancedColumns(insightItems.length, 4);
        return (
          <>
            <SectionHeader title="Insights" />
            <div className="balanced-grid" style={{ gap:10, marginBottom:12, maxWidth:760, marginLeft:"auto", marginRight:"auto", "--cols": cols }}>
              {insightItems.map(item => (
                <InsightCard key={item.key} icon={item.icon} label={item.label} value={item.value} sub={item.sub} gold={item.gold} />
              ))}
            </div>
          </>
        );
      })()}

      <div style={{
        textAlign:"center", marginTop:16,
        fontFamily:"'Quicksand',sans-serif", fontSize:11, color:C.mutedLight, lineHeight:1.6,
      }}>
        See who's leading the competition overall on the Leaderboard tab.
      </div>
    </div>
  );
}

// Thin wrapper — "Your Tournament Stats" is just the shared stats view rendered
// for the signed-in user, in editable (non-read-only) mode.
function ChampionTab({ champion, scores, liveScores, knockoutPicks, userName, setTab, koApiMatches }) {
  return (
    <TournamentStatsContent
      champion={champion} scores={scores} liveScores={liveScores}
      knockoutPicks={knockoutPicks} koApiMatches={koApiMatches}
      displayName={userName} readOnly={false} setTab={setTab}
    />
  );
}

// Small reusable section header used throughout Your Tournament Stats
function SectionHeader({ title }) {
  return (
    <div style={{ marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ width:20, height:1, background:C.green }} />
      <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:11, fontWeight:900, color:C.gold, textTransform:"uppercase", letterSpacing:"0.14em" }}>{title}</div>
      <div style={{ flex:1, height:1, background:C.border }} />
    </div>
  );
}

// Compute a column count that distributes `count` items into visually balanced rows,
// given a max of `maxCols` columns. Examples: 8 items, max 4 -> 4 cols (4+4). 9 items,
// max 5 -> 5 cols (5+4). Strongly prefers exactly 2 rows when the count allows it, since
// that reads as more deliberate than fragmenting into many thin rows.
function balancedColumns(count, maxCols) {
  if (count <= maxCols) return count; // fits in one row, no balancing needed

  if (count <= 2 * maxCols) {
    let best = null;
    for (let cols = maxCols; cols >= 2; cols--) {
      if (cols < count - cols) continue; // cols must be >= half of count to stay at 2 rows
      const lastRow = count - cols;
      if (lastRow < 0) continue;
      const gap = Math.abs(cols - lastRow);
      if (best === null || gap < best.gap) best = { gap, cols };
    }
    if (best) return best.cols;
  }

  // Larger lists (more than 2 rows worth): minimize wasted cells in the last row as a
  // fraction of the whole grid, staying close to maxCols rather than collapsing narrow.
  let best = null;
  const minCols = Math.max(2, maxCols - 1);
  for (let cols = maxCols; cols >= minCols; cols--) {
    const rows = Math.ceil(count / cols);
    const lastRow = count - (rows - 1) * cols;
    const wasted = cols - lastRow;
    const wastedRatio = wasted / (rows * cols);
    if (best === null || wastedRatio < best.ratio - 0.001) best = { ratio: wastedRatio, cols };
  }
  return best.cols;
}

// Small reusable insight card
function InsightCard({ icon, label, value, sub, gold }) {
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"14px 16px", textAlign:"center" }}>
      <div style={{ fontSize:18, marginBottom:6 }}>{icon}</div>
      <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:10, color:C.mutedLight, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>{label}</div>
      <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:gold ? 22 : 15, color:gold ? C.gold : C.white, fontWeight:900, textTransform:gold ? "none" : "uppercase" }}>{value}</div>
      <div style={{ fontFamily:"'Quicksand',sans-serif", fontSize:11, color:C.green, marginTop:2 }}>{sub}</div>
    </div>
  );
}

// ── Stats Engine for Awards Section ───────────────────────────────────────────
function calcUserStats(userScores, liveScores, champion, knockoutPicks, koApiMatches) {
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
  let goalsConcededOnCorrect = 0; // for Iron Wall — goals conceded by predicted team on correct picks
  let correctDraws = 0; // Chaos Theory
  let totalGoalsPredicted = 0; // Total Goals Predicted
  let last5Results = []; // Comeback Trail — chronological list of recent scored results

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

      // Total Goals Predicted — counts every prediction made, scored or not
      if (user && user.home !== "" && user.away !== "") {
        const ph = parseInt(user.home), pa = parseInt(user.away);
        if (!isNaN(ph) && !isNaN(pa)) totalGoalsPredicted += ph + pa;
      }

      const r = scoreResult(user, live, key);
      if (!r) return;

      totalPts += SCORE_PTS[r];
      perGroupTracker[gKey].total++;
      last5Results.push({ key, r, pts: SCORE_PTS[r] });

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
        // Chaos Theory — correctly called an exact draw (any scoreline, e.g. 2-2)
        if (live.home === live.away) correctDraws++;
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else if (r === "correct") {
        correct++;
        if ((live.home + live.away) >= 3) goalfests++;
        // Chaos Theory also counts correctly calling a draw as the result (not exact score)
        const ph = parseInt(user.home), pa = parseInt(user.away);
        if (ph === pa && live.home === live.away) correctDraws++;
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

      // Iron Wall — on correct/exact picks, track goals conceded by the team you backed to win
      if (r === "exact" || r === "correct") {
        const ph = parseInt(user.home), pa = parseInt(user.away);
        if (ph > pa) goalsConcededOnCorrect += live.away; // backed home, they conceded `away` goals
        else if (pa > ph) goalsConcededOnCorrect += live.home; // backed away
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
    const actualStandings = calcStandings(gKey, {}, liveScores);
    const allDone = actualStandings.every(team => team.played === 3);
    if (allDone) {
      const userStandings = calcStandings(gKey, userScores, {});
      if (actualStandings[0]?.team === userStandings[0]?.team) groupWinnersHit++;
    }
  });

  // Group Stage Sweeper — got every match in a single group correct (6 of 6)
  let perfectGroups = 0;
  Object.keys(perGroupTracker).forEach(gKey => {
    if (perGroupTracker[gKey].total === 6 && perGroupTracker[gKey].correct === 6) perfectGroups++;
  });

  // Group Architect — perfect GROUP ORDER predictions (all 4 slots), from the order-scoring engine
  const groupOrderResult = calcTotalGroupOrderPoints(userScores, liveScores);

  // The Specialist — group with the highest per-group hit rate (min 1 match scored)
  let specialistGroup = null, specialistRate = 0;
  Object.keys(perGroupTracker).forEach(gKey => {
    const t = perGroupTracker[gKey];
    if (t.total > 0) {
      const rate = t.correct / t.total;
      if (rate > specialistRate || (rate === specialistRate && specialistGroup === null)) {
        specialistRate = rate;
        specialistGroup = gKey;
      }
    }
  });

  // Comeback Trail — points earned across the last 5 scored matches (momentum)
  const recentFive = last5Results.slice(-5);
  const comebackPts = recentFive.reduce((sum, m) => sum + m.pts, 0);

  // Iron Wall — average goals conceded by the team you backed, on picks you got right (lower = better defense reading)
  const correctPicks = exact + correct;
  const ironWallAvg = correctPicks > 0 ? (goalsConcededOnCorrect / correctPicks).toFixed(2) : null;

  // Knockout points — always computed and reported SEPARATELY from group points,
  // never blended, so the breakdown between the two stages stays clear.
  const koResult = calcTotalKnockoutPoints(knockoutPicks, koApiMatches);

  return {
    exact, correct, wrong,
    avgDiff, totalPredictions, accuracy,
    heartbreakers, boldCalls, goalfests, realist,
    longestStreak, totalPts,
    defensiveCalls, firstMatchExact, groupWinnersHit, perfectGroups,
    // New stats
    groupOrderPoints: groupOrderResult.total,
    perfectGroupOrders: groupOrderResult.perfectCount,
    groupsOrderScored: groupOrderResult.groupsScored,
    correctDraws, totalGoalsPredicted,
    comebackPts, comebackMatches: recentFive.length,
    ironWallAvg, correctPicks,
    specialistGroup, specialistRate: specialistGroup ? Math.round(specialistRate * 100) : 0,
    // Group-stage points only (match points + group order points)
    groupStagePts: totalPts + groupOrderResult.total,
    // Knockout points only
    knockoutPts: koResult.total,
    knockoutExact: koResult.exact,
    knockoutCorrect: koResult.correct,
    knockoutWrong: koResult.wrong,
    knockoutScored: koResult.scored,
    // Grand total — group stage + knockout combined
    combinedTotalPts: totalPts + groupOrderResult.total + koResult.total,
  };
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
function LeaderboardTab({ userName, scores, liveScores, champion, knockoutPicks, onViewProfile, koApiMatches }) {
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
        knockoutPicks: migrateKnockoutPicks(r.knockout_picks),
      }));
      setEntries(mapped);
      setAllPredictions(rows);
      setLoading(false);
    };
    fetchEntries();
    const interval = setInterval(fetchEntries, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculate real points from live scores (group match points + group order points + knockout points, combined)
  const calcPoints = (userScores, userKnockoutPicks) => {
    let pts = 0;
    Object.keys(GROUPS).forEach(gKey => {
      GROUPS[gKey].matches.forEach(([,],idx) => {
        const key = `${gKey}-${idx}`;
        const r = scoreResult(userScores?.[key], liveScores?.[key], key);
        if(r) pts += SCORE_PTS[r];
      });
    });
    const orderResult = calcTotalGroupOrderPoints(userScores, liveScores);
    const koResult = calcTotalKnockoutPoints(userKnockoutPicks, koApiMatches);
    return pts + orderResult.total + koResult.total;
  };

  if(loading) return <div style={{ color:C.mutedLight,fontFamily:"'Quicksand',sans-serif",fontSize:13,padding:20 }}>Loading...</div>;
  const myPts = calcPoints(scores, knockoutPicks);

  // Always include current user if they have a name set, even if shared storage hasn't synced yet
  let workingEntries = [...entries];
  if (userName && !workingEntries.find(e => e.name === userName)) {
    workingEntries.push({ name: userName, pts: 0, champion, scores: scores, knockoutPicks });
  }
  // Calculate points dynamically for every entry using their stored scores vs live results
  const enriched = workingEntries.map(e => {
    const userScores = e.name === userName ? scores : (e.scores || {});
    const userKnockout = e.name === userName ? knockoutPicks : (e.knockoutPicks || {});
    const pts = calcPoints(userScores, userKnockout);
    return { ...e, pts, _scores: userScores, _knockout: userKnockout };
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

  // ── Competitive award holders — compute every user's stats, find who's leading each category ──
  const allUserStats = sorted.map(e => ({
    name: e.name,
    stats: calcUserStats(e._scores || {}, liveScores || {}, e.champion, e._knockout || {}, koApiMatches || []),
  }));

  // For each award category, find the entry with the highest qualifying value (and confirm they actually hold it, i.e. value > 0)
  function findLeader(getValue, higherIsBetter = true) {
    let best = null;
    allUserStats.forEach(u => {
      const v = getValue(u.stats);
      if (v === null || v === undefined || isNaN(v)) return;
      if (best === null) { best = { name: u.name, value: v }; return; }
      if (higherIsBetter ? v > best.value : v < best.value) best = { name: u.name, value: v };
    });
    return best;
  }

  const competitiveAwards = [
    { id:"sharpshooter", title:"Sharpshooter", subtitle:"Most exact scorelines", icon:"🎯", suffix:"exact",
      leader: findLeader(s => s.exact > 0 ? s.exact : null) },
    { id:"pundit", title:"The Pundit", subtitle:"Most correct results overall", icon:"📊", suffix:"correct",
      leader: findLeader(s => (s.exact + s.correct) > 0 ? s.exact + s.correct : null) },
    { id:"mathematician", title:"Goal Mathematician", subtitle:"Smallest avg scoreline error", icon:"📐", suffix:"avg off",
      leader: findLeader(s => s.avgDiff !== null ? parseFloat(s.avgDiff) : null, false) },
    { id:"streak", title:"Streak Master", subtitle:"Longest correct streak", icon:"🔥", suffix:"streak",
      leader: findLeader(s => s.longestStreak > 0 ? s.longestStreak : null) },
    { id:"heartbreak", title:"Heartbreak Kid", subtitle:"Most near-misses (off by 1)", icon:"💔", suffix:"close calls",
      leader: findLeader(s => s.heartbreakers > 0 ? s.heartbreakers : null) },
    { id:"bold", title:"Bold Caller", subtitle:"Most exact 3+ goal blowouts called", icon:"⚡", suffix:"bold",
      leader: findLeader(s => s.boldCalls > 0 ? s.boldCalls : null) },
    { id:"whisperer", title:"Group Whisperer", subtitle:"Most group winners called correctly", icon:"🔮", suffix:"groups",
      leader: findLeader(s => s.groupWinnersHit > 0 ? s.groupWinnersHit : null) },
    { id:"sweeper", title:"Group Sweeper", subtitle:"Most perfect groups (all 6 matches)", icon:"🧹", suffix:"perfect",
      leader: findLeader(s => s.perfectGroups > 0 ? s.perfectGroups : null) },
    { id:"architect", title:"Group Architect", subtitle:"Most perfect group order calls", icon:"🏗️", suffix:"perfect orders",
      leader: findLeader(s => s.perfectGroupOrders > 0 ? s.perfectGroupOrders : null) },
    { id:"ironwall", title:"Iron Wall", subtitle:"Fewest goals conceded on correct picks", icon:"🧊", suffix:"avg conceded",
      leader: findLeader(s => s.ironWallAvg !== null ? parseFloat(s.ironWallAvg) : null, false) },
    { id:"chaos", title:"Chaos Theory", subtitle:"Most correctly called draws", icon:"🌀", suffix:"draws",
      leader: findLeader(s => s.correctDraws > 0 ? s.correctDraws : null) },
    { id:"comeback", title:"Comeback Trail", subtitle:"Best run over their last 5 results", icon:"📈", suffix:"pts",
      leader: findLeader(s => s.comebackPts > 0 ? s.comebackPts : null) },
    { id:"goals", title:"Total Goals Predicted", subtitle:"Most total goals called across all picks", icon:"🥅", suffix:"goals",
      leader: findLeader(s => s.totalGoalsPredicted > 0 ? s.totalGoalsPredicted : null) },
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
          <p style={{ color:C.mutedLight, fontFamily:"'Quicksand',sans-serif", fontSize:13, lineHeight:1.7 }}>
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
            <div style={{ fontFamily:"'Quicksand',sans-serif", fontSize:11, color:C.mutedLight, marginTop:4, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
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
            <div key={entry.name} onClick={()=>onViewProfile && onViewProfile(entry)} style={{
              display:"flex", alignItems:"center",
              padding:size.padding,
              borderTop:i>0?`1px solid ${C.border}`:"none",
              background:isLeader
                ? `linear-gradient(90deg, rgba(196,159,75,0.08) 0%, rgba(196,159,75,0.02) 100%)`
                : isMe ? "rgba(90,148,123,0.06)" : "transparent",
              position:"relative",
              cursor:"pointer",
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

              <div style={{ flex:1, marginLeft:10, minWidth:0 }}>
                <div style={{
                  fontSize:size.name, fontWeight:isLeader?900:700,
                  fontFamily:"'League Spartan',sans-serif",
                  textTransform:"uppercase", letterSpacing:"0.03em",
                  color:isLeader ? C.gold : isMe ? C.green : C.white,
                  display:"flex", alignItems:"center", gap:8,
                  overflow:"hidden",
                }}>
                  <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", minWidth:0 }}>{entry.name}</span>
                  {isLeader && <span style={{ fontSize:14, color:C.gold, flexShrink:0 }}>♛</span>}
                  {isMe && <span style={{ fontSize:9, color:C.green, letterSpacing:"0.1em", flexShrink:0 }}>YOU</span>}
                </div>
                {entry.champion && code && (
                  <div style={{ fontSize:11, color:C.mutedLight, marginTop:3, fontFamily:"'Quicksand',sans-serif", display:"flex", alignItems:"center", gap:5, overflow:"hidden" }}>
                    <img src={FLAG_URL(code)} alt={entry.champion} style={{ width:14, height:10, objectFit:"cover", borderRadius:2, flexShrink:0 }} />
                    <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{entry.champion}</span>
                  </div>
                )}
              </div>

              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{
                  fontSize:size.pts, fontWeight:900,
                  fontFamily:"'League Spartan',sans-serif",
                  color:isLeader ? C.gold : C.white,
                  lineHeight:1,
                }}>{entry.pts}</div>
                <div style={{ fontSize:9, color:C.muted, letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:"'League Spartan',sans-serif", marginTop:2 }}>pts</div>
              </div>
              <div style={{ marginLeft:10, color:C.dim, fontSize:14, flexShrink:0 }}>›</div>
            </div>
          );
        })}
      </div>

      {/* ── AWARD HOLDERS — who's leading each category across the whole group ── */}
      <div style={{ marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:20, height:1, background:C.green }} />
        <div style={{ fontFamily:"'League Spartan',sans-serif", fontSize:11, fontWeight:900, color:C.gold, textTransform:"uppercase", letterSpacing:"0.14em" }}>
          Award Leaders
        </div>
        <div style={{ flex:1, height:1, background:C.border }} />
      </div>
      <p style={{ fontFamily:"'Quicksand',sans-serif", fontSize:11, color:C.mutedLight, marginBottom:16, lineHeight:1.6 }}>
        Who's currently holding each title across the whole group. Check your own breakdown on the Your Tournament Stats tab.
      </p>

      <div className="balanced-grid" style={{ gap:10, marginBottom:24, maxWidth:920, marginLeft:"auto", marginRight:"auto", "--cols": balancedColumns(competitiveAwards.length, 4) }}>
        {competitiveAwards.map(award => {
          const hasLeader = !!award.leader;
          const isMe = hasLeader && award.leader.name === userName;
          return (
            <div key={award.id} style={{
              background: hasLeader ? `linear-gradient(135deg, rgba(196,159,75,0.08), ${C.surface})` : C.surface,
              border:`1px solid ${isMe ? C.green : hasLeader ? "rgba(196,159,75,0.3)" : C.border}`,
              borderRadius:6, padding:"14px 16px",
              opacity: hasLeader ? 1 : 0.6,
              position:"relative", overflow:"hidden",
              minWidth:0, display:"flex", flexDirection:"column",
            }}>
              {isMe && (
                <div style={{
                  position:"absolute", top:8, right:8,
                  fontSize:8, color:C.green, fontFamily:"'League Spartan',sans-serif",
                  fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase",
                  background:C.tealDim, border:`1px solid ${C.tealBorder}`,
                  borderRadius:3, padding:"2px 6px",
                }}>You!</div>
              )}
              <div style={{ fontSize:24, marginBottom:6 }}>{award.icon}</div>
              <div style={{
                fontFamily:"'League Spartan',sans-serif", fontSize:12, fontWeight:900,
                color:hasLeader ? C.gold : C.mutedLight, textTransform:"uppercase",
                letterSpacing:"0.04em", marginBottom:3,
              }}>{award.title}</div>
              <div style={{
                fontFamily:"'Quicksand',sans-serif", fontSize:10, color:C.mutedLight,
                marginBottom:10, lineHeight:1.5, flex:1,
              }}>{award.subtitle}</div>
              {hasLeader ? (
                <div style={{ minWidth:0 }}>
                  <div style={{
                    fontFamily:"'League Spartan',sans-serif", fontSize:14, fontWeight:900,
                    color:isMe ? C.green : C.white, textTransform:"uppercase",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                    marginBottom:4, minWidth:0,
                  }}>{award.leader.name}</div>
                  <div style={{
                    fontFamily:"'League Spartan',sans-serif", fontSize:15, fontWeight:900,
                    color:C.gold, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                  }}>
                    {award.leader.value}
                    <span style={{ fontSize:9, color:C.mutedLight, fontWeight:700, marginLeft:4, textTransform:"uppercase" }}>{award.suffix}</span>
                  </div>
                </div>
              ) : (
                <div style={{ fontFamily:"'Quicksand',sans-serif", fontSize:11, color:C.mutedLight, fontStyle:"italic" }}>Not yet claimed</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ fontSize:11, color:C.mutedLight, lineHeight:1.6, fontFamily:"'Quicksand',sans-serif", textAlign:"center" }}>
        Scoring: 3 pts correct result · 5 pts exact scoreline · +2 pts per correct group slot · +10 bonus for a perfect group order · Updates automatically as real results come in
      </div>
    </div>
  );
}

// ── Player Profile — View Another User's Picks & Stats ───────────────────────
function PlayerProfileTab({ entry, liveScores, onBack, koApiMatches }) {
  const theirScores = entry.scores || {};
  const theirChampion = entry.champion || "";
  const theirKnockout = entry.knockoutPicks || {};
  const qualifyingThirds = getThirdPlaceQualifiers(theirScores, liveScores || {});

  return (
    <div className="fade-in">
      <button onClick={onBack} style={{
        background:"none", border:`1px solid ${C.border}`, borderRadius:6,
        color:C.mutedLight, fontFamily:"'League Spartan',sans-serif", fontSize:11,
        fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase",
        padding:"7px 14px", cursor:"pointer", marginBottom:18,
      }}>
        ‹ Back to Leaderboard
      </button>

      {/* Full "Your Tournament Stats" breakdown, rendered read-only for this player */}
      <TournamentStatsContent
        champion={theirChampion} scores={theirScores} liveScores={liveScores || {}}
        knockoutPicks={theirKnockout} koApiMatches={koApiMatches || []}
        displayName={entry.name} readOnly={true}
      />

      {/* Their group predictions — full standings tables, kept as its own section */}
      <div style={{ fontFamily:"'League Spartan',sans-serif",fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:C.gold,fontWeight:700,margin:"28px 0 12px" }}>
        {entry.name}'s Group Predictions
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(330px,1fr))",gap:12 }}>
        {Object.keys(GROUPS).map(g => {
          const safeLive = liveScores || {};
          const standings = calcStandings(g, theirScores, safeLive);
          let orderResult = null;
          try { orderResult = calcGroupOrderScore(g, theirScores, safeLive); } catch(e) {}
          const isPerfectOrder = orderResult?.isPerfect ?? false;
          return (
            <div key={g} className="group-card fade-in" style={{ background:C.surface, border:`2px solid ${isPerfectOrder ? C.gold : C.border}`, borderRadius:8, overflow:"hidden", boxShadow:isPerfectOrder ? "0 0 16px rgba(196,159,75,0.2)" : "none" }}>
              <div style={{ padding:"11px 14px",borderBottom:`1px solid ${C.border}`,background:`linear-gradient(135deg,${C.greenDark} 0%,#031A0E 100%)`,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <div style={{ width:4,height:22,background:isPerfectOrder ? C.gold : C.green,borderRadius:2,flexShrink:0 }} />
                  <span style={{ fontFamily:"'League Spartan',sans-serif",fontSize:16,fontWeight:900,color:isPerfectOrder ? C.gold : C.white,letterSpacing:"0.05em",textTransform:"uppercase" }}>Group {g}</span>
                  {isPerfectOrder && <span style={{ fontSize:9, background:"rgba(196,159,75,0.2)", border:`1px solid ${C.gold}`, borderRadius:4, padding:"2px 6px", fontFamily:"'League Spartan',sans-serif", fontWeight:900, color:C.gold, textTransform:"uppercase" }}>★ Perfect Order</span>}
                </div>
                <div style={{ display:"flex",gap:4 }}>
                  {standings.slice(0,2).map(row=><Flag key={row.team} team={row.team} size={14} />)}
                </div>
              </div>
              <table style={{ width:"100%",borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ fontSize:9,color:C.muted,fontFamily:"'League Spartan',sans-serif",textTransform:"uppercase",letterSpacing:"0.08em" }}>
                    <th style={{ textAlign:"left",padding:"6px 8px" }}>#</th>
                    <th style={{ textAlign:"left",padding:"6px 8px" }}>Team</th>
                    <th style={{ padding:"6px 4px" }}>P</th>
                    <th style={{ padding:"6px 4px" }}>GD</th>
                    <th style={{ padding:"6px 8px" }}>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row,i)=>{
                    const isThird = i===2;
                    const inThirdRace = isThird && qualifyingThirds.has(row.team);
                    return (
                      <tr key={row.team} style={{
                        fontSize:12, fontFamily:"'Quicksand',sans-serif",
                        color: i<2 ? C.white : (inThirdRace ? C.green : C.muted),
                        background: i<2 ? "rgba(90,148,123,0.08)" : inThirdRace ? "rgba(90,148,123,0.04)" : "transparent",
                        borderTop:`1px solid ${C.border}`,
                      }}>
                        <td style={{ padding:"7px 8px",fontWeight:700 }}>{i+1}</td>
                        <td style={{ padding:"7px 8px",display:"flex",alignItems:"center",gap:6,fontWeight:i<2?700:500 }}>
                          <Flag team={row.team} size={13} />{row.team}
                          {isThird && inThirdRace && <span style={{ fontSize:8,color:C.green,border:`1px solid ${C.green}`,borderRadius:4,padding:"1px 4px",fontFamily:"'League Spartan',sans-serif" }}>IN</span>}
                        </td>
                        <td style={{ textAlign:"center",padding:"7px 4px" }}>{row.played}</td>
                        <td style={{ textAlign:"center",padding:"7px 4px",color: row.gd>0?C.green:row.gd<0?C.wrong:C.muted }}>{row.gd>0?`+${row.gd}`:row.gd}</td>
                        <td style={{ textAlign:"center",padding:"7px 8px",fontWeight:900,color:C.gold }}>{row.pts}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}


export default function App() {
  const [tab, setTab] = useState("groups");
  const [scores, setScores] = useState({});
  const [champion, setChampion] = useState("");
  const [userName, setUserName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liveScores, setLiveScores] = useState({});
  const [liveKnockoutMatches, setLiveKnockoutMatches] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [liveStatus, setLiveStatus] = useState(null);
  const [koLiveStatus, setKoLiveStatus] = useState(null);
  const [knockoutPicks, setKnockoutPicks] = useState({});
  const [viewProfile, setViewProfile] = useState(null);
  // Tracks whether the initial load-from-Supabase has finished. Auto-save must never fire
  // before this is true, or it can overwrite real saved data with blank initial state
  // (this caused a real data-loss bug — see the load effect below).
  const [loaded, setLoaded] = useState(false);

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
          setKnockoutPicks(migrateKnockoutPicks(d.knockout_picks));
        }
      }
      setLoading(false);
      setLoaded(true);
    })();
  },[]);

  // Fetch live scores (group + knockout) on mount and every 90 seconds
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

        const koParsed = parseApiKnockoutMatches(raw);
        setLiveKnockoutMatches(koParsed);
        const koHasLive = koParsed.some(s=>s.status==="IN_PLAY"||s.status==="PAUSED");
        setKoLiveStatus(koHasLive ? "Live now" : null);
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

  // Auto-save: debounced save to Supabase whenever data changes.
  // Guarded on `loaded` — never fires until the initial fetch from Supabase has resolved,
  // so it can never save blank/initial state over top of real saved predictions.
  useEffect(() => {
    if (!userName || !loaded) return;
    const timer = setTimeout(async () => {
      const ok = await saveUserPredictions(userName, scores, champion, knockoutPicks);
      if (ok) setSaved(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, [scores, champion, knockoutPicks, userName, loaded]);

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
        setKnockoutPicks(migrateKnockoutPicks(existing.knockout_picks));
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

  // qualifyingThirds for Group Stage Picks uses user scores only — no live data bleed
  const qualifyingThirds = getThirdPlaceQualifiers(scores, {});

  return (
    <>
      <style>{css}</style>
      <div style={{ background:C.bg,minHeight:"100vh",color:C.white,fontFamily:"'Quicksand',sans-serif" }}>
        <Hero liveStatus={liveStatus} />
        <Nav tab={tab} setTab={(t)=>{ setViewProfile(null); setTab(t); }} />
        <PageHeader tab={tab} />
        <div style={{ maxWidth:1100,margin:"0 auto",padding:"28px 16px 60px" }}>

          {!userName&&(
            <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"16px 20px",marginBottom:24,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap" }}>
              <div style={{ flex:1,minWidth:200 }}>
                <div style={{ fontFamily:"'League Spartan',sans-serif",fontSize:12,fontWeight:700,color:C.white,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2 }}>Enter your name</div>
                <div style={{ fontFamily:"'Quicksand',sans-serif",fontSize:12,color:C.mutedLight }}>Save predictions and join the leaderboard</div>
              </div>
              <input placeholder="Your name" value={nameInput} onChange={e=>setNameInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSave()} style={{ background:"#050D08",border:`1px solid ${C.border}`,borderRadius:6,color:C.white,fontFamily:"'Quicksand',sans-serif",fontSize:14,fontWeight:500,padding:"9px 14px",flex:1,minWidth:160 }} />
              <button className="save-btn" onClick={handleSave} style={{ background:C.green,border:"none",borderRadius:6,color:"#fff",fontFamily:"'League Spartan',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",padding:"9px 22px",cursor:"pointer" }}>Enter</button>
            </div>
          )}

          {userName&&tab==="groups"&&(
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <div style={{ fontSize:11,color:C.mutedLight,fontFamily:"'Quicksand',sans-serif" }}>
                Signed in as <span style={{ color:C.green,fontWeight:700 }}>{userName}</span>
                {" · "}
                <span
                  onClick={()=>{
                    setStoredName("");
                    setUserName("");
                    setNameInput("");
                  }}
                  style={{ color:C.muted,textDecoration:"underline",cursor:"pointer" }}
                >
                  Change name
                </span>
              </div>
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
              <ThirdPlaceTracker scores={scores} liveScores={{}} />
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(330px,1fr))",gap:12 }}>
                {Object.keys(GROUPS).map(g=><GroupCard key={g} groupKey={g} scores={scores} onScore={handleScore} qualifyingThirds={qualifyingThirds} liveScores={liveScores} forceUnlock={userName === "Pete"} />)}
              </div>
            </div>
          )}

          {tab==="actual"&&<ActualTab liveScores={liveScores} scores={scores} lastUpdated={lastUpdated} />}

          {tab==="bracket"&&<BracketTab scores={scores} liveScores={liveScores} champion={champion} knockoutPicks={knockoutPicks} koApiMatches={liveKnockoutMatches} onKnockoutPick={(id, team, home, away)=>{
            const val = (home !== undefined && away !== undefined)
              ? { team, home, away }
              : { team, home: "", away: "" };
            setKnockoutPicks(p=>({...p,[id]:val}));
            // Two-way sync: final match pick = champion
            if (id === 104) setChampion(team);
          }} />}
          {tab==="koactual"&&<OfficialKnockoutTab koApiMatches={liveKnockoutMatches} knockoutPicks={knockoutPicks} />}
          {tab==="champion"&&<ChampionTab
            champion={champion}
            scores={scores}
            liveScores={liveScores}
            knockoutPicks={knockoutPicks}
            koApiMatches={liveKnockoutMatches}
            userName={userName}
            setTab={setTab}
          />}
          {tab==="leaderboard"&&!viewProfile&&<LeaderboardTab userName={userName} scores={scores} liveScores={liveScores} champion={champion} knockoutPicks={knockoutPicks} koApiMatches={liveKnockoutMatches} onViewProfile={setViewProfile} />}
          {tab==="leaderboard"&&viewProfile&&<PlayerProfileTab entry={viewProfile} liveScores={liveScores} koApiMatches={liveKnockoutMatches} onBack={()=>setViewProfile(null)} />}
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
            color:C.mutedLight, letterSpacing:"0.16em", textTransform:"uppercase",
            marginBottom:10,
          }}>
            Site Designed By
          </div>
          <img
            src={PETTY_LOGO_BASE64}
            alt="Petty Photography"
            style={{ height:32, width:"auto", display:"inline-block", opacity:0.95 }}
          />
          <div style={{
            marginTop:20, fontFamily:"'Quicksand',sans-serif",
            fontSize:10, color:C.mutedLight, letterSpacing:"0.1em",
          }}>
            © 2026 · Built for the love of the game
          </div>
        </footer>
      </div>
    </>
  );
}
