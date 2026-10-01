import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

// Server-only: never import this from a client component.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
