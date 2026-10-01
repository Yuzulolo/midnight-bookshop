import config from '@payload-config'
import { getPayload, ValidationError } from 'payload'

import { isCoverColor } from '@/lib/coverColors'
import type { Book } from '@/payload-types'

const MAX_FILE_BYTES = 4 * 1024 * 1024 // stays under Vercel's 4.5 MB request body limit

const text = (form: FormData, key: string): string | undefined => {
  const value = form.get(key)
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

// Public submission endpoint. It uses the Local API with its default elevated access,
// so it must only ever copy the whitelisted fields below and always force `status`.
export async function POST(request: Request) {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return Response.json({ error: 'Expected a multipart form submission.' }, { status: 400 })
  }

  const submitterEmail = text(form, 'submitterEmail')
  if (!submitterEmail) {
    return Response.json({ error: 'Your email is required.' }, { status: 400 })
  }

  const coverColor = text(form, 'coverColor')
  if (!isCoverColor(coverColor)) {
    return Response.json({ error: 'Please choose a cover colour.' }, { status: 400 })
  }

  // The cover photo is optional: without one, the site shows a generated cover.
  const coverFile = form.get('coverPhoto')
  const cover = coverFile instanceof File && coverFile.size > 0 ? coverFile : null
  if (cover && !cover.type.startsWith('image/')) {
    return Response.json({ error: 'The cover photo must be an image.' }, { status: 400 })
  }
  if (cover && cover.size > MAX_FILE_BYTES) {
    return Response.json({ error: 'The cover photo must be 4 MB or smaller.' }, { status: 400 })
  }

  const priceRaw = text(form, 'price')
  const price = priceRaw === undefined ? undefined : Number(priceRaw)
  if (price !== undefined && Number.isNaN(price)) {
    return Response.json({ error: 'Price must be a number.' }, { status: 400 })
  }

  const title = text(form, 'title')
  const payload = await getPayload({ config })

  const media = cover
    ? await payload.create({
        collection: 'media',
        data: { alt: title ? `Cover of ${title}` : 'Book cover' },
        file: {
          data: Buffer.from(await cover.arrayBuffer()),
          mimetype: cover.type,
          name: cover.name,
          size: cover.size,
        },
      })
    : null

  try {
    const book = await payload.create({
      collection: 'books',
      data: {
        title: title as string,
        author: text(form, 'author') as string,
        listingType: text(form, 'listingType') as Book['listingType'],
        price,
        desiredExchangeFor: text(form, 'desiredExchangeFor'),
        returnBy: text(form, 'returnBy'),
        description: text(form, 'description') as string,
        condition: text(form, 'condition') as Book['condition'],
        coverPhoto: media?.id,
        coverColor,
        submitterEmail,
        // Never taken from the client.
        status: 'pending',
      },
    })

    return Response.json({ id: book.id }, { status: 201 })
  } catch (error) {
    // Don't leave an orphaned upload behind when the book itself is invalid.
    if (media) await payload.delete({ collection: 'media', id: media.id })

    if (error instanceof ValidationError) {
      const fields = error.data.errors.map((e) => e.label ?? e.path).join(', ')
      return Response.json({ error: `Please check these fields: ${fields}.` }, { status: 400 })
    }
    payload.logger.error({ err: error }, 'Book submission failed')
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
