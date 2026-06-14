import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, customer_phone, business_id } = await req.json()

    // 1. Call Instasend API
    const response = await fetch("https://api.instasend.com/v1/payment/stkpush/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("INSTASEND_API_KEY")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: amount,
        phone_number: customer_phone,
        label: "HeySasa Topup"
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || "Instasend API connection failed")
    }

    // 2. Initialize Supabase Admin Client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 3. Log the pending transaction in your database
    const { error: dbError } = await supabase.from('transactions').insert({
      business_id: business_id,
      amount: amount,
      customer_phone: customer_phone,
      gateway_checkout_id: result.id,
      status: 'pending'
    })

    if (dbError) throw dbError

    return new Response(JSON.stringify(result), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 
    })

  } catch (error) {
    // Explicitly handle the 'unknown' error type for TypeScript
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    
    console.error("Payment initiation error:", message)
    
    return new Response(JSON.stringify({ error: message }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400 
    })
  }
})