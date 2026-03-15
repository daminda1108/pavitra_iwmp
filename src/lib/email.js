import { supabase } from './supabase'

/**
 * Send an email via the Supabase send-email edge function.
 * Fails silently — never blocks UI actions.
 *
 * Types:
 *   'collector_approved'  { company_name }
 *   'collector_rejected'  { company_name, reason }
 *   'new_listing'         { material, stream, quantity, unit, location, listing_id }
 *   'claim_confirmed'     { name, material, listing_id }
 */
export async function sendEmail(type, to, data = {}) {
  if (!to) return
  try {
    await supabase.functions.invoke('send-email', {
      body: { type, to, data },
    })
  } catch {
    // silent — email is best-effort
  }
}
