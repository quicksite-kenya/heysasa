import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 1. HARDENED CORS HEADERS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
}

serve(async (req: Request) => {
  // 2. IMMEDIATE PREFLIGHT HANDLER
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const { action, businessId, phoneNumber } = await req.json()
    
    if (!businessId) throw new Error("businessId is required")

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    const EVOLUTION_URL = Deno.env.get('EVOLUTION_API_URL') // http://129.213.33.173:8080
    const EVOLUTION_KEY = Deno.env.get('EVOLUTION_API_KEY') // mysupersecretapikey123
    const instanceName = `heysasa_${businessId}`

    // ACTION: INITIALIZE / GET QR
    if (action === 'create_instance') {
      console.log(`[LOG] Checking state for: ${instanceName}`)

      // A. CHECK CURRENT STATE
      const stateRes = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instanceName}`, {
        headers: { 'apikey': EVOLUTION_KEY! }
      })
      
      if (stateRes.ok) {
        const stateData = await stateRes.ok ? await stateRes.json() : {}
        if (stateData.instance?.state === 'open' || stateData.instance?.state === 'connected') {
          // SYNC DATABASE
          await Promise.all([
             supabase.from('businesses').update({ whatsapp_connected: true, status: 'connected' }).eq('business_id', businessId),
             supabase.from('business_onboarding').update({ whatsapp_connected: true }).eq('business_id', businessId)
          ])
          return new Response(JSON.stringify({ status: 'ALREADY_CONNECTED' }), { 
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
          })
        }
        // IF DISCONNECTED, DELETE TO START FRESH
        await fetch(`${EVOLUTION_URL}/instance/delete/${instanceName}`, { 
          method: 'DELETE', headers: { 'apikey': EVOLUTION_KEY! } 
        })
      }

      // B. CREATE INSTANCE
      await fetch(`${EVOLUTION_URL}/instance/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY! },
        body: JSON.stringify({ name: instanceName, integration: "WHATSAPP-BAILEYS" })
      })

      // C. TRIGGER CONNECT
      await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
        method: 'GET', headers: { 'apikey': EVOLUTION_KEY! }
      })

      // D. AGGRESSIVE QR POLLING (Retry 10 times, 2s intervals)
      let base64Qr = null
      for (let i = 0; i < 10; i++) {
        console.log(`[QR Poll] Attempt ${i + 1}...`)
        const qrRes = await fetch(`${EVOLUTION_URL}/instance/qr/${instanceName}`, {
          method: 'GET', headers: { 'apikey': EVOLUTION_KEY! }
        })
        if (qrRes.ok) {
          const qrData = await qrRes.json()
          base64Qr = qrData.base64 || qrData.code || (qrData.data?.qrcode)
          if (base64Qr) break
        }
        await new Promise(r => setTimeout(r, 2000))
      }

      if (!base64Qr) throw new Error("QR Generation timed out on WhatsApp server.")

      return new Response(JSON.stringify({ qrcode: base64Qr, status: 'QR_READY' }), { 
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      })
    }

    // ACTION: PAIR VIA CODE ("Get Code" option)
    if (action === 'pair_phone') {
      if (!phoneNumber) throw new Error("Phone number required")
      const cleanPhone = phoneNumber.replace(/\D/g, '')

      const pairRes = await fetch(`${EVOLUTION_URL}/instance/pair-code/${instanceName}?number=${cleanPhone}`, {
        method: 'GET', headers: { 'apikey': EVOLUTION_KEY! }
      })
      const pairData = await pairRes.json()
      
      if (!pairRes.ok) throw new Error(pairData.message || "Pairing code failed.")

      return new Response(JSON.stringify({ pairing_code: pairData.code }), { 
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      })
    }

    return new Response(JSON.stringify({ error: "Invalid Action" }), { 
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    console.error("[FATAL ERROR]:", msg)
    return new Response(JSON.stringify({ error: msg }), { 
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })
  }
})