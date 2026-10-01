import config from '@payload-config'
import { getPayload } from 'payload'
import type Stripe from 'stripe'

import { stripe } from '@/lib/stripe'

// The only place in the app that marks an order paid. Every event is signature-verified
// against STRIPE_WEBHOOK_SECRET before anything is read from it.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return Response.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return Response.json({ error: 'Missing Stripe-Signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    // Verification needs the exact raw body, so read it as text rather than JSON.
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret)
  } catch {
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed':
    // Delayed payment methods (e.g. bank debits) complete while still unpaid and
    // confirm later with this event, so it goes through the same paid check.
    case 'checkout.session.async_payment_succeeded':
      return markOrderPaid(event.data.object)
    default:
      return Response.json({ received: true })
  }
}

async function markOrderPaid(session: Stripe.Checkout.Session) {
  if (session.payment_status === 'unpaid') {
    return Response.json({ received: true })
  }

  const payload = await getPayload({ config })

  try {
    const { docs } = await payload.update({
      collection: 'orders',
      // Filtering on pending makes redelivered events a no-op.
      where: {
        stripeSessionId: { equals: session.id },
        status: { equals: 'pending' },
      },
      data: {
        status: 'paid',
        buyerEmail: session.customer_details?.email ?? undefined,
      },
    })

    if (docs.length === 0) {
      payload.logger.warn(`No pending order found for Stripe session ${session.id}`)
    }
  } catch (error) {
    // A 500 makes Stripe retry the event later.
    payload.logger.error({ err: error }, `Failed to mark order paid for Stripe session ${session.id}`)
    return Response.json({ error: 'Failed to update order' }, { status: 500 })
  }

  return Response.json({ received: true })
}
