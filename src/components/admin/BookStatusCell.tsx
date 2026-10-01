'use client'

import type { DefaultCellComponentProps, SelectFieldClient } from 'payload'

import { toast, useConfig } from '@payloadcms/ui'
import { useState } from 'react'

// Lets an admin approve or un-approve a book straight from the Books list view.
// The PATCH goes through Payload's REST API with the admin's session cookie, so the
// collection's access rules still decide whether the change is allowed.
export function BookStatusCell({ cellData, field, rowData }: DefaultCellComponentProps<SelectFieldClient>) {
  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()
  const [status, setStatus] = useState(cellData)
  const [saving, setSaving] = useState(false)

  async function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value
    const previous = status
    setStatus(next)
    setSaving(true)

    try {
      const response = await fetch(`${serverURL}${api}/books/${rowData.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      toast.success(`"${rowData.title}" is now ${next}.`)
    } catch {
      setStatus(previous)
      toast.error(`Couldn't update "${rowData.title}". Please try again.`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <select
      aria-label={`Status of ${rowData.title}`}
      value={status}
      disabled={saving}
      onChange={handleChange}
      onClick={(event) => event.stopPropagation()}
    >
      {field.options.map((option) =>
        typeof option === 'string' ? (
          <option key={option} value={option}>
            {option}
          </option>
        ) : (
          <option key={option.value} value={option.value}>
            {typeof option.label === 'string' ? option.label : option.value}
          </option>
        ),
      )}
    </select>
  )
}
