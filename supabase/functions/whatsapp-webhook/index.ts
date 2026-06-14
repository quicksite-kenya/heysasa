import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
    const payload = await req.json()
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // ─── 1. HANDLE CONNECTION SUCCESS ───
    // This is what makes the Dashboard move to Step 3
    if (payload.event === 'connection.update') {
      const status = payload.data?.status
      const instanceName = payload.instance // e.g. "heysasa_biz123_uuid"
      
      if (status === 'open' || status === 'connected') {
        // Extract business_id from instance name: heysasa_ID_uuid
        const parts = instanceName.split('_')
        const businessId = parts[1]

        await supabase
          .from('businesses')
          .update({ 
            whatsapp_connected: true, 
            status: 'connected' 
          })
          .eq('business_id', businessId)

        console.log(`[WEBHOOK] Business ${businessId} is now ONLINE`)
        return new Response("Connection Updated")
      }
    }

    // ─── 2. HANDLE INCOMING MESSAGES ───
    if (payload.event === 'messages.upsert') {
      const incoming = payload.data
      if (incoming.key.fromMe) return new Response("Skip outgoing")

      const phone = incoming.key.remoteJid.split('@')[0]
      const text = incoming.message?.conversation || incoming.message?.extendedTextMessage?.text
      
      if (!text) return new Response("No text content")

      // Find the Lead in your contacts
      const { data: contact } = await supabase
        .from('contacts')
        .select('id, business_id')
        .eq('phone', phone)
        .maybeSingle()

      if (contact) {
        await supabase.from('messages').insert({
          business_id: contact.business_id,
          lead_id: contact.id,
          message_text: text,
          sender: 'lead',
          direction: 'in'
        })
      }
      return new Response("Message Saved")
    }

    return new Response("Event Ignored")
  } catch (err) {
    console.error(`[WEBHOOK ERROR]: ${err.message}`)
    return new Response(err.message, { status: 400 })
  }
})