import config from '@payload-config'
import Image from 'next/image'
import Link from 'next/link'
import { connection } from 'next/server'
import { getPayload } from 'payload'

import { BookCover } from '@/components/BookCover'
import type { Media } from '@/payload-types'

const listingLabels = { sell: 'For sale', rent: 'For rent', exchange: 'For exchange' } as const

export default async function Home({ searchParams }: PageProps<'/'>) {
  // Render per request so newly approved books appear without a redeploy.
  await connection()
  const { checkoutError } = await searchParams

  const payload = await getPayload({ config })
  const { docs: books } = await payload.find({
    collection: 'books',
    // Enforce the collection's public read rule, not just this filter.
    overrideAccess: false,
    where: { status: { equals: 'approved' } },
    select: { title: true, author: true, price: true, listingType: true, coverPhoto: true, coverColor: true },
    depth: 1,
    sort: '-createdAt',
    limit: 100,
  })

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Books</h1>
        <Link href="/submit" className="underline">
          Submit a book
        </Link>
      </div>

      {typeof checkoutError === 'string' && (
        <p className="mt-6 rounded bg-red-50 p-4 text-red-800">{checkoutError}</p>
      )}

      {books.length === 0 ? (
        <p className="mt-8 text-zinc-600">No books listed yet.</p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
          {books.map((book) => {
            const cover = typeof book.coverPhoto === 'object' ? (book.coverPhoto as Media) : null
            return (
              <li key={book.id}>
                {/* An uploaded photo wins; otherwise fall back to the generated cover. */}
                {cover?.url ? (
                  <Image
                    src={cover.url}
                    alt={cover.alt}
                    width={cover.width ?? 300}
                    height={cover.height ?? 450}
                    className="aspect-[2/3] w-full rounded-sm object-cover shadow-md"
                  />
                ) : (
                  <BookCover title={book.title} author={book.author} color={book.coverColor} />
                )}
                <h2 className="mt-2 font-medium">{book.title}</h2>
                <p className="text-sm text-zinc-600">{book.author}</p>
                <p className="text-sm">
                  {listingLabels[book.listingType]}
                  {book.listingType !== 'exchange' && book.price != null && ` · €${book.price.toFixed(2)}`}
                </p>
                {book.listingType === 'exchange' ? (
                  <p className="mt-2 text-xs text-zinc-500">
                    Exchange listings are for a future exchange feature and aren&apos;t active yet.
                  </p>
                ) : (
                  <form action="/api/checkout" method="post" className="mt-2">
                    <input type="hidden" name="bookId" value={book.id} />
                    <button type="submit" className="rounded bg-black px-3 py-1.5 text-sm text-white">
                      {book.listingType === 'rent' ? 'Rent' : 'Buy'}
                    </button>
                  </form>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
