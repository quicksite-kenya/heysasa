import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EVOLUTION_URL = "http://129.213.33.173:8080"
const EVOLUTION_API_KEY = "mysupersecretapikey123"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { status: 200, headers: corsHeaders })

  try {
    const { action, businessId, phoneNumber } = await req.json()
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const instanceName = `heysasa_${businessId}`
    const instanceToken = businessId // Using businessId as a stable token

    if (action === 'create_instance') {
      // 1. Cleanup old instances if they aren't 'open'
      const statusRes = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instanceName}`, {
        headers: { 'apikey': EVOLUTION_API_KEY }
      })
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        if (statusData.instance.state === 'open') {
          return new Response(JSON.stringify({ status: 'ALREADY_CONNECTED' }), { status: 200, headers: corsHeaders })
        }
        await fetch(`${EVOLUTION_URL}/instance/delete/${instanceName}`, { method: 'DELETE', headers: { 'apikey': EVOLUTION_API_KEY } })
      }

      // 2. Create Instance
      await fetch(`${EVOLUTION_URL}/instance/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
        body: JSON.stringify({ name: instanceName, token: instanceToken, integration: "WHATSAPP-BAILEYS" })
      })

      // 3. Initialize Connection
      await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: { 'apikey': EVOLUTION_API_KEY }
      })

      // 4. Fetch QR with Retry (Wait for Evolution to generate it)
      let base64Qr = null
      for (let i = 0; i < 5; i++) {
        const qrRes = await fetch(`${EVOLUTION_URL}/instance/qr/${instanceName}`, {
          method: 'GET',
          headers: { 'apikey': EVOLUTION_API_KEY }
        })
        if (qrRes.ok) {
          const qrData = await qrRes.json()
          if (qrData.base64) {
            base64Qr = qrData.base64
            break
          }
        }
        await new Promise(r => setTimeout(r, 2000)) // Wait 2s
      }

      if (!base64Qr) throw new Error("QR Code timed out. Please try again.")

      return new Response(JSON.stringify({ qrcode: base64Qr, instance_name: instanceName }), { 
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      })
    }

    if (action === 'pair_phone') {
        const cleanPhone = phoneNumber.replace(/\D/g, '')
        const pairRes = await fetch(`${EVOLUTION_URL}/instance/pair/${instanceName}?number=${cleanPhone}`, {
            method: 'GET',
            headers: { 'apikey': EVOLUTION_API_KEY }
        })
        const pairData = await pairRes.json()
        if (!pairRes.ok) throw new Error(pairData.message || "Pairing failed")
        
        return new Response(JSON.stringify({ pairing_code: pairData.code }), { 
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
        })
    }

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 200, // Return 200 to keep CORS happy, but include the error object
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })
  }
})