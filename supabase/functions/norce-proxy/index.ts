import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NORCE_TOKEN_URL = 'https://norce-open-demo.api-se.playground.norce.tech/identity/1.0/connect/token'
const NORCE_QUERY_BASE = 'https://norce-open-demo.api-se.playground.norce.tech/commerce/query/2.0'

// Module-level token cache (persists within Deno worker lifetime)
let cachedToken: string | null = null
let tokenExpiresAt = 0

async function getNorceToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && tokenExpiresAt > now + 60_000) {
    return cachedToken
  }

  // Demo/playground credentials — hardcoded since Lovable Cloud
  // manages Supabase and we can't set secrets via CLI
  const clientId = 'bbd0c062-2bd8-46f2-9b9b-6d13c4caf14e'
  const clientSecret = 'e152968f-cde7-4f88-ab21-57293a2ccda2'

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'playground',
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
    // Verify caller has a valid Supabase session
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { endpoint, params, applicationId } = await req.json()

    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Missing endpoint parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
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
    const fullUrl = `${NORCE_QUERY_BASE}/${endpoint}${queryString}`

    const token = await getNorceToken()
    console.log('Calling Norce URL:', fullUrl)
    const norceHeaders: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    }
    if (applicationId) {
      norceHeaders['application-id'] = String(applicationId)
    }

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
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }

      return new Response(
        JSON.stringify({ error: `Norce API error: ${norceRes.status}`, details: errorText }),
        { status: norceRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const data = await norceRes.json()
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
