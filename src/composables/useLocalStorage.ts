import { ref, watch, type Ref } from 'vue'

/**
 * localStorage と同期する ref。
 * 読み込んだ値は normalize で現在の形にそろえる（項目が増えても既存データを捨てずに済むように）。
 * normalize が undefined を返したら defaultValue を使う。
 * 保存に失敗した場合（容量超過など）は error にメッセージを入れる。値はメモリ上には残る。
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  normalize: (value: unknown) => T | undefined,
): { state: Ref<T>; error: Ref<string | null> } {
  const error = ref<string | null>(null)
  const state = ref(load()) as Ref<T>

  function load(): T {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return defaultValue
      return normalize(JSON.parse(raw)) ?? defaultValue
    } catch {
      return defaultValue
    }
  }

  watch(
    state,
    (value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value))
        error.value = null
      } catch {
        error.value =
          'ブラウザに保存できませんでした（容量超過の可能性があります）。リロードすると一部のデータが消えます。'
      }
    },
    { deep: true },
  )

  return { state, error }
}
