import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 1. Define headers clearly
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
}

serve(async (req: Request) => {
  // 2. THE ABSOLUTE FIX: Handle the preflight OPTIONS request immediately
  // This MUST happen before any logic or body parsing.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    // Check if body exists before parsing
    const body = await req.json().catch(() => ({}))
    const { action, businessId } = body

    // 3. Secrets Guard - Prevent crash if URL is missing
    const evoUrl = Deno.env.get('EVOLUTION_API_URL')
    const evoKey = Deno.env.get('EVOLUTION_API_KEY')

    if (!evoUrl || !evoUrl.startsWith('http')) {
      throw new Error(`EVOLUTION_API_URL is wrong. Current value: "${evoUrl}"`)
    }

    const instanceName = `heysasa_${businessId}`

    if (action === 'create_instance') {
      // Standard Evolution Go status check
      const response = await fetch(`${evoUrl}/instance/connectionState/${instanceName}`, {
        headers: { 'apikey': evoKey || '' }
      })
      
      const result = await response.json()

      return new Response(JSON.stringify(result), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      })
    }

    return new Response(JSON.stringify({ error: "Action not supported" }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 
    })

  } catch (error) {
    // 4. Return error as JSON so Dashboard can show it
    console.error("[Backend Error]:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 // Returning 200 here ensures the browser doesn't trigger a CORS block on the error
    })
  }
})