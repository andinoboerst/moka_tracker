import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { calculateBrewRatio, calculateExtractionRatio } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('brews')
      .select(
        `
        *,
        beans (*),
        grinders (*),
        moka_pots (*)
      `
      )
      .eq('user_id', user.id)
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
    const {
      data: { user },
    } = await supabase.auth.getUser()

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
      vibe_rating === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate ratios
    const brew_ratio_input = calculateBrewRatio(coffee_weight_g, water_added_g)
    const extraction_ratio_output = calculateExtractionRatio(
      coffee_weight_g,
      final_yield_g
    )

    // Generate AI recap
    let ai_recap = ''
    try {
      const recapResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-recap`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            vibe_rating,
            tasting_notes,
            coffee_weight_g,
            water_added_g,
            final_yield_g,
            brew_ratio_input,
            extraction_ratio_output,
          }),
        }
      )

      if (recapResponse.ok) {
        const recapData = await recapResponse.json()
        ai_recap = recapData.recap || ''
      }
    } catch (error) {
      console.error('Error generating AI recap:', error)
      // Continue without recap if generation fails
    }

    const { data, error } = await supabase
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
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('brews')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
