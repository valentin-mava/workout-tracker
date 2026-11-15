// Kleiner Server zwischen App und Strava:
// - hält das Strava-App-Geheimnis (darf nicht in die Web-App)
// - speichert die Strava-Tokens pro Gerät unter einem zufälligen Schlüssel aus der App
// - liefert der App eine schlanke Aktivitätenliste
//
// Der Schlüssel kommt beim Verbinden als OAuth-"state" mit und danach als Bearer-Token.
// So klappt das Verbinden auch, wenn der Strava-Login auf dem iPhone in einem
// anderen Browserfenster als die installierte App endet.

const STRAVA = 'https://www.strava.com'
const KEY_RE = /^[A-Za-z0-9_-]{32,128}$/

export default {
  async fetch(req, env) {
    const url = new URL(req.url)
    // APP_ORIGIN darf mehrere Origins enthalten (z. B. zusätzlich localhost zum Entwickeln)
    const origin = req.headers.get('Origin') ?? ''
    const allowed = env.APP_ORIGIN.split(',').map((s) => s.trim())
    const cors = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
      Vary: 'Origin',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization',
      'Access-Control-Max-Age': '86400',
    }
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

    try {
      switch (url.pathname) {
        case '/connect':
          return connect(url, env)
        case '/callback':
          return await callback(url, env)
        case '/activities':
          return withCors(await activities(req, url, env), cors)
        case '/disconnect':
          return withCors(await disconnect(req, env), cors)
        default:
          return new Response('Not found', { status: 404 })
      }
    } catch (e) {
      console.error(e)
      return withCors(json({ error: 'server' }, 502), cors)
    }
  },
}

function connect(url, env) {
  const key = url.searchParams.get('key') ?? ''
  if (!KEY_RE.test(key)) return new Response('Ungültiger Schlüssel', { status: 400 })
  const auth = new URL(`${STRAVA}/oauth/authorize`)
  auth.search = new URLSearchParams({
    client_id: env.STRAVA_CLIENT_ID,
    redirect_uri: `${url.origin}/callback`,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'activity:read_all',
    state: key,
  })
  return Response.redirect(auth.toString(), 302)
}

async function callback(url, env) {
  const key = url.searchParams.get('state') ?? ''
  const code = url.searchParams.get('code')
  const scope = url.searchParams.get('scope') ?? ''
  if (url.searchParams.get('error') || !code || !KEY_RE.test(key)) {
    return page(env, 'Nicht verbunden', 'Die Verbindung mit Strava wurde abgebrochen.')
  }
  if (!scope.includes('activity:read')) {
    return page(env, 'Nicht verbunden', 'Bitte erlaube beim Verbinden den Zugriff auf deine Aktivitäten.')
  }
  const res = await fetch(`${STRAVA}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) return page(env, 'Nicht verbunden', 'Strava hat die Anmeldung abgelehnt. Versuch es bitte noch einmal.')
  const t = await res.json()
  await env.TOKENS.put(
    tokenKey(key),
    JSON.stringify({
      access_token: t.access_token,
      refresh_token: t.refresh_token,
      expires_at: t.expires_at,
      athlete: [t.athlete?.firstname, t.athlete?.lastname].filter(Boolean).join(' '),
    }),
  )
  return page(env, 'Verbunden', 'Strava ist jetzt mit deiner App verbunden. Du kannst dieses Fenster schließen.')
}

async function activities(req, url, env) {
  const key = bearer(req)
  const tok = key && (await env.TOKENS.get(tokenKey(key), 'json'))
  if (!tok) return json({ error: 'not_connected' }, 401)

  const access = await fresh(key, tok, env)
  if (!access) return json({ error: 'not_connected' }, 401)

  const q = new URLSearchParams({ per_page: '100', page: String(Math.max(1, Number(url.searchParams.get('page')) || 1)) })
  const after = Number(url.searchParams.get('after'))
  if (after > 0) q.set('after', String(Math.floor(after)))

  const res = await fetch(`${STRAVA}/api/v3/athlete/activities?${q}`, { headers: { Authorization: `Bearer ${access}` } })
  if (res.status === 401) return json({ error: 'not_connected' }, 401)
  if (res.status === 429) return json({ error: 'rate_limited' }, 429)
  if (!res.ok) return json({ error: 'strava' }, 502)

  const list = await res.json()
  return json({
    athlete: tok.athlete,
    activities: list.map((a) => ({
      id: String(a.id),
      sportType: a.sport_type ?? a.type,
      name: a.name,
      date: a.start_date,
      distanceM: a.distance ?? 0,
      movingSec: a.moving_time ?? 0,
      avgHr: a.average_heartrate ?? null,
      elevM: a.total_elevation_gain ?? null,
    })),
  })
}

async function disconnect(req, env) {
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  const key = bearer(req)
  const tok = key && (await env.TOKENS.get(tokenKey(key), 'json'))
  if (tok) {
    const access = await fresh(key, tok, env)
    if (access) await fetch(`${STRAVA}/oauth/deauthorize`, { method: 'POST', headers: { Authorization: `Bearer ${access}` } })
    await env.TOKENS.delete(tokenKey(key))
  }
  return json({ ok: true })
}

/** Gültiges Access-Token, bei Bedarf über das Refresh-Token erneuert */
async function fresh(key, tok, env) {
  if (tok.expires_at > Date.now() / 1000 + 120) return tok.access_token
  const res = await fetch(`${STRAVA}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: tok.refresh_token,
    }),
  })
  if (!res.ok) {
    // Zugriff in Strava widerrufen: Tokens verwerfen
    if (res.status === 400 || res.status === 401) await env.TOKENS.delete(tokenKey(key))
    return null
  }
  const t = await res.json()
  await env.TOKENS.put(tokenKey(key), JSON.stringify({ ...tok, access_token: t.access_token, refresh_token: t.refresh_token, expires_at: t.expires_at }))
  return t.access_token
}

const tokenKey = (key) => `tok:${key}`

function bearer(req) {
  const m = /^Bearer (.+)$/.exec(req.headers.get('Authorization') ?? '')
  return m && KEY_RE.test(m[1]) ? m[1] : null
}

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

function withCors(res, cors) {
  const r = new Response(res.body, res)
  for (const [k, v] of Object.entries(cors)) r.headers.set(k, v)
  return r
}

function page(env, title, text) {
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f2f1ec;color:#111;font-family:-apple-system,system-ui,sans-serif;padding:24px;box-sizing:border-box}
main{max-width:360px;display:flex;flex-direction:column;gap:14px}
h1{margin:0;font-size:40px;font-weight:800;text-transform:uppercase;line-height:1;font-family:'Arial Narrow',sans-serif}
p{margin:0;color:#5e5e58;line-height:1.45}
a{display:flex;align-items:center;justify-content:center;min-height:56px;border-radius:16px;background:#111;color:#d4f53c;font-weight:700;text-decoration:none}
</style></head><body><main><h1>${esc(title)}</h1><p>${esc(text)}</p><a href="${esc(env.APP_URL)}#/cardio">Zur App</a></main></body></html>`
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
