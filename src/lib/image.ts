/**
 * 画像ファイルを長辺 maxSize px 以下に縮小し、PNG の dataURL にする。
 * localStorage の容量（約5MB）に収めるための縮小。透過を保つため PNG にする。
 */
export async function resizeImageToDataUrl(file: File, maxSize = 600): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    // サイズ指定のない SVG は naturalWidth が 0 になるため maxSize で描く
    const w = img.naturalWidth || maxSize
    const h = img.naturalHeight || maxSize
    const scale = Math.min(1, maxSize / Math.max(w, h))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(w * scale))
    canvas.height = Math.max(1, Math.round(h * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas が使えません')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('画像を読み込めませんでした'))
    img.src = src
  })
}
