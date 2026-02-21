import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const APP_URL = Deno.env.get('APP_URL') ?? 'https://slojd-admin.vercel.app'
const FROM_EMAIL = 'Slöjd-Admin <onboarding@resend.dev>'

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify caller has a valid Supabase session
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Ingen Authorization-header' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return jsonResponse({ error: `Auth misslyckades: ${authError?.message || 'ingen användare'}` }, 401)
    }

    // Check admin role
    const serviceClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: roleData, error: roleError } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (roleError) {
      return jsonResponse({ error: `Rollkontroll misslyckades: ${roleError.message}` }, 500)
    }

    if (!roleData) {
      return jsonResponse({ error: 'Bara admins kan skicka välkomstmejl' }, 403)
    }

    const { email } = await req.json()
    if (!email) {
      return jsonResponse({ error: 'E-postadress saknas' }, 400)
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      return jsonResponse({ error: 'RESEND_API_KEY är inte konfigurerad' }, 500)
    }

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; }
    .wrapper { max-width: 520px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .brand { background: #18181b; padding: 28px 32px; text-align: center; }
    .brand h1 { color: #ffffff; font-size: 20px; font-weight: 600; margin: 0; letter-spacing: -0.3px; }
    .body { padding: 32px; }
    .body p { color: #3f3f46; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .body p:last-child { margin-bottom: 0; }
    .highlight { background: #fafafa; border-left: 3px solid #18181b; padding: 14px 18px; border-radius: 0 6px 6px 0; margin: 20px 0; }
    .highlight p { color: #52525b; font-size: 14px; margin: 0; }
    .cta-wrap { text-align: center; padding: 8px 0 24px; }
    .cta { display: inline-block; background: #18181b; color: #ffffff !important; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 15px; }
    .divider { border: none; border-top: 1px solid #e4e4e7; margin: 24px 0; }
    .steps { color: #71717a; font-size: 13px; line-height: 1.7; }
    .steps strong { color: #3f3f46; }
    .footer { text-align: center; padding: 24px 20px; color: #a1a1aa; font-size: 12px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="brand">
        <h1>Slöjd-Detaljer Admin</h1>
      </div>
      <div class="body">
        <p>Hej!</p>
        <p>Du har bjudits in till <strong>Slöjd-Admin</strong> — systemet för att hantera produkter, kunder och ordrar.</p>

        <div class="highlight">
          <p>Ditt konto är kopplat till <strong>${email}</strong></p>
        </div>

        <div class="cta-wrap">
          <a href="${APP_URL}" class="cta">Logga in</a>
        </div>

        <hr class="divider">

        <div class="steps">
          <p><strong>Så här kommer du igång:</strong></p>
          <p>1. Klicka på knappen ovan<br>
             2. Välj "Logga in med Google" eller skapa ett lösenord<br>
             3. Använd e-postadressen ${email}</p>
        </div>
      </div>
    </div>
    <div class="footer">
      Slöjd-Detaljer &middot; ${APP_URL}
    </div>
  </div>
</body>
</html>`

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: 'Välkommen till Slöjd-Admin',
        html: htmlBody,
      }),
    })

    if (!resendRes.ok) {
      const errText = await resendRes.text()
      console.error('Resend error:', resendRes.status, errText)
      if (resendRes.status === 403 && errText.includes('verify a domain')) {
        return jsonResponse({ error: 'Du behöver verifiera en domän i Resend innan du kan skicka till andra. Gå till resend.com/domains.' }, 502)
      }
      return jsonResponse({ error: `Kunde inte skicka mejl (${resendRes.status})` }, 502)
    }

    const result = await resendRes.json()
    return jsonResponse({ success: true, id: result.id })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Okänt fel'
    console.error('Unexpected error:', errorMessage)
    return jsonResponse({ error: errorMessage }, 500)
  }
})
