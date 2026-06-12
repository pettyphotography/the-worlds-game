// Vercel serverless function: proxies football-data.org API calls
// to bypass CORS and keep the API key server-side.
//
// Place this file at /api/matches.js in your project root.
// Frontend calls: fetch('/api/matches')

export default async function handler(req, res) {
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "FOOTBALL_API_KEY not configured" });
  }

  try {
    const response = await fetch(
      "https://api.football-data.org/v4/competitions/WC/matches",
      { headers: { "X-Auth-Token": apiKey } }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: `football-data API returned ${response.status}`,
      });
    }

    const data = await response.json();

    // Cache for 60s on Vercel's edge to reduce API calls
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
