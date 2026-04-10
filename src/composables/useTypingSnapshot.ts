export function useTypingSnapshot(pushSnapshot: () => void) {
  let isTypingBurst = false
  let burstEndTimer: ReturnType<typeof setTimeout> | null = null

  function onTypingStart() {
    if (!isTypingBurst) {
      pushSnapshot()
      isTypingBurst = true
    }
    if (burstEndTimer) clearTimeout(burstEndTimer)
    burstEndTimer = setTimeout(() => { isTypingBurst = false }, 1000)
  }

  return { onTypingStart }
}
