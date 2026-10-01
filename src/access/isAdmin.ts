import type { Access, FieldAccess } from 'payload'

// The `users` collection is the admin panel's auth collection, and new users can
// only be created by an existing logged-in user, so any authenticated user is an admin.
export const isAdmin: Access = ({ req }) => Boolean(req.user)

export const isAdminField: FieldAccess = ({ req }) => Boolean(req.user)

// Admins see every book; everyone else only sees approved ones.
export const isAdminOrApproved: Access = ({ req }) => {
  if (req.user) return true

  return {
    status: { equals: 'approved' },
  }
}
