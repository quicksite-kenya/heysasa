import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
    const payload = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ─── 1. HANDLE CONNECTION UPDATES (Onboarding Sync) ───
    if (payload.event === 'connection.update') {
      const status = payload.data?.status
      const instanceName = payload.instance // Format: heysasa_BIZID
      
      if (status === 'open' || status === 'connected') {
        const businessId = instanceName.split('_')[1]

        await Promise.all([
          supabase.from('businesses').update({ whatsapp_connected: true, status: 'connected' }).eq('business_id', businessId),
          supabase.from('business_onboarding').update({ whatsapp_connected: true }).eq('business_id', businessId)
        ])
        return new Response("Connection Verified")
      }
    }

    // ─── 2. HANDLE INCOMING MESSAGES (Live Chat Logic) ───
    if (payload.event === 'messages.upsert') {
      const incoming = payload.data
      const instanceName = payload.instance 
      const businessId = instanceName.split('_')[1]

      // A. Ignore if it's a message sent FROM the phone (outgoing)
      if (incoming.key.fromMe) return new Response("Skip outgoing")

      // B. Identify the sender's phone
      const remoteJid = incoming.key.remoteJid // e.g. "254712345678@s.whatsapp.net"
      const phone = remoteJid.split('@')[0]

      // C. Extract the message text
      const text = incoming.message?.conversation || 
                   incoming.message?.extendedTextMessage?.text || 
                   incoming.message?.imageMessage?.caption || 
                   "";

      if (!text) return new Response("No text content")

      // D. Find the Lead ID in your contacts table for this specific business
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('phone', phone)
        .eq('business_id', businessId)
        .maybeSingle()

      if (contact) {
        // E. Save to the messages table - This triggers the dashboard Realtime!
        await supabase.from('messages').insert({
          business_id: businessId,
          lead_id: contact.id,
          message_text: text,
          sender: 'lead',
          direction: 'in'
        })
        console.log(`[WEBHOOK] Chat saved for: ${phone}`)
      } else {
        console.warn(`[WEBHOOK] Message from ${phone} ignored: Not in contacts.`)
      }

      return new Response("Message Processed")
    }

    return new Response("Event Ignored")
  } catch (err) {
    console.error(`[WEBHOOK ERROR]: ${err.message}`)
    return new Response(err.message, { status: 400 })
  }
})