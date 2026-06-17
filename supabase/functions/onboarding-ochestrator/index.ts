import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 1. Definitively allow GitHub Pages to talk to Supabase
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
}

serve(async (req: Request) => {
  // 2. IMMEDIATE HANDSHAKE (Preflight)
  // This solves "It does not have HTTP ok status"
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const { action, businessId } = await req.json()
    
    // Retrieve secrets
    const evoUrl = Deno.env.get('EVOLUTION_API_URL')
    const evoKey = Deno.env.get('EVOLUTION_API_KEY')

    // 3. SECRETS GUARD: Stop the crash before it happens
    // If the URL is currently a "long string of letters," this will catch it
    if (!evoUrl || !evoUrl.startsWith('http')) {
      throw new Error(`CRITICAL: EVOLUTION_API_URL is missing or invalid. It is currently: "${evoUrl}"`)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    const instanceName = `heysasa_${businessId}`

    if (action === 'create_instance') {
      // Your Evolution API logic...
      // (Ensure every 'return new Response' uses the corsHeaders)
      return new Response(JSON.stringify({ status: 'READY', qrcode: '...' }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      })
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 
    })

  } catch (error) {
    // 4. CRITICAL: Catch blocks MUST return status 200 and corsHeaders
    // If you return status 400 or 500 here, the browser hides the error and shows "CORS Error"
    console.error("[BACKEND ERROR]:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 
    })
  }
})