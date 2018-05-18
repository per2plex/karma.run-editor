export function createIntervalTimer(timeoutMs: number, callback: () => Promise<boolean> | boolean) {
  let startTime = performance.now()
  let shouldContinue = true

  const loop = async () => {
    if (!shouldContinue) return
    const deltaTime = performance.now() - startTime

    if (deltaTime >= timeoutMs) {
      const maybePromise = callback()

      if (maybePromise instanceof Promise) {
        shouldContinue = await maybePromise
      } else {
        shouldContinue = maybePromise
      }

      startTime = performance.now()
    }

    if (shouldContinue) requestAnimationFrame(loop)
  }

  requestAnimationFrame(loop)

  return () => {shouldContinue = false}
}
