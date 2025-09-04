
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

    const { sessionId } = await req.json()
    console.log('Settling escrow for session:', sessionId)

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*, users!sessions_student_id_fkey(account_number, account_name, bank_code)')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      throw new Error('Session not found')
    }

    if (!session.flutterwave_reference) {
      throw new Error('No Flutterwave reference found')
    }

    // Settle escrow with Ravepay
    const settleResponse = await fetch('https://api.ravepay.co/v2/gpx/transactions/escrow/settle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: session.flutterwave_reference,
        secret_key: Deno.env.get('FLUTTERWAVE_SECRET_KEY') || 'FLWSECK-434b96a89fc920868e3cc03604d8fb11-1973af2c9bcvt-X'
      })
    })

    let settleResult;
    const responseText = await settleResponse.text()
    console.log('Raw settlement response:', responseText)
    console.log('Settlement response status:', settleResponse.status)
    
    try {
      settleResult = JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse settlement response as JSON:', e)
      throw new Error(`Settlement API error: ${responseText}`)
    }
    
    console.log('Escrow settlement result:', settleResult)

    if (settleResult.status === 'success') {
      // Calculate student payout (70%)
      const studentPayout = Math.floor(session.amount * 0.7)
      
      // Transfer to student if they have bank details
      if (session.users?.account_number && session.users?.bank_code) {
        const transferResponse = await fetch('https://api.flutterwave.com/v3/transfers', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer FLWSECK-434b96a89fc920868e3cc03604d8fb11-1973af2c9bcvt-X`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            account_bank: session.users.bank_code,
            account_number: session.users.account_number,
            amount: studentPayout / 100, // Convert kobo to naira
            currency: 'NGN',
            reference: `payout_${sessionId}_${Date.now()}`,
            beneficiary_name: session.users.account_name,
            narration: `Session payout - ${session.description || 'Tutoring session'}`
          })
        })

        const transferResult = await transferResponse.json()
        console.log('Transfer result:', transferResult)

        if (transferResult.status === 'success') {
          // Record earning transaction
          await supabase
            .from('transactions')
            .insert({
              user_id: session.student_id,
              session_id: sessionId,
              amount: studentPayout,
              type: 'earning',
              status: 'completed',
              description: `Session payout - ${session.description}`,
              reference: transferResult.data.reference
            })
        }
      } else {
        // Add to wallet if no bank account
        await supabase
          .from('transactions')
          .insert({
            user_id: session.student_id,
            session_id: sessionId,
            amount: studentPayout,
            type: 'earning',
            status: 'completed',
            description: `Session payout - ${session.description}`,
            reference: `wallet_${sessionId}`
          })
      }

      // Update session status
      await supabase
        .from('sessions')
        .update({ 
          payment_status: 'settled',
          status: 'completed'
        })
        .eq('id', sessionId)

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Escrow settled and payout processed',
        studentPayout: studentPayout / 100
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      throw new Error('Failed to settle escrow')
    }

  } catch (error) {
    console.error('Escrow settlement error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
