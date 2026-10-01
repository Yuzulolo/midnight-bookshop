import { coverColors, defaultCoverColor, isCoverColor } from '@/lib/coverColors'

type Props = {
  title: string
  author: string
  color?: string | null
  className?: string
}

// Long titles get a smaller type size so they still fit inside the frame.
function titleSize(title: string): string {
  if (title.length > 60) return '8cqw'
  if (title.length > 36) return '9.5cqw'
  if (title.length > 18) return '11cqw'
  return '13cqw'
}

// A classic cloth-bound cover: solid colour, gilt double frame, serif title and author.
// Sizes are in container-query units so the cover scales with whatever width it's given.
export function BookCover({ title, author, color, className = '' }: Props) {
  const { background, ink } = coverColors[isCoverColor(color) ? color : defaultCoverColor]

  return (
    <div
      role="img"
      aria-label={`Cover of ${title || 'Untitled'} by ${author || 'Unknown author'}`}
      className={`relative aspect-[2/3] w-full overflow-hidden rounded-sm font-serif shadow-md [container-type:inline-size] ${className}`}
      style={{ backgroundColor: background, color: ink }}
    >
      {/* Spine shading and a faint sheen, so it reads as a bound book rather than a flat card. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 5%, rgba(255,255,255,0.08) 7%, rgba(0,0,0,0) 12%), radial-gradient(ellipse at 60% 30%, rgba(255,255,255,0.08), rgba(0,0,0,0.15))',
        }}
      />

      <div
        aria-hidden
        className="absolute inset-[6cqw] left-[9cqw] border-solid"
        style={{ borderColor: ink, borderWidth: '0.8cqw' }}
      />
      <div
        aria-hidden
        className="absolute inset-[8.5cqw] left-[11.5cqw] border-solid"
        style={{ borderColor: ink, borderWidth: '0.3cqw' }}
      />

      <div className="absolute inset-[8.5cqw] left-[11.5cqw] flex flex-col items-center px-[6cqw] py-[12cqw] text-center">
        <div className="flex flex-1 flex-col items-center justify-center">
          <p
            className="line-clamp-5 font-semibold leading-[1.1] break-words"
            style={{ fontSize: titleSize(title) }}
          >
            {title || 'Untitled'}
          </p>
          <p aria-hidden className="mt-[5cqw]" style={{ fontSize: '6cqw' }}>
            ❦
          </p>
        </div>
        <p
          className="line-clamp-2 uppercase tracking-[0.15em] break-words"
          style={{ fontSize: '5.5cqw' }}
        >
          {author || 'Unknown author'}
        </p>
      </div>
    </div>
  )
}
