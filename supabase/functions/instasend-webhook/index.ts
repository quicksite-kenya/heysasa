import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const payload = await req.json()
  
  // Instasend sends 'state' as 'COMPLETED'
  if (payload.state === 'COMPLETED') {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    
    // This update triggers the SQL function that adds the credits!
    await supabase
      .from('transactions')
      .update({ status: 'completed' })
      .eq('gateway_checkout_id', payload.id)
      .eq('status', 'pending')
  }

  return new Response("OK")
})