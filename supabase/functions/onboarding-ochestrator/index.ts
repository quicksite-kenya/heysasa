import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const EVOLUTION_URL = "http://129.213.33.173:8080"
const EVOLUTION_API_KEY = "mysupersecretapikey123"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
}

serve(async (req: Request) => {
  // 1. FIX CORS: Explicitly handle the browser preflight check
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const { action, businessId } = await req.json()
    
    if (!businessId) throw new Error("businessId is required")

    // Initialize Supabase with Service Role to ensure we can update status
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Use a STABLE instance name (No random UUIDs)
    const instanceName = `heysasa_${businessId}`

    if (action === 'create_instance') {
      console.log(`Checking state for: ${instanceName}`)

      // 2. CHECK CONNECTION STATE first
      const stateRes = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instanceName}`, {
        headers: { 'apikey': EVOLUTION_API_KEY }
      })
      
      if (stateRes.ok) {
        const stateData = await stateRes.json()
        
        // If already connected, sync DB and tell frontend to move forward
        if (stateData.instance?.state === 'open' || stateData.instance?.state === 'connected') {
          console.log("Instance already connected. Syncing DB...")
          
          await Promise.all([
             supabase.from('businesses').update({ whatsapp_connected: true, status: 'connected' }).eq('business_id', businessId),
             supabase.from('business_onboarding').update({ whatsapp_connected: true }).eq('business_id', businessId)
          ])

          return new Response(JSON.stringify({ status: 'ALREADY_CONNECTED', instance_name: instanceName }), { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          })
        }

        // If instance exists but is NOT open, delete it so we can start fresh
        console.log("Instance exists but disconnected. Re-creating...")
        await fetch(`${EVOLUTION_URL}/instance/delete/${instanceName}`, { 
          method: 'DELETE', 
          headers: { 'apikey': EVOLUTION_API_KEY } 
        })
      }

      // 3. CREATE FRESH INSTANCE
      console.log("Creating new instance...")
      const createRes = await fetch(`${EVOLUTION_URL}/instance/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
        body: JSON.stringify({ 
            name: instanceName, 
            integration: "WHATSAPP-BAILEYS",
            token: businessId // Using businessId as the instance token
        })
      })

      if (!createRes.ok) {
          const err = await createRes.json()
          throw new Error(`Evolution Create Error: ${err.message || 'Unknown'}`)
      }

      // 4. FETCH QR CODE
      console.log("Fetching QR...")
      const connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: { 'apikey': EVOLUTION_API_KEY }
      })
      
      const connectData = await connectRes.json()

      return new Response(JSON.stringify({ 
          qrcode: connectData.base64, 
          instance_name: instanceName,
          status: 'QR_READY' 
      }), { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      })
    }

    return new Response(JSON.stringify({ error: "Invalid Action" }), { status: 400, headers: corsHeaders })

  } catch (error) {
    console.error("Orchestrator Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 200, // We return 200 even on error so CORS preflight doesn't trigger a secondary failure
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })
  }
})