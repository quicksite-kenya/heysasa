import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req: Request) => {
  // 1. Standardize OPTIONS response (No body, Status 204)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    const { action, businessId } = await req.json()
    const evoUrl = Deno.env.get('EVOLUTION_API_URL')
    const evoKey = Deno.env.get('EVOLUTION_API_KEY')

    if (!evoUrl) throw new Error("Missing EVOLUTION_API_URL secret")
    if (!businessId) throw new Error("businessId is required")

    const instanceName = `heysasa_${businessId}`

    if (action === 'create_instance') {
      // Fetch connection state
      const response = await fetch(`${evoUrl}/instance/connectionState/${instanceName}`, {
        headers: { 'apikey': evoKey || "" }
      })
      
      // Defensively handle Evolution API responses
      const resultText = await response.text()
      let resultData;
      try {
        resultData = JSON.parse(resultText)
      } catch (e) {
        resultData = { status: resultText } // Fallback if Evolution returns plain text
      }

      // 2. ALWAYS return a structured JSON object
      return new Response(JSON.stringify({ 
        success: true, 
        data: resultData,
        instance_name: instanceName 
      }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      })
    }

    throw new Error(`Unknown action: ${action}`)

  } catch (error) {
    // 3. Ensure ERRORS are also valid JSON
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 // Returning 200 prevents CORS blocks on error messages
    })
  }
})