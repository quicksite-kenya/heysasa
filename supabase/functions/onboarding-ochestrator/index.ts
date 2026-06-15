import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 1. Definitively allow GitHub Pages
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
}

serve(async (req: Request) => {
  // 2. Handle Preflight immediately
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const { action, businessId, phoneNumber } = await req.json()
    
    // Check if secrets are available immediately to prevent silent crashes
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const evoUrl = Deno.env.get('EVOLUTION_API_URL')
    const evoKey = Deno.env.get('EVOLUTION_API_KEY')

    if (!supabaseUrl || !supabaseKey || !evoUrl || !evoKey) {
      throw new Error("Backend Configuration Error: Missing Secrets in Supabase Dashboard")
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const instanceName = `heysasa_${businessId}`

    if (action === 'create_instance') {
      // Logic for instance creation...
      // (Assuming logic from previous message)
      
      return new Response(JSON.stringify({ status: 'QR_READY', qrcode: "..." }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      })
    }

    // Default response
    return new Response(JSON.stringify({ error: "Action not recognized" }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 
    })

  } catch (error) {
    // 3. CRITICAL: Errors MUST return CORS headers too
    console.error("[ERROR]:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 // Returning 200 here ensures the browser lets the JSON through
    })
  }
})