import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminField, isAdminOrApproved } from '../access/isAdmin'
import { coverColors, defaultCoverColor } from '../lib/coverColors'

export const Books: CollectionConfig = {
  slug: 'books',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'listingType', 'price', 'status'],
  },
  access: {
    read: isAdminOrApproved,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [
      // Clear fields that don't apply to the chosen listing type, so a book
      // switched from "sell" to "exchange" doesn't keep a stale price.
      ({ data }) => {
        if (!data?.listingType) return data
        if (data.listingType === 'exchange') data.price = null
        if (data.listingType !== 'exchange') data.desiredExchangeFor = null
        if (data.listingType === 'sell') data.returnBy = null
        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'author',
      type: 'text',
      required: true,
    },
    {
      name: 'listingType',
      type: 'select',
      required: true,
      options: [
        { label: 'Sell', value: 'sell' },
        { label: 'Rent', value: 'rent' },
        { label: 'Exchange', value: 'exchange' },
      ],
    },
    {
      name: 'price',
      type: 'number',
      min: 0,
      admin: {
        condition: (_, siblingData) => ['sell', 'rent'].includes(siblingData?.listingType),
      },
      validate: (value: number | null | undefined, { siblingData }: { siblingData: { listingType?: string } }) => {
        if (['sell', 'rent'].includes(siblingData?.listingType ?? '') && (value === null || value === undefined)) {
          return 'A price is required for books listed to sell or rent.'
        }
        return true
      },
    },
    {
      name: 'desiredExchangeFor',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.listingType === 'exchange',
        description: 'What the owner would like in exchange for this book.',
      },
    },
    {
      name: 'returnBy',
      type: 'date',
      admin: {
        condition: (_, siblingData) => ['rent', 'exchange'].includes(siblingData?.listingType),
        date: { pickerAppearance: 'dayOnly' },
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      maxLength: 500,
    },
    {
      name: 'condition',
      type: 'select',
      required: true,
      options: [
        { label: 'New', value: 'new' },
        { label: 'Like new', value: 'like-new' },
        { label: 'Good', value: 'good' },
        { label: 'Worn', value: 'worn' },
      ],
    },
    {
      name: 'coverPhoto',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Optional. When set, this photo is shown instead of the generated cover.',
      },
    },
    {
      name: 'coverColor',
      type: 'select',
      required: true,
      defaultValue: defaultCoverColor,
      options: Object.entries(coverColors).map(([value, { label }]) => ({ label, value })),
      admin: {
        description: 'Used for the generated cover (title and author on this colour) when there is no cover photo.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
      ],
      access: {
        create: isAdminField,
        update: isAdminField,
      },
      admin: {
        position: 'sidebar',
        components: {
          // Editable dropdown in the list view, so books can be approved without opening them.
          Cell: '/components/admin/BookStatusCell#BookStatusCell',
        },
      },
    },
    {
      name: 'submitterEmail',
      type: 'text',
      access: {
        // Internal reference only: never exposed to public visitors.
        read: isAdminField,
        create: isAdminField,
        update: isAdminField,
      },
      admin: {
        position: 'sidebar',
        description: 'Internal reference only. Not shown on the public site.',
      },
    },
  ],
}
