import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

interface RecapRequest {
  vibe_rating: number
  tasting_notes: string
  coffee_weight_g: number
  water_added_g: number
  final_yield_g: number
  brew_ratio_input: number
  extraction_ratio_output: number
}

async function generateRecap(request: RecapRequest): Promise<string> {
  if (!openaiApiKey) {
    console.warn('OPENAI_API_KEY not configured')
    return generateDefaultRecap(request)
  }

  const prompt = `You are a coffee brewing expert analyzing a moka pot brew. 
Provide a short, 2-3 sentence "Brew Master Recap" with actionable insights.

Brew Details:
- Vibe Rating: ${request.vibe_rating}/10
- Tasting Notes: "${request.tasting_notes || 'None provided'}"
- Coffee: ${request.coffee_weight_g}g
- Water In: ${request.water_added_g}g
- Yield: ${request.final_yield_g}g
- Brew Ratio: 1:${request.brew_ratio_input}
- Extraction Ratio: 1:${request.extraction_ratio_output}

Provide insights:
- If rating is low (≤5) and notes mention "bitter", suggest finer grind or lower heat
- If notes mention "sour", suggest coarser grind or higher heat
- Always keep it concise and actionable
- Be encouraging but honest

Response: (2-3 sentences max)`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error:', response.status, errorData)
      return generateDefaultRecap(request)
    }

    const data = await response.json()
    return data.choices[0].message.content.trim()
  } catch (error) {
    console.error('Error calling OpenAI API:', error)
    return generateDefaultRecap(request)
  }
}

function generateDefaultRecap(request: RecapRequest): string {
  const { vibe_rating, tasting_notes, brew_ratio_input, extraction_ratio_output } = request

  if (vibe_rating <= 3) {
    if (tasting_notes.toLowerCase().includes('bitter')) {
      return `This brew came out bitter. Try increasing your grinder setting (coarser) or reducing heat. Your extraction ratio of 1:${extraction_ratio_output} suggests the coffee is over-extracted.`
    }
    if (tasting_notes.toLowerCase().includes('sour')) {
      return `The sourness indicates under-extraction. Use a finer grind setting to increase brew time. A brew ratio of 1:${brew_ratio_input} might be too high for your setup.`
    }
    return `Room for improvement here. Experiment with grinder adjustments and brew time to dial in the perfect extraction.`
  }

  if (vibe_rating <= 6) {
    return `Solid brew! Your 1:${brew_ratio_input} brew ratio produced a yield of 1:${extraction_ratio_output}. Small tweaks to grinder setting could refine the profile further.`
  }

  return `Excellent work! This brew hit the mark with a great vibe rating. Your ${brew_ratio_input}:1 water ratio and ${extraction_ratio_output}:1 extraction ratio are well-balanced. Keep these settings consistent!`
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await req.json() as RecapRequest
    const recap = await generateRecap(body)

    return new Response(JSON.stringify({ recap }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: 'Failed to generate recap' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
