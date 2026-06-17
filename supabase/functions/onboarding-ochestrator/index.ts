import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
}

serve(async (req: Request) => {
  // 1. PERMANENT FIX PART 1: The Preflight must be independent
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    // Get secrets safely
    const evoUrl = Deno.env.get('EVOLUTION_API_URL')
    const evoKey = Deno.env.get('EVOLUTION_API_KEY')

    const body = await req.json().catch(() => ({}))
    const { action, businessId } = body

    // 2. PERMANENT FIX PART 2: Defend against internal fetch crashes
    // If your Evolution server is slow or IP is wrong, a normal fetch crashes 
    // the whole function. We must wrap the fetch.
    
    let resultData = {}

    if (action === 'create_instance') {
      const instanceName = `heysasa_${businessId}`
      
      const response = await fetch(`${evoUrl}/instance/connectionState/${instanceName}`, {
        headers: { 'apikey': evoKey || '' }
      }).catch((e) => {
        // This catches "Server Not Found" so the function doesn't die
        throw new Error(`Evolution Server Unreachable: ${e.message}`)
      })

      resultData = await response.json()
    }

    // 3. SUCCESS EXIT: Always send headers
    return new Response(JSON.stringify(resultData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // 4. ERROR EXIT: The most important part. 
    // If the function errors, we STILL return 200 so the browser 
    // allows the error message to be read by your JavaScript.
    return new Response(JSON.stringify({ error: error.message, isError: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, 
    })
  }
})