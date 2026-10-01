import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Checkout cancelled',
}

export default function OrderCancelledPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Checkout cancelled</h1>
      <p className="mt-4 text-zinc-600">No payment was taken. You can try again whenever you like.</p>
      <Link href="/" className="mt-8 inline-block underline">
        Back to books
      </Link>
    </main>
  )
}
