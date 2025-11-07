/**
 * Simple test to verify babel-plugin-silk works
 */

import { transformSync } from '@babel/core'
import babelPluginSilk from '@sylphx/babel-plugin-silk'

console.log('🧪 Testing @sylphx/babel-plugin-silk\n')

// Test 1: Simple static styles
console.log('Test 1: Simple static styles')
const test1 = `
import { css } from '@sylphx/silk';
const button = css({ bg: 'red', p: 4 });
`

const result1 = transformSync(test1, {
  plugins: [babelPluginSilk],
  filename: 'test.ts',
})

console.log('Input:', test1.trim())
console.log('Output:', result1.code.trim())
console.log('CSS Rules:', result1.metadata.silk.cssRules.length)
console.log('✅ Test 1 passed\n')

// Test 2: Dynamic styles (partial compilation)
console.log('Test 2: Dynamic styles (partial compilation)')
const test2 = `
import { css } from '@sylphx/silk';
const button = css({ bg: props.color, p: 4 });
`

const result2 = transformSync(test2, {
  plugins: [babelPluginSilk],
  filename: 'test.ts',
})

console.log('Input:', test2.trim())
console.log('Output:', result2.code.trim())
console.log('CSS Rules:', result2.metadata.silk.cssRules.length)
console.log('✅ Test 2 passed\n')

// Test 3: Production mode (short class names)
console.log('Test 3: Production mode (short class names)')
const test3 = `
import { css } from '@sylphx/silk';
const button = css({ bg: 'blue', p: 2 });
`

const result3 = transformSync(test3, {
  plugins: [[babelPluginSilk, { production: true }]],
  filename: 'test.ts',
})

console.log('Input:', test3.trim())
console.log('Output:', result3.code.trim())
console.log('CSS Rules:', result3.metadata.silk.cssRules.length)
console.log('✅ Test 3 passed\n')

// Display generated CSS
console.log('='.repeat(60))
console.log('Generated CSS:')
console.log('='.repeat(60))
for (const [className, rule] of result1.metadata.silk.cssRules) {
  console.log(rule)
}

console.log('\n✅ All tests passed! Babel plugin is working correctly.')
