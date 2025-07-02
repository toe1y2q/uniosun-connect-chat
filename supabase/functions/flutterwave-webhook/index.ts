
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    console.log('Flutterwave webhook received:', body)

    // Verify webhook signature (optional but recommended)
    const signature = req.headers.get('verif-hash')
    const expectedHash = Deno.env.get('FLUTTERWAVE_WEBHOOK_SECRET_HASH')
    
    if (expectedHash && signature !== expectedHash) {
      console.log('Invalid webhook signature')
      return new Response('Invalid signature', { status: 401, headers: corsHeaders })
    }

    // Handle different event types
    const { event, data } = body

    if (event === 'charge.completed' && data.status === 'successful') {
      // Update session payment status
      const txRef = data.tx_ref
      
      if (txRef.startsWith('session_')) {
        const { error } = await supabase
          .from('sessions')
          .update({ 
            payment_status: 'completed',
            flutterwave_reference: data.flw_ref 
          })
          .eq('flutterwave_reference', data.id)

        if (error) {
          console.error('Error updating session:', error)
        } else {
          console.log('Session payment confirmed:', txRef)
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
