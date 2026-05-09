import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { calculateBrewRatio, calculateExtractionRatio } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    const {
      data: { user },
    } = await supabase.auth.getUser(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create a client with the user's token so RLS policies work
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    const { data, error } = await userClient
      .from('brews')
      .select(
        `
        *,
        beans (*),
        grinders (*),
        moka_pots (*)
      `
      )
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    const {
      data: { user },
    } = await supabase.auth.getUser(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      bean_id,
      grinder_id,
      moka_pot_id,
      grinder_setting,
      coffee_weight_g,
      water_added_g,
      final_yield_g,
      extraction_time_s,
      milk_added_g,
      vibe_rating,
      tasting_notes,
    } = body

    // Validate required fields
    if (
      !bean_id ||
      !grinder_id ||
      !moka_pot_id ||
      grinder_setting === undefined ||
      coffee_weight_g === undefined ||
      water_added_g === undefined ||
      final_yield_g === undefined ||
      extraction_time_s === undefined ||
      vibe_rating === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create a client with the user's token so we can query history and insert
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    // Calculate ratios
    const brew_ratio_input = calculateBrewRatio(coffee_weight_g, water_added_g)
    const extraction_ratio_output = calculateExtractionRatio(
      coffee_weight_g,
      final_yield_g
    )

    // Fetch up to 3 previous brews with exactly the same beans, grinder, and moka pot
    const { data: previousBrews } = await userClient
      .from('brews')
      .select('*')
      .eq('bean_id', bean_id)
      .eq('grinder_id', grinder_id)
      .eq('moka_pot_id', moka_pot_id)
      .order('created_at', { ascending: false })
      .limit(3)

    let historyText = 'No previous brews with this exact setup.'
    if (previousBrews && previousBrews.length > 0) {
      historyText = previousBrews.map((b, i) => `
Previous Brew ${i + 1}:
- Vibe Rating: ${b.vibe_rating}/10
- Grinder Setting: ${b.grinder_setting} clicks
- Coffee/Water/Yield: ${b.coffee_weight_g}g / ${b.water_added_g}g / ${b.final_yield_g}g
- Extraction Time: ${b.extraction_time_s}s
- Tasting Notes: "${b.tasting_notes || 'None'}"`).join('\n')
    }

    // Generate AI recap via Mistral directly
    let ai_recap = ''
    try {
      const mistralApiKey = process.env.MISTRAL_API_KEY
      
      if (mistralApiKey) {
        const prompt = `You are a coffee brewing expert analyzing a moka pot brew. 
Analyze the following CURRENT brew details, and consider the HISTORY of previous brews with this exact same setup, to provide a JSON response with two specific keys:

1. "summary": A short, 1-2 sentence recap explaining exactly WHY the CURRENT brew came out the way it did based on the extraction ratios and tasting notes. DO NOT include any advice or suggestions for the next brew here.
2. "suggestion": A single, highly actionable sentence giving clear, exact instructions on what variable to change (and to what) for their NEXT brew. Base this heavily on what has and hasn't worked in their previous brews (if any exist).

CURRENT Brew Details:
- Vibe Rating: ${vibe_rating}/10
- Grinder Setting: ${grinder_setting} clicks
- Tasting Notes: "${tasting_notes || 'None provided'}"
- Coffee: ${coffee_weight_g}g
- Water In: ${water_added_g}g
- Yield: ${final_yield_g}g
- Extraction Time: ${extraction_time_s} seconds
- Milk Added: ${milk_added_g ? `${milk_added_g}g` : 'None (Black Coffee)'}
- Brew Ratio: 1:${brew_ratio_input}
- Extraction Ratio: 1:${extraction_ratio_output}

HISTORY (Last 3 brews with this Bean + Grinder + Moka Pot):
${historyText}

Rules:
- If rating is low (≤5) and notes mention "bitter", suggest finer grind or lower heat for the next brew.
- If notes mention "sour", suggest coarser grind or higher heat for the next brew.
- YOU MUST RETURN A VALID JSON OBJECT WITH EXACTLY TWO KEYS: "summary" and "suggestion".
- Do not use markdown blocks around the JSON. Just return raw JSON.

Example Response:
{"summary": "The brew extracted too quickly, leading to a sour profile due to under-extraction at a 1:1.7 ratio.", "suggestion": "For your next brew, adjust your grinder 1-2 clicks finer to slow down the extraction and increase sweetness."}`

        const recapResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mistralApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'mistral-small-latest',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            response_format: { type: 'json_object' }
          }),
        })

        if (recapResponse.ok) {
          const mistralData = await recapResponse.json()
          let content = mistralData.choices?.[0]?.message?.content?.trim() || ''
          
          // Strip markdown code blocks if Mistral returned them
          if (content.startsWith('```json')) {
            content = content.replace(/^```json\n/, '').replace(/\n```$/, '')
          } else if (content.startsWith('```')) {
            content = content.replace(/^```\n/, '').replace(/\n```$/, '')
          }

          try {
            // Verify it's valid JSON before saving
            JSON.parse(content)
            ai_recap = content
          } catch (parseError) {
            console.error('Mistral returned invalid JSON:', content)
            // Leave ai_recap empty so fallback runs
          }
        } else {
          console.error('Mistral API error:', await recapResponse.text())
        }
      }
      
      // Fallback generator if Mistral fails or no key
      if (!ai_recap) {
        let summary = ''
        let suggestion = ''

        if (vibe_rating <= 3) {
          summary = `Room for improvement here. Your extraction ratio of 1:${extraction_ratio_output} suggests an unbalanced extraction.`
          if ((tasting_notes || '').toLowerCase().includes('bitter')) {
            summary = `This brew came out bitter due to over-extraction. Your extraction ratio was 1:${extraction_ratio_output}.`
            suggestion = `For your next brew, try increasing your grinder setting (coarser) or reducing heat slightly to prevent bitterness.`
          } else if ((tasting_notes || '').toLowerCase().includes('sour')) {
            summary = `The sourness indicates under-extraction. A brew ratio of 1:${brew_ratio_input} might be too high for your setup.`
            suggestion = `For your next brew, use a finer grind setting to increase brew time and extraction.`
          } else {
            suggestion = `Experiment with grinder adjustments and brew time to dial in the perfect extraction next time.`
          }
        } else if (vibe_rating <= 6) {
          summary = `Solid brew! Your 1:${brew_ratio_input} brew ratio produced a yield of 1:${extraction_ratio_output}.`
          suggestion = `Small tweaks to your grinder setting could refine the profile further for your next cup.`
        } else {
          summary = `Excellent work! This brew hit the mark with a great vibe rating.`
          suggestion = `Your ${brew_ratio_input}:1 water ratio and ${extraction_ratio_output}:1 extraction ratio are well-balanced. Keep these exact settings consistent for your next brew!`
        }
        ai_recap = JSON.stringify({ summary, suggestion })
      }
    } catch (error) {
      console.error('Error generating AI recap:', error)
      // We will save with empty string or continue without crashing
    }

    const { data, error } = await userClient
      .from('brews')
      .insert([
        {
          user_id: user.id,
          bean_id,
          grinder_id,
          moka_pot_id,
          grinder_setting,
          coffee_weight_g: parseFloat(coffee_weight_g),
          water_added_g: parseFloat(water_added_g),
          final_yield_g: parseFloat(final_yield_g),
          extraction_time_s: parseInt(extraction_time_s),
          milk_added_g: milk_added_g ? parseFloat(milk_added_g) : null,
          brew_ratio_input,
          extraction_ratio_output,
          vibe_rating: parseInt(vibe_rating),
          tasting_notes: tasting_notes || '',
          ai_recap,
        },
      ])
      .select(
        `
        *,
        beans (*),
        grinders (*),
        moka_pots (*)
      `
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    const {
      data: { user },
    } = await supabase.auth.getUser(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    // Create a client with the user's token so RLS policies work
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    const { error } = await userClient
      .from('brews')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
