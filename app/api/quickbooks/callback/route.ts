import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { QuickBooksClient } from '@/lib/quickbooks'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const realmId = searchParams.get('realmId')
    
    // Verify state
    const storedState = request.cookies.get('qb_oauth_state')?.value
    
    if (!code || !state || !realmId || state !== storedState) {
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
    const qbClient = new QuickBooksClient()
    const tokens = await qbClient.getTokens(code)
    
    // Calculate expiry time
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    // Store connection in database
    const { error: dbError } = await supabase
      .from('connections')
      .upsert({
        user_id: user.id,
        provider: 'quickbooks',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        realm_id: realmId,
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
      new URL('/dashboard?connected=quickbooks', request.url)
    )
    response.cookies.delete('qb_oauth_state')
    
    return response
  } catch (error) {
    console.error('QuickBooks callback error:', error)
    return NextResponse.redirect(
      new URL('/dashboard?error=quickbooks_connection_failed', request.url)
    )
  }
}
