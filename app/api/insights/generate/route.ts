import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { QuickBooksClient } from '@/lib/quickbooks'
import { XeroClient } from '@/lib/xero'
import { InsightsGenerator } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { insightType, params } = body

    // Get user's connections
    const { data: connections, error: connError } = await supabase
      .from('connections')
      .select('*')
      .eq('user_id', user.id)

    if (connError || !connections || connections.length === 0) {
      return NextResponse.json(
        { error: 'No accounting software connected' },
        { status: 400 }
      )
    }

    // Use the first available connection
    const connection = connections[0]
    
    // Fetch financial data
    let financialData
    
    if (connection.provider === 'quickbooks') {
      const qbClient = new QuickBooksClient()
      financialData = await qbClient.getFinancialData(
        connection.access_token,
        connection.realm_id
      )
    } else if (connection.provider === 'xero') {
      const xeroClient = new XeroClient()
      financialData = await xeroClient.getFinancialData(
        connection.access_token,
        connection.tenant_id
      )
    } else {
      return NextResponse.json(
        { error: 'Unsupported provider' },
        { status: 400 }
      )
    }

    // Generate insights
    const generator = new InsightsGenerator()
    let insight

    switch (insightType) {
      case 'cash_runway':
        insight = await generator.generateCashRunway(financialData)
        break
      case 'burn_rate':
        insight = await generator.generateBurnRate(financialData)
        break
      case 'profit_margin':
        insight = await generator.generateProfitMargin(financialData)
        break
      case 'hiring_impact':
        if (!params?.annualSalary) {
          return NextResponse.json(
            { error: 'Annual salary required for hiring impact' },
            { status: 400 }
          )
        }
        insight = await generator.generateHiringImpact(
          financialData,
          params.annualSalary
        )
        break
      case 'custom':
        if (!params?.question) {
          return NextResponse.json(
            { error: 'Question required for custom insight' },
            { status: 400 }
          )
        }
        insight = await generator.generateCustomInsight(
          financialData,
          params.question
        )
        break
      case 'all':
        const allInsights = await generator.generateAllInsights(financialData)
        
        // Save all insights to database
        for (const ins of allInsights) {
          await supabase.from('insights').insert({
            user_id: user.id,
            insight_type: ins.type,
            insight_title: ins.title,
            insight_text: ins.text,
            data_snapshot: ins.data,
          })
        }
        
        return NextResponse.json({ insights: allInsights })
      default:
        return NextResponse.json(
          { error: 'Invalid insight type' },
          { status: 400 }
        )
    }

    // Save insight to database
    const { data: savedInsight, error: saveError } = await supabase
      .from('insights')
      .insert({
        user_id: user.id,
        insight_type: insight.type,
        insight_title: insight.title,
        insight_text: insight.text,
        data_snapshot: insight.data,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Failed to save insight:', saveError)
    }

    return NextResponse.json({ insight })
  } catch (error) {
    console.error('Insights generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}
