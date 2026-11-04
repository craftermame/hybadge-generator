import { ref, watch, type Ref } from 'vue'

/**
 * localStorage と同期する ref。
 * 保存に失敗した場合（容量超過など）は error にメッセージを入れる。値はメモリ上には残る。
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  isValid: (value: unknown) => value is T,
): { state: Ref<T>; error: Ref<string | null> } {
  const error = ref<string | null>(null)
  const state = ref(load()) as Ref<T>

  function load(): T {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return defaultValue
      const parsed: unknown = JSON.parse(raw)
      return isValid(parsed) ? parsed : defaultValue
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
