export function extractFormValues(
  form: HTMLFormElement,
  keys: readonly string[]
): Record<string, string> {
  const fd = new FormData(form)
  const result: Record<string, string> = {}

  for (const key of keys) {
    const raw = fd.get(key)
    result[key] = typeof raw === 'string' ? raw : ''
  }

  return result
}
