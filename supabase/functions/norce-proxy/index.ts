import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const DEFAULT_NORCE_TOKEN_URL = 'https://norce-open-demo.api-se.playground.norce.tech/identity/1.0/connect/token'
const DEFAULT_NORCE_QUERY_BASE = 'https://norce-open-demo.api-se.playground.norce.tech/commerce/query/2.0'
const NORCE_ADMIN_URL = Deno.env.get('NORCE_ADMIN_URL')
const EXPLICIT_NORCE_TOKEN_URL = Deno.env.get('NORCE_TOKEN_URL')
const EXPLICIT_NORCE_QUERY_BASE = Deno.env.get('NORCE_QUERY_BASE')
const NORCE_DEFAULT_APP_ID = Number(Deno.env.get('NORCE_DEFAULT_APP_ID') ?? '1042')
const EXPLICIT_NORCE_SCOPE = Deno.env.get('NORCE_SCOPE')

function deriveApiBaseFromAdminUrl(adminUrl: string): string {
  const parsed = new URL(adminUrl)
  const apiHost = parsed.host.replace('.admin-', '.api-')
  if (apiHost === parsed.host) {
    throw new Error('NORCE_ADMIN_URL måste vara ett admin-hostname (innehålla ".admin-")')
  }
  return `${parsed.protocol}//${apiHost}`
}

const DERIVED_NORCE_API_BASE = NORCE_ADMIN_URL ? deriveApiBaseFromAdminUrl(NORCE_ADMIN_URL) : null
const NORCE_TOKEN_URL = EXPLICIT_NORCE_TOKEN_URL ?? (DERIVED_NORCE_API_BASE ? `${DERIVED_NORCE_API_BASE}/identity/1.0/connect/token` : DEFAULT_NORCE_TOKEN_URL)
const NORCE_QUERY_BASE = EXPLICIT_NORCE_QUERY_BASE ?? (DERIVED_NORCE_API_BASE ? `${DERIVED_NORCE_API_BASE}/commerce/query/2.0` : DEFAULT_NORCE_QUERY_BASE)

function inferNorceScope(tokenUrl: string): string {
  if (tokenUrl.includes('.playground.')) return 'playground'
  if (tokenUrl.includes('.stage.')) return 'stage'
  return 'prod'
}

const NORCE_SCOPE = EXPLICIT_NORCE_SCOPE ?? inferNorceScope(NORCE_TOKEN_URL)

// Module-level token cache (persists within Deno worker lifetime)
let cachedToken: string | null = null
let tokenExpiresAt = 0

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function getNorceToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && tokenExpiresAt > now + 60_000) {
    return cachedToken
  }

  const clientId = Deno.env.get('NORCE_CLIENT_ID')
  const clientSecret = Deno.env.get('NORCE_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    throw new Error('Norce credentials saknas (NORCE_CLIENT_ID/NORCE_CLIENT_SECRET)')
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: NORCE_SCOPE,
  })

  const res = await fetch(NORCE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('Token request failed:', res.status, errText)
    throw new Error(`Norce token request failed: ${res.status} - ${errText}`)
  }

  const data = await res.json()
  console.log('Token obtained, expires_in:', data.expires_in)
  cachedToken = data.access_token
  tokenExpiresAt = now + (data.expires_in * 1000)
  return cachedToken!
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!Number.isFinite(NORCE_DEFAULT_APP_ID)) {
      return jsonResponse({ error: 'Invalid NORCE_DEFAULT_APP_ID' }, 500)
    }

    // Verify caller has a valid Supabase session
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!serviceRoleKey) {
      return jsonResponse({ error: 'SUPABASE_SERVICE_ROLE_KEY saknas' }, 500)
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: roleData, error: roleError } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'moderator'])
      .limit(1)

    if (roleError) {
      return jsonResponse({ error: `Rollkontroll misslyckades: ${roleError.message}` }, 500)
    }
    if (!roleData?.length) {
      return jsonResponse({ error: 'Forbidden' }, 403)
    }

    const { endpoint, params, applicationId } = await req.json()

    if (typeof endpoint !== 'string' || !endpoint.trim()) {
      return jsonResponse({ error: 'Missing endpoint parameter' }, 400)
    }
    const normalizedEndpoint = endpoint.replace(/^\/+/, '')
    if (
      normalizedEndpoint.includes('..') ||
      normalizedEndpoint.startsWith('http://') ||
      normalizedEndpoint.startsWith('https://')
    ) {
      return jsonResponse({ error: 'Invalid endpoint' }, 400)
    }

    // Build OData URL with query parameters
    // OData requires literal $-prefixed params, so build query string manually
    let queryString = ''
    if (params) {
      const parts: string[] = []
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          parts.push(`${key}=${encodeURIComponent(String(value))}`)
        }
      }
      if (parts.length) queryString = '?' + parts.join('&')
    }
    const fullUrl = `${NORCE_QUERY_BASE}/${normalizedEndpoint}${queryString}`

    const token = await getNorceToken()
    console.log('Calling Norce URL:', fullUrl)
    const norceHeaders: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    }
    const appId = applicationId ?? NORCE_DEFAULT_APP_ID
    norceHeaders['application-id'] = String(appId)

    const norceRes = await fetch(fullUrl, { headers: norceHeaders })

    if (!norceRes.ok) {
      const errorText = await norceRes.text()

      // If 401 from Norce, invalidate cached token and retry once
      if (norceRes.status === 401 && cachedToken) {
        cachedToken = null
        tokenExpiresAt = 0
        const retryToken = await getNorceToken()
        norceHeaders['Authorization'] = `Bearer ${retryToken}`
        const retryRes = await fetch(fullUrl, { headers: norceHeaders })
        if (retryRes.ok) {
          const data = await retryRes.json()
          return jsonResponse(data)
        }
      }

      return jsonResponse({ error: `Norce API error: ${norceRes.status}`, details: errorText }, norceRes.status)
    }

    const data = await norceRes.json()
    return jsonResponse(data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return jsonResponse({ error: errorMessage }, 500)
  }
})
