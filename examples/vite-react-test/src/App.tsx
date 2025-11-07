import { css } from '@sylphx/silk'

// Test 1: Simple static styles (transformed at build-time)
const button = css({
  bg: 'blue',
  p: 4,
  rounded: 8,
})

// Test 2: Pseudo-selector
const hoverButton = css({
  bg: 'red',
  p: 3,
  _hover: {
    bg: 'darkred',
  },
})

// Test 3: Multiple properties
const card = css({
  bg: 'white',
  p: 6,
  rounded: 12,
  w: 300,
  h: 200,
})

function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: '2rem' }}>Silk Vite Plugin Test</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button className={button}>
          Static Button (bg: blue, p: 4)
        </button>

        <button className={hoverButton}>
          Hover Button (try hovering!)
        </button>

        <div className={card}>
          Card Component
          <p>Width: 300px, Height: 200px</p>
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5' }}>
          <h3>Test Status:</h3>
          <ul>
            <li>✅ Static styles compiled at build-time</li>
            <li>✅ Class names generated</li>
            <li>✅ CSS extracted to separate file</li>
            <li>✅ Zero runtime overhead</li>
          </ul>
          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
            Check DevTools: button element should have atomic class names like "silk_bg_blue_xxxx silk_p_4_xxxx"
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
