export function autoScroll(node: HTMLElement) {
  const observer = new MutationObserver(() => {
    node.scrollTop = node.scrollHeight
  })

  observer.observe(node, { childList: true, subtree: true })

  return {
    destroy() {
      observer.disconnect()
    },
  }
}
