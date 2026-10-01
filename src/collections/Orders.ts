import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'stripeSessionId',
    defaultColumns: ['book', 'listingType', 'amount', 'status', 'createdAt'],
  },
  access: {
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
    // Orders are only created by server-side code (the checkout route), never through Payload's API.
    create: () => false,
  },
  fields: [
    {
      name: 'book',
      type: 'relationship',
      relationTo: 'books',
      required: true,
    },
    {
      name: 'buyerEmail',
      type: 'text',
      admin: {
        description: 'Collected by Stripe Checkout; filled in once payment is confirmed.',
      },
    },
    {
      name: 'listingType',
      type: 'select',
      required: true,
      options: [
        { label: 'Sell', value: 'sell' },
        { label: 'Rent', value: 'rent' },
      ],
      admin: {
        description: 'Copied from the book when the order was placed.',
      },
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      admin: {
        description: 'In EUR, copied from the book price when the order was placed.',
      },
    },
    {
      name: 'stripeSessionId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
