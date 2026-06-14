import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
    const payload = await req.json()
    if (payload.event !== 'messages.upsert') return new Response("OK")

    const incoming = payload.data
    if (incoming.key.fromMe) return new Response("Skip outgoing") // Ignore our own messages

    const phone = incoming.key.remoteJid.split('@')[0]
    const text = incoming.message?.conversation || incoming.message?.extendedTextMessage?.text
    
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Find who this phone number belongs to
    const { data: contact } = await supabase.from('contacts').select('id, business_id').eq('phone', phone).maybeSingle()

    if (contact) {
      await supabase.from('messages').insert({
        business_id: contact.business_id,
        lead_id: contact.id,
        message_text: text,
        sender: 'lead',
        direction: 'in'
      })
    }

    return new Response("Saved")
  } catch (err) {
    return new Response(err.message, { status: 400 })
  }
})