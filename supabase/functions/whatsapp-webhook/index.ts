import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
    const payload = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ─── 1. HANDLE CONNECTION SUCCESS (Onboarding Logic) ───
    if (payload.event === 'connection.update') {
      const status = payload.data?.status
      const instanceName = payload.instance // Format: "heysasa_BIZID_UUID"
      
      if (status === 'open' || status === 'connected') {
        const parts = instanceName.split('_')
        const businessId = parts[1]

        // Update the main Business table
        await supabase
          .from('businesses')
          .update({ 
            whatsapp_connected: true, 
            status: 'connected' 
          })
          .eq('business_id', businessId)

        // NEW: Also update the Onboarding table so the UI Step 2 turns green
        await supabase
          .from('business_onboarding')
          .update({ whatsapp_connected: true })
          .eq('business_id', businessId)

        console.log(`[WEBHOOK] Business ${businessId} connection VERIFIED`)
        return new Response("Connection Updated")
      }
    }

    // ─── 2. HANDLE INCOMING MESSAGES (Live Chat Logic) ───
    if (payload.event === 'messages.upsert') {
      const incoming = payload.data
      
      // Ignore if it's a message sent FROM the phone (outgoing)
      if (incoming.key.fromMe) return new Response("Skip outgoing")

      const remoteJid = incoming.key.remoteJid // e.g. "254712345678@s.whatsapp.net"
      const phone = remoteJid.split('@')[0]
      
      // Support different message types (Text or Quoted Text)
      const text = incoming.message?.conversation || 
                   incoming.message?.extendedTextMessage?.text ||
                   incoming.message?.imageMessage?.caption || 
                   "";
      
      if (!text) return new Response("No text content detected")

      // Find the Lead in your contacts
      const { data: contact } = await supabase
        .from('contacts')
        .select('id, business_id')
        .eq('phone', phone)
        .maybeSingle()

      if (contact) {
        // Save to messages table. direction 'in' makes it appear on the left in your dashboard
        await supabase.from('messages').insert({
          business_id: contact.business_id,
          lead_id: contact.id,
          message_text: text,
          sender: 'lead',
          direction: 'in'
        })
        console.log(`[WEBHOOK] Message saved for contact ${contact.id}`)
      } else {
          console.warn(`[WEBHOOK] Message received from ${phone} but no contact found in DB.`)
      }
      
      return new Response("Message Processed")
    }

    return new Response("Event Ignored")
  } catch (err) {
    console.error(`[WEBHOOK FATAL ERROR]: ${err.message}`)
    return new Response(err.message, { status: 400 })
  }
})