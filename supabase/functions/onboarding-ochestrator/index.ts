import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const EVOLUTION_URL = "http://129.213.33.173:8080"
const EVOLUTION_API_KEY = "mysupersecretapikey123"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { action, businessId } = await req.json()
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const instanceName = `heysasa_${businessId}`

    if (action === 'create_instance') {
      // 1. Check if instance is already "open" on the server
      const statusRes = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instanceName}`, {
        headers: { 'apikey': EVOLUTION_API_KEY }
      })
      
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        if (statusData.instance.state === 'open') {
          // AUTO-SYNC: If server says it's open, update DB and tell frontend to skip QR
          await supabase.from('businesses').update({ whatsapp_connected: true, status: 'connected' }).eq('business_id', businessId)
          return new Response(JSON.stringify({ status: 'ALREADY_CONNECTED' }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
        }
        // If it exists but is closed, delete it so we can generate a fresh QR
        await fetch(`${EVOLUTION_URL}/instance/delete/${instanceName}`, { method: 'DELETE', headers: { 'apikey': EVOLUTION_API_KEY } })
      }

      // 2. Create fresh instance
      await fetch(`${EVOLUTION_URL}/instance/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
        body: JSON.stringify({ name: instanceName, integration: "WHATSAPP-BAILEYS" })
      })

      // 3. Connect and get the Base64 QR
      const connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: { 'apikey': EVOLUTION_API_KEY }
      })
      const connectData = await connectRes.json()

      return new Response(JSON.stringify({ qrcode: connectData.base64, instance_name: instanceName }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 })
  }
})