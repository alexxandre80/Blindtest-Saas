import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { Resend } from 'resend'
import prisma from '../db.js'

const resend = new Resend(process.env.RESEND_API_KEY)

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.AUTH_BASE_URL || 'http://localhost:3001',
  trustedOrigins: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5173',
  ],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,

    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@example.com',
        to: user.email,
        subject: 'Confirme ton adresse email — Blind Test',
        html: `<p>Clique sur ce lien pour confirmer ton compte :</p>
               <a href="${url}">${url}</a>
               <p>Ce lien expire dans 24h.</p>`,
      })
    },

    sendResetPasswordEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@example.com',
        to: user.email,
        subject: 'Réinitialisation de ton mot de passe — Blind Test',
        html: `<p>Clique sur ce lien pour réinitialiser ton mot de passe :</p>
               <a href="${url}">${url}</a>
               <p>Ce lien expire dans 1h.</p>`,
      })
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
})
