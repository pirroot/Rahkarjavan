// Auth.js v5 (NextAuth) configuration
// پایگاه خبری راهکار جوان
//
// Supported providers (env-based):
//   - Credentials (email/password) — always enabled
//   - Google OAuth — set AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET
//   - GitHub OAuth — set AUTH_GITHUB_ID + AUTH_GITHUB_SECRET
//   - Magic Link (Email) — set AUTH_RESEND_KEY or SMTP_* vars
//
// Required env vars:
//   AUTH_SECRET=<random-32-bytes>  (run: openssl rand -base64 32)
//   AUTH_TRUST_HOST=true

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import Resend from 'next-auth/providers/resend'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Prisma adapter handles user/account/session storage for OAuth
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt', // use JWT for credentials provider (db sessions for OAuth)
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/#/auth', // our custom auth page (SPA hash route)
  },
  providers: [
    // 1. Credentials (email + password) — validates against our existing users
    Credentials({
      id: 'credentials',
      name: 'ورود با ایمیل',
      credentials: {
        email: { label: 'ایمیل', type: 'email' },
        password: { label: 'رمز عبور', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await db.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        })
        if (!user || !user.password) return null

        const valid = await bcrypt.compare(parsed.data.password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.displayName || user.name || user.email,
          image: user.avatar,
          role: user.role,
        }
      },
    }),

    // 2. Google OAuth — activates when env vars are present
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [Google({ allowDangerousEmailAccountLinking: true })]
      : []),

    // 3. GitHub OAuth — activates when env vars are present
    ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
      ? [GitHub({ allowDangerousEmailAccountLinking: true })]
      : []),

    // 4. Magic Link via Resend — activates when API key is present
    ...(process.env.AUTH_RESEND_KEY
      ? [Resend({
          from: process.env.AUTH_EMAIL_FROM || 'noreply@rahkarjavan.ir',
        })]
      : []),
  ],
  callbacks: {
    // Inject role + user id into JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role || 'USER'
      }
      return token
    },
    // Inject role + user id into session
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role as string
      }
      return session
    },
    // Redirect to admin or profile after sign in
    async redirect({ url, baseUrl }) {
      // Allow relative URLs only (security)
      if (url.startsWith('/')) return `${baseUrl}/#${url.startsWith('/') ? url.slice(1) : url}`
      if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/`
    },
  },
  debug: process.env.NODE_ENV === 'development',
})

// Helper: get available providers for the auth page UI
export function getAvailableProviders() {
  const providers: { id: string; name: string; type: 'credentials' | 'oauth' | 'email' }[] = [
    { id: 'credentials', name: 'ایمیل و رمز عبور', type: 'credentials' },
  ]
  if (process.env.AUTH_GOOGLE_ID) providers.push({ id: 'google', name: 'Google', type: 'oauth' })
  if (process.env.AUTH_GITHUB_ID) providers.push({ id: 'github', name: 'GitHub', type: 'oauth' })
  if (process.env.AUTH_RESEND_KEY) providers.push({ id: 'resend', name: 'Magic Link', type: 'email' })
  return providers
}
