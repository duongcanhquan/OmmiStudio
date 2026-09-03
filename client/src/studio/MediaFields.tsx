import { ImagePlus, Trash2 } from 'lucide-react'
import { logoToDataUrl, photoToDataUrl } from '../lib/mediaFiles'

export function MediaFields({
  logo,
  photos,
  onLogo,
  onPhotos,
  compact,
}: {
  logo?: string
  photos: string[]
  onLogo: (src: string | undefined) => void
  onPhotos: (srcs: string[]) => void
  compact?: boolean
}) {
  async function pickLogo(file: File | undefined) {
    if (!file) return
    onLogo(await logoToDataUrl(file))
  }

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return
    const next = [...photos]
    for (const file of Array.from(files)) {
      if (next.length >= 3) break
      next.push(await photoToDataUrl(file))
    }
    onPhotos(next.slice(0, 3))
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Logo
        </p>
        <div className="flex items-center gap-3">
          {logo ? (
            <img
              src={logo}
              alt=""
              className="h-12 w-auto max-w-[7rem] rounded-lg bg-white object-contain p-1"
            />
          ) : (
            <span className="flex size-12 items-center justify-center rounded-lg border border-dashed border-slate-700 text-slate-600">
              <ImagePlus className="size-5" aria-hidden />
            </span>
          )}
          <label className="cursor-pointer text-sm text-cyan-300 hover:text-cyan-200">
            {logo ? 'Đổi logo' : 'Tải logo'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={(e) => void pickLogo(e.target.files?.[0])}
            />
          </label>
          {logo && (
            <button
              type="button"
              className="text-xs text-slate-500 hover:text-rose-300"
              onClick={() => onLogo(undefined)}
            >
              Gỡ
            </button>
          )}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Ảnh bài (tối đa 3)
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {photos.map((src, index) => (
            <div key={`${src.slice(0, 24)}-${index}`} className="relative">
              <img
                src={src}
                alt=""
                className="size-16 rounded-lg object-cover ring-1 ring-white/10"
              />
              <button
                type="button"
                aria-label="Gỡ ảnh"
                className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-slate-950 text-slate-300 ring-1 ring-slate-700 hover:text-rose-300"
                onClick={() => onPhotos(photos.filter((_, i) => i !== index))}
              >
                <Trash2 className="size-3" aria-hidden />
              </button>
            </div>
          ))}
          {photos.length < 3 && (
            <label className="flex size-16 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 text-[10px] text-slate-500 hover:border-cyan-500/40 hover:text-cyan-300">
              <ImagePlus className="mb-0.5 size-4" aria-hidden />
              Thêm
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="sr-only"
                onChange={(e) => void addPhotos(e.target.files)}
              />
            </label>
          )}
        </div>
      </div>
    </div>
  )
}
