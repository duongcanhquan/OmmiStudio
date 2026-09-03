/** Nén ảnh trình duyệt → data URL để gửi engine / lưu brand. */

const IMAGE_TYPES = /^image\/(png|jpe?g|webp|gif)$/i

export function isImageFile(file: File): boolean {
  return IMAGE_TYPES.test(file.type)
}

export async function fileToDataUrl(
  file: File,
  maxEdge = 1280,
  quality = 0.78
): Promise<string> {
  if (!isImageFile(file)) {
    throw new Error('Chỉ nhận ảnh PNG, JPEG, WebP hoặc GIF.')
  }
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Không nén được ảnh trên trình duyệt này.')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const jpeg = file.type === 'image/png' && maxEdge <= 400
    ? canvas.toDataURL('image/png')
    : canvas.toDataURL('image/jpeg', quality)
  return jpeg
}

export async function logoToDataUrl(file: File): Promise<string> {
  return fileToDataUrl(file, 360, 0.9)
}

export async function photoToDataUrl(file: File): Promise<string> {
  return fileToDataUrl(file, 1280, 0.76)
}
