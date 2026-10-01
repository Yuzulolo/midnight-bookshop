// Cover colours for the generated book covers. Shared by the Books collection,
// the submit form and the cover component so they can't drift apart.
export const coverColors = {
  oxblood: { label: 'Oxblood', background: '#6b1d24', ink: '#e8c77e' },
  navy: { label: 'Navy', background: '#1c2a4a', ink: '#e3c47a' },
  forest: { label: 'Forest', background: '#1f3d2e', ink: '#e0c47f' },
  plum: { label: 'Plum', background: '#4a2445', ink: '#e6c98a' },
  ochre: { label: 'Ochre', background: '#b7802b', ink: '#2a1c0c' },
  teal: { label: 'Teal', background: '#1e5157', ink: '#ecd9a6' },
  charcoal: { label: 'Charcoal', background: '#2b2b2b', ink: '#d9bf7f' },
  cream: { label: 'Cream', background: '#efe6d2', ink: '#5a1f1f' },
} as const

export type CoverColor = keyof typeof coverColors

export const defaultCoverColor: CoverColor = 'navy'

export const isCoverColor = (value: unknown): value is CoverColor =>
  typeof value === 'string' && Object.hasOwn(coverColors, value)
