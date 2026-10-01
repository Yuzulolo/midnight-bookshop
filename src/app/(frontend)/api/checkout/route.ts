import config from '@payload-config'
import { getPayload } from 'payload'

import { stripe } from '@/lib/stripe'

// Tags these sessions in the Stripe Dashboard so this checkout flow can be tracked.
const INTEGRATION_IDENTIFIER = 'book-shop-checkout-qzmkvtrb'

const redirectHome = (origin: string, error: string) =>
  Response.redirect(`${origin}/?checkoutError=${encodeURIComponent(error)}`, 303)

export async function POST(request: Request) {
  const origin = new URL(request.url).origin
  const form = await request.formData().catch(() => null)
  const bookId = Number(form?.get('bookId'))
  if (!Number.isInteger(bookId)) return redirectHome(origin, 'That book could not be found.')

  const payload = await getPayload({ config })

  // Read as the public would, so only approved books can be bought. The price comes
  // from the database, never from the client.
  const book = await payload
    .findByID({ collection: 'books', id: bookId, depth: 0, overrideAccess: false, disableErrors: true })
    .catch(() => null)

  if (!book || (book.listingType !== 'sell' && book.listingType !== 'rent') || book.price == null) {
    return redirectHome(origin, 'That book is not available to buy or rent.')
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(book.price * 100),
          product_data: {
            name: book.listingType === 'rent' ? `Rent: ${book.title}` : book.title,
            description: `by ${book.author}`,
          },
        },
      },
    ],
    client_reference_id: String(book.id),
    metadata: { bookId: String(book.id), listingType: book.listingType },
    success_url: `${origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/order/cancelled`,
    integration_identifier: INTEGRATION_IDENTIFIER,
  })

  try {
    await payload.create({
      collection: 'orders',
      data: {
        book: book.id,
        listingType: book.listingType,
        amount: book.price,
        stripeSessionId: session.id,
        status: 'pending',
      },
    })
  } catch (error) {
    // Without an order row the payment couldn't be matched up later, so don't let it proceed.
    await stripe.checkout.sessions.expire(session.id).catch(() => {})
    payload.logger.error({ err: error }, 'Failed to create order for checkout session')
    return redirectHome(origin, 'Something went wrong starting checkout. Please try again.')
  }

  return Response.redirect(session.url!, 303)
}
