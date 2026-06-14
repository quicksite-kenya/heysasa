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
    const { action, businessId } = await req.json()
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const instanceName = `heysasa_${businessId}`

    if (action === 'create_instance') {
      // 1. Cleanup: If instance exists but isn't open, delete it
      const checkRes = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instanceName}`, {
        headers: { 'apikey': EVOLUTION_API_KEY }
      })
      if (checkRes.ok) {
        const state = await checkRes.json()
        if (state.instance?.state === 'open') {
          return new Response(JSON.stringify({ status: 'ALREADY_CONNECTED' }), { status: 200, headers: corsHeaders })
        }
        await fetch(`${EVOLUTION_URL}/instance/delete/${instanceName}`, { method: 'DELETE', headers: { 'apikey': EVOLUTION_API_KEY } })
      }

      // 2. Create Instance
      await fetch(`${EVOLUTION_URL}/instance/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
        body: JSON.stringify({ name: instanceName, integration: "WHATSAPP-BAILEYS" })
      })

      // 3. Connect & QR Retry Loop (Try 5 times)
      let qrCode = null;
      for (let i = 0; i < 5; i++) {
        console.log(`QR Fetch Attempt ${i + 1}...`);
        const connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
          headers: { 'apikey': EVOLUTION_API_KEY }
        })
        const data = await connectRes.json()
        
        // Evolution API usually returns QR in 'base64' or 'code'
        qrCode = data.base64 || data.code || (data.data?.qrcode);
        
        if (qrCode) break;
        await new Promise(res => setTimeout(res, 2000)); // Wait 2 seconds before retrying
      }

      if (!qrCode) throw new Error("Evolution API failed to generate QR code. Try again in a moment.");

      return new Response(JSON.stringify({ qrcode: qrCode, status: 'QR_READY' }), { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      })
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 200, headers: corsHeaders })
  }
})