import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name, role, organizationName, inviterName, appUrl } = await req.json()

    if (!email || !organizationName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('RESEND_API_KEY')
    const from = Deno.env.get('RESEND_FROM') ?? 'Gradevinski Dnevnik <invites@elektro.gradevinskidnevnik.online>'

    if (!apiKey) {
      return new Response(
        JSON.stringify({ sent: false, reason: 'no_api_key' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const loginUrl = appUrl ?? 'http://localhost:3000'
    const roleLabel = role === 'admin' ? 'administrator' : 'radnik'

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: `Pozivnica za tim — ${organizationName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #18181b;">
            <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">Pozivnica za tim</h2>
            <p style="color: #71717a; margin-bottom: 24px; font-size: 15px;">
              ${inviterName ? `<strong>${inviterName}</strong> vas je pozvao/la` : 'Pozvani ste'} da se pridružite tvrtki
              <strong>${organizationName}</strong> u aplikaciji Gradevinski Dnevnik kao <strong>${roleLabel}</strong>.
            </p>
            ${name ? `<p style="margin-bottom: 24px; font-size: 15px;">Vaše ime: <strong>${name}</strong></p>` : ''}
            <a href="${loginUrl}" style="display: inline-block; background: #18181b; color: white; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
              Prihvati pozivnicu
            </a>
            <p style="margin-top: 24px; font-size: 13px; color: #a1a1aa;">
              Prijavite se Google računom na gornju adresu. Vaš pristup bit će automatski aktiviran.
            </p>
          </div>
        `
      })
    })

    if (!resendResponse.ok) {
      const errorBody = await resendResponse.text()
      console.error('Resend error:', errorBody)
      return new Response(
        JSON.stringify({ error: 'Failed to send invitation email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ sent: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
