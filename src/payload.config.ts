import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Books } from './collections/Books'
import { Media } from './collections/Media'
import { Orders } from './collections/Orders'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Books, Orders],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [
    // Without book_READ_WRITE_TOKEN the plugin disables itself and Media
    // falls back to local disk storage in /media, so local dev works as before.
    vercelBlobStorage({
      enabled: Boolean(process.env.book_READ_WRITE_TOKEN),
      // Keep the DB schema identical whether or not Blob is enabled.
      alwaysInsertFields: true,
      collections: {
        media: true,
      },
      token: process.env.book_READ_WRITE_TOKEN,
    }),
  ],
})
