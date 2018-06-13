export function debounce(fn: () => void, wait: number, immediate: boolean) {
  let timeoutID: number

  return () => {
    const callNow = immediate && !timeoutID
    const later = () => {
      timeoutID = 0
      if (!immediate) fn()
    }

    clearTimeout(timeoutID)
    timeoutID = setTimeout(later, wait)

    if (callNow) fn()
  }
}
