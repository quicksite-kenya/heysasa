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

    // ACTION 1: Create Instance / Check Connection
    if (action === 'create_instance') {
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

      await fetch(`${EVOLUTION_URL}/instance/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
        body: JSON.stringify({ name: instanceName, integration: "WHATSAPP-BAILEYS" })
      })

      const connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: { 'apikey': EVOLUTION_API_KEY }
      })
      const data = await connectRes.json()

      return new Response(JSON.stringify({ qrcode: data.base64, instance_name: instanceName, status: 'QR_READY' }), { 
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      })
    }

    // ACTION 2: Get Pairing Code (The "Get Code" option)
    if (action === 'pair_phone') {
      if (!phoneNumber) throw new Error("Phone number is required for pairing code");
      
      const cleanPhone = phoneNumber.replace(/\D/g, ''); // Ensure digits only

      const pairRes = await fetch(`${EVOLUTION_URL}/instance/pair-code/${instanceName}?number=${cleanPhone}`, {
        method: 'GET',
        headers: { 'apikey': EVOLUTION_API_KEY }
      })

      const pairData = await pairRes.json()
      
      if (!pairRes.ok) throw new Error(pairData.message || "Failed to generate pairing code");

      return new Response(JSON.stringify({ code: pairData.code, status: 'CODE_READY' }), { 
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      })
    }

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 200, headers: corsHeaders })
  }
})