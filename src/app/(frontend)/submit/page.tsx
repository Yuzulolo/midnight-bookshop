import type { Metadata } from 'next'

import { SubmitBookForm } from './SubmitBookForm'

export const metadata: Metadata = {
  title: 'Submit a book',
}

export default function SubmitPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Submit a book</h1>
      <p className="mt-2 text-zinc-600">
        Listings are reviewed before they appear on the site.
      </p>
      <SubmitBookForm />
    </main>
  )
}
