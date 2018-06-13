/**
 * Expose obj as global variable on window.
 */
export function expose(key: string, obj: any) {
  const global = window as any
  global[key] = obj
}
