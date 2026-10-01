import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Payment processing',
}

// Deliberately does not touch the order: reaching this page is not proof of payment.
// The order is marked paid only when Stripe's verified webhook arrives.
export default function OrderSuccessPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Thanks for your order!</h1>
      <p className="mt-4 text-zinc-600">
        Your payment is being processed. Your order will be confirmed as soon as Stripe confirms the
        payment.
      </p>
      <Link href="/" className="mt-8 inline-block underline">
        Back to books
      </Link>
    </main>
  )
}
