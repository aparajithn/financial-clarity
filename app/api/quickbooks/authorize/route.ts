import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { QuickBooksClient } from '@/lib/quickbooks'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Generate state for CSRF protection
    const state = crypto.randomUUID()
    
    // Store state in session/cookie for verification
    const response = NextResponse.redirect(
      new QuickBooksClient().getAuthUrl(state)
    )
    
    response.cookies.set('qb_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    })
    
    return response
  } catch (error) {
    console.error('QuickBooks authorize error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate QuickBooks authorization' },
      { status: 500 }
    )
  }
}
