import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 1. DEFINE HEADERS TO ALLOW GITHUB PAGES
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
}

serve(async (req: Request) => {
  // 2. CRITICAL: Handle the "Preflight" OPTIONS request
  // This solves the "doesn't pass access control check" error
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const { action, businessId } = await req.json()
    
    // Check for secrets immediately
    const evoUrl = Deno.env.get('EVOLUTION_API_URL')
    const evoKey = Deno.env.get('EVOLUTION_API_KEY')

    if (!evoUrl || !evoUrl.startsWith('http')) {
      throw new Error(`EVOLUTION_API_URL is wrong. It is currently: "${evoUrl}". It must be the IP address starting with http://`)
      console.log("Current URL being used:", Deno.env.get('EVOLUTION_API_URL'))
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    const instanceName = `heysasa_${businessId}`

    if (action === 'create_instance') {
      // (Your QR/Creation Logic Here...)
      // Example success response:
      return new Response(JSON.stringify({ status: 'SUCCESS', qrcode: '...' }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      })
    }

    return new Response(JSON.stringify({ error: "Action not recognized" }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 
    })

  } catch (error) {
    // 3. RETURN ERRORS WITH CORS HEADERS
    // If you don't return corsHeaders in the catch block, a crash looks like a CORS error
    console.error("[BACKEND ERROR]:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 // Return 200 so the browser doesn't block the error text
    })
  }
})