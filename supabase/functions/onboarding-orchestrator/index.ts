import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req: Request) => {
  // 1. HANDLE PREFLIGHT IMMEDIATELY
  // This is the specific fix for "It does not have HTTP ok status"
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const { action, businessId } = await req.json()
    
    const evoUrl = Deno.env.get('EVOLUTION_API_URL')
    const evoKey = Deno.env.get('EVOLUTION_API_KEY')

    // 2. DEFENSIVE CHECK: If secrets are missing, don't let the function crash
    if (!evoUrl || !evoUrl.startsWith('http')) {
      return new Response(JSON.stringify({ error: "Backend Secret Config Error: EVOLUTION_API_URL is missing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 // We return 200 so the browser shows the error message instead of a CORS block
      })
    }

    const instanceName = `heysasa_${businessId}`

    if (action === 'create_instance') {
      const response = await fetch(`${evoUrl}/instance/connectionState/${instanceName}`, {
        headers: { 'apikey': evoKey! }
      })
      const result = await response.json()

      return new Response(JSON.stringify(result), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      })
    }

    return new Response(JSON.stringify({ error: "Action not recognized" }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 
    })

  } catch (error) {
    console.error("[CATCH BLOCK]:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 
    })
  }
})