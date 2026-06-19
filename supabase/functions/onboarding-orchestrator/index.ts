import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders, status: 200 })

  try {
    const { action, businessId } = await req.json()
    const EVOLUTION_URL = Deno.env.get('EVOLUTION_API_URL')
    const EVOLUTION_KEY = Deno.env.get('EVOLUTION_API_KEY')
    const instanceName = `heysasa_${businessId}`

    if (action === 'create_instance') {
      // 1. Create/Check Instance
      await fetch(`${EVOLUTION_URL}/instance/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY! },
        body: JSON.stringify({ name: instanceName, integration: "WHATSAPP-BAILEYS" })
      })

      // 2. Trigger Connection
      await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
        headers: { 'apikey': EVOLUTION_API_KEY! }
      })

      // 3. THE FIX: Aggressive QR Polling
      let base64Qr = null;
      for (let i = 0; i < 10; i++) {
        const qrRes = await fetch(`${EVOLUTION_URL}/instance/qr/${instanceName}`, {
          headers: { 'apikey': EVOLUTION_API_KEY! }
        })
        if (qrRes.ok) {
          const qrData = await qrRes.json()
          // Check all possible locations for the QR string
          base64Qr = qrData.base64 || qrData.qrcode?.base64 || qrData.code;
          if (base64Qr) break;
        }
        await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds between attempts
      }

      if (!base64Qr) throw new Error("WhatsApp server timed out generating QR code. Please try again.");

      return new Response(JSON.stringify({ qrcode: base64Qr, status: 'QR_READY' }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: corsHeaders, status: 200 })
  }
})