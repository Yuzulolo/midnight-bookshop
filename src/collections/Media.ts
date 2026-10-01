import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    // Cover photos are shown on the public site.
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  upload: {
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
}
