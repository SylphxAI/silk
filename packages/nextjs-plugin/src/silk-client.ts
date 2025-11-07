/**
 * Client-side runtime for Silk + Next.js
 * Handles CSS injection and HMR
 */

if (typeof window !== 'undefined') {
  // Check if CSS is already injected
  const existingLink = document.querySelector('link[data-silk]')
  const existingStyle = document.querySelector('style[data-silk]')

  if (!existingLink && !existingStyle) {
    // Try multiple possible CSS paths
    const cssPaths = [
      '/_next/static/css/silk.css',
      '/silk.css',
      '/public/silk.css'
    ]

    let cssInjected = false

    const tryInjectCSS = (index: number): void => {
      if (index >= cssPaths.length) {
        // All paths failed - warn user to import manually
        console.warn(
          '[Silk] CSS file not found. Please import CSS manually in your layout:\n' +
          '  import "./silk.css"\n' +
          'or\n' +
          '  import "@sylphx/silk/dist/silk.css"'
        )
        return
      }

      const cssPath = cssPaths[index]
      if (!cssPath) return

      fetch(cssPath, { method: 'HEAD' })
        .then(response => {
          if (response.ok && !cssInjected) {
            cssInjected = true
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = cssPath
            link.setAttribute('data-silk', '')
            document.head.appendChild(link)
          } else if (!response.ok) {
            // Try next path
            tryInjectCSS(index + 1)
          }
        })
        .catch(() => {
          // Try next path
          tryInjectCSS(index + 1)
        })
    }

    // Start trying paths
    tryInjectCSS(0)
  }

  // HMR support
  // @ts-expect-error - module.hot is from webpack
  if (typeof module !== 'undefined' && module.hot) {
    // @ts-expect-error - module.hot is from webpack
    module.hot.accept()
  }
}
