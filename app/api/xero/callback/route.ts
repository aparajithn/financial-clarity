import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { XeroClient } from '@/lib/xero'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    
    // Verify state
    const storedState = request.cookies.get('xero_oauth_state')?.value
    
    if (!code || !state || state !== storedState) {
      return NextResponse.redirect(
        new URL('/dashboard?error=invalid_oauth_state', request.url)
      )
    }

    const supabase = await createServerSupabaseClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Exchange code for tokens
    const xeroClient = new XeroClient()
    const tokens = await xeroClient.getTokens(code)
    
    // Get tenant (organization) info
    const tenants = await xeroClient.getTenants(tokens.access_token)
    const tenantId = tenants[0]?.tenantId
    
    if (!tenantId) {
      return NextResponse.redirect(
        new URL('/dashboard?error=no_xero_organization', request.url)
      )
    }
    
    // Calculate expiry time
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    // Store connection in database
    const { error: dbError } = await supabase
      .from('connections')
      .upsert({
        user_id: user.id,
        provider: 'xero',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        tenant_id: tenantId,
        expires_at: expiresAt.toISOString(),
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.redirect(
        new URL('/dashboard?error=database_error', request.url)
      )
    }

    // Clear state cookie
    const response = NextResponse.redirect(
      new URL('/dashboard?connected=xero', request.url)
    )
    response.cookies.delete('xero_oauth_state')
    
    return response
  } catch (error) {
    console.error('Xero callback error:', error)
    return NextResponse.redirect(
      new URL('/dashboard?error=xero_connection_failed', request.url)
    )
  }
}
