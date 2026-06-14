import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 1. DEFINE CORS HEADERS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req: Request) => {
  // 2. HANDLE THE BROWSER PREFLIGHT (OPTIONS)
  // This is what is currently causing your "Blocked by CORS" error
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200, 
      headers: corsHeaders 
    })
  }

  try {
    const { action, businessId, websiteUrl } = await req.json()

    if (!businessId) throw new Error("businessId is required")

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Example logic for create_instance
    if (action === 'create_instance') {
      // ... your logic calling Evolution API ...
      
      // IMPORTANT: Every successful response must include corsHeaders
      return new Response(JSON.stringify({ 
        status: 'SUCCESS', 
        instance_name: `heysasa_${businessId}`,
        qrcode: "..." // your actual QR data
      }), { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      })
    }

    // Default error response for unknown actions
    return new Response(JSON.stringify({ error: "Invalid Action" }), { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })

  } catch (error) {
    // 3. HANDLE ERRORS WITH CORS HEADERS
    // If you don't return corsHeaders here, a backend crash looks like a CORS error
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })
  }
})