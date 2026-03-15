import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL     = Deno.env.get('FROM_EMAIL') ?? 'noreply@pavitra.lk'
const APP_URL        = Deno.env.get('APP_URL')    ?? 'https://pavitra.vercel.app'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, to, data } = await req.json()

    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set — email skipped')
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const email = buildEmail(type, to, data)
    if (!email) {
      return new Response(JSON.stringify({ ok: false, error: 'Unknown email type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, ...email }),
    })

    const body = await res.json()
    return new Response(JSON.stringify({ ok: res.ok, ...body }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function buildEmail(type: string, to: string, data: Record<string, string>) {
  switch (type) {
    case 'collector_approved':
      return {
        subject: 'Your Pavitra collector account has been approved',
        html: `
          <p>Hello ${data.company_name},</p>
          <p>Great news — your collector account on <strong>Pavitra</strong> has been approved.</p>
          <p>You can now browse open waste listings from University of Peradeniya and submit claims or bids.</p>
          <p><a href="${APP_URL}/board">Browse listings →</a></p>
          <p>If you have any questions, reply to this email.</p>
          <p>— The Pavitra team</p>
        `,
      }

    case 'collector_rejected':
      return {
        subject: 'Update on your Pavitra collector application',
        html: `
          <p>Hello ${data.company_name},</p>
          <p>We were unable to approve your collector account at this time.</p>
          ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
          <p>If you believe this is an error or have updated documentation, please reply to this email.</p>
          <p>— The Pavitra team</p>
        `,
      }

    case 'new_listing':
      return {
        subject: `New ${data.stream} listing posted — ${data.material}`,
        html: `
          <p>Hello,</p>
          <p>A new waste listing has been posted on <strong>Pavitra</strong> that matches your interests.</p>
          <table style="border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Material</td><td style="font-size:13px">${data.material}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Stream</td><td style="font-size:13px">${data.stream}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Quantity</td><td style="font-size:13px">${data.quantity} ${data.unit}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666;font-size:13px">Location</td><td style="font-size:13px">${data.location}</td></tr>
          </table>
          <p><a href="${APP_URL}/board/${data.listing_id}">View listing →</a></p>
          <p style="font-size:12px;color:#999">You are receiving this because you are an approved collector on Pavitra.</p>
        `,
      }

    case 'claim_confirmed':
      return {
        subject: `Claim confirmed — ${data.material}`,
        html: `
          <p>Hello ${data.name},</p>
          <p>Your claim for <strong>${data.material}</strong> has been confirmed by the generator.</p>
          <p>Please coordinate directly with the generator for pickup logistics. Once the pickup is complete, both parties must confirm completion on the platform to generate the Waste Transfer Record.</p>
          <p><a href="${APP_URL}/board/${data.listing_id}">View listing →</a></p>
          <p>— The Pavitra team</p>
        `,
      }

    default:
      return null
  }
}
