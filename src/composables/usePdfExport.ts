import { ref } from 'vue'
import type { jsPDF } from 'jspdf'

/** PDF を作ってダウンロードする処理の、作成中フラグとエラー表示をまとめたもの */
export function usePdfExport() {
  const generating = ref(false)
  const error = ref<string | null>(null)

  async function exportPdf(create: () => Promise<jsPDF>, filename: string) {
    error.value = null
    generating.value = true
    try {
      const doc = await create()
      doc.save(filename)
    } catch (err) {
      error.value = `PDFを作成できませんでした: ${err instanceof Error ? err.message : String(err)}`
    } finally {
      generating.value = false
    }
  }

  return { generating, error, exportPdf }
}

/** 公開アセットのフォントの置き場所（GitHub Pages のサブパスに対応） */
export const FONT_BASE_URL = `${import.meta.env.BASE_URL}fonts/`
