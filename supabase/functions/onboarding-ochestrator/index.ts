import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 1. Headers to allow your GitHub Pages site to talk to Supabase
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
}

serve(async (req: Request) => {
  // 2. Handle the Preflight "OPTIONS" request (The fix for your error)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const { action, businessId } = await req.json()
    const evoUrl = Deno.env.get('EVOLUTION_API_URL')
    const evoKey = Deno.env.get('EVOLUTION_API_KEY')

    // 3. VALIDATION GUARD: Stop the crash before it happens
    if (!evoUrl || !evoUrl.startsWith('http')) {
      throw new Error(`Invalid EVOLUTION_API_URL: "${evoUrl}". Ensure it starts with http:// and isn't just letters.`)
    }

    const instanceName = `heysasa_${businessId}`

    if (action === 'create_instance') {
      // Logic calling your Evolution Server...
      const response = await fetch(`${evoUrl}/instance/connectionState/${instanceName}`, {
        headers: { 'apikey': evoKey! }
      })
      const result = await response.json()

      return new Response(JSON.stringify(result), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      })
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 
    })

  } catch (error) {
    // 4. CRITICAL: Errors MUST also return CORS headers
    // We return status 200 so the browser doesn't block the error message
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 
    })
  }
})