// Available auth providers API
// Returns which OAuth/Magic Link providers are configured

import { NextResponse } from 'next/server'
import { getAvailableProviders } from '../../../../../auth'

export async function GET() {
  return NextResponse.json({
    providers: getAvailableProviders(),
    magicLinkEnabled: !!process.env.AUTH_RESEND_KEY,
    googleEnabled: !!process.env.AUTH_GOOGLE_ID,
    githubEnabled: !!process.env.AUTH_GITHUB_ID,
  })
}
