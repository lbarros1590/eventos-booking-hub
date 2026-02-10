import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handles CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { clientName, bookingDate, total } = await req.json()

    // Número da proprietária (Leiner)
    const whatsappNumber = '5565992860607'
    
    // Mensagem formatada
    const message = `Olá! Nova reserva solicitada:\n\n*Nome do Cliente:* ${clientName}\n*Data da Reserva:* ${bookingDate}\n*Valor Total:* R$ ${total},00\n\nPor favor, entre em contato para confirmar.`

    // Chamar a API do backend para enviar a mensagem
    const backendUrl = Deno.env.get('BACKEND_URL') || 'http://localhost:3001'
    
    const response = await fetch(`${backendUrl}/api/send-whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: whatsappNumber,
        message: message,
      }),
    })

    const result = await response.json()

    return new Response(
      JSON.stringify({
        success: result.success,
        message: result.success ? 'Notificação enviada com sucesso' : 'Erro ao enviar notificação',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: result.success ? 200 : 400,
      }
    )
  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
