import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { leadId, text, businessId } = await req.json()
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // 1. Get Customer Phone
    const { data: contact } = await supabase.from('contacts').select('phone').eq('id', leadId).single()
    if (!contact) throw new Error("Contact not found")

    // 2. Call Evolution API
    const instanceName = `heysasa_${businessId}`
    const response = await fetch(`${Deno.env.get('EVOLUTION_API_URL')}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 
        'apikey': Deno.env.get('EVOLUTION_API_KEY')!, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ number: contact.phone.replace(/\D/g, ''), text: text })
    })

    return new Response(JSON.stringify({ sent: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 })
  }
})