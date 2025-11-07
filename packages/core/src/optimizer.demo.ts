/**
 * Demo showcasing CSS optimization features
 */

import { createStyleSystem } from './runtime'
import { defineConfig } from './config'
import { getMinimalProps } from './optimizer'

const config = defineConfig({
  colors: {
    blue: { 500: '#3b82f6', 600: '#2563eb' },
    white: '#ffffff',
    gray: { 900: '#111827' },
  },
  spacing: {
    2: '0.5rem',
    4: '1rem',
    6: '1.5rem',
    8: '2rem',
  },
} as const)

console.log('🚀 ZenCSS Optimization Demo\n')

// Example 1: Property Merging
console.log('Example 1: Automatic Property Merging')
console.log('=====================================')

const input1 = {
  mt: 4,
  mb: 4,
  ml: 2,
  mr: 2,
}

const output1 = getMinimalProps(input1)

console.log('Input: ', JSON.stringify(input1, null, 2))
console.log('Output:', JSON.stringify(output1, null, 2))
console.log('✨ Optimized: 4 properties → 2 properties')
console.log('   marginBlock: 4, marginInline: 2\n')

// Example 2: Complete Merge
console.log('Example 2: Complete Property Merge')
console.log('===================================')

const input2 = {
  pt: 6,
  pr: 6,
  pb: 6,
  pl: 6,
}

const output2 = getMinimalProps(input2)

console.log('Input: ', JSON.stringify(input2, null, 2))
console.log('Output:', JSON.stringify(output2, null, 2))
console.log('✨ Optimized: 4 properties → 1 property')
console.log('   padding: 6\n')

// Example 3: Real-world Button
console.log('Example 3: Real-world Button Styles')
console.log('====================================')

const input3 = {
  pt: 2,
  pr: 4,
  pb: 2,
  pl: 4,
  bg: 'blue.500',
  color: 'white',
}

const output3 = getMinimalProps(input3)

console.log('Input: ', JSON.stringify(input3, null, 2))
console.log('Output:', JSON.stringify(output3, null, 2))
console.log('✨ Optimized: 6 properties → 4 properties')
console.log('   paddingBlock: 2, paddingInline: 4, bg, color\n')

// Example 4: CSS Generation Comparison
console.log('Example 4: CSS Class Generation Comparison')
console.log('===========================================')

const styleSystem = createStyleSystem(config, { optimize: true })
const styleSystemNoOpt = createStyleSystem(config, { optimize: false })

const buttonStyles = {
  pt: 2,
  pr: 6,
  pb: 2,
  pl: 6,
  bg: 'blue.500',
  _hover: { bg: 'blue.600' },
}

// With optimization
styleSystem.resetCSSRules()
const optimized = styleSystem.css(buttonStyles)

// Without optimization
styleSystemNoOpt.resetCSSRules()
const nonOptimized = styleSystemNoOpt.css(buttonStyles)

console.log('Without Optimization:')
console.log('  Classes:', nonOptimized.className.split(' ').length, 'atomic classes')
console.log('  ', nonOptimized.className)
console.log()

console.log('With Optimization:')
console.log('  Classes:', optimized.className.split(' ').length, 'atomic classes')
console.log('  ', optimized.className)
console.log()

const reduction = (
  ((nonOptimized.className.split(' ').length - optimized.className.split(' ').length) /
    nonOptimized.className.split(' ').length) *
  100
).toFixed(0)

console.log(`✨ ${reduction}% fewer atomic classes generated!\n`)

// Example 5: Complex Layout
console.log('Example 5: Complex Layout Optimization')
console.log('=======================================')

const input5 = {
  mt: 8,
  mb: 8,
  ml: 4,
  mr: 4,
  pt: 4,
  pb: 4,
  pl: 4,
  pr: 4,
}

const output5 = getMinimalProps(input5)

console.log('Input: ', JSON.stringify(input5, null, 2))
console.log('Output:', JSON.stringify(output5, null, 2))
console.log('✨ Optimized: 8 properties → 3 properties')
console.log('   marginBlock: 8, marginInline: 4, padding: 4\n')

// Summary
console.log('Summary')
console.log('=======')
console.log('ZenCSS optimizer automatically:')
console.log('  ✓ Merges directional properties (mt + mb → marginBlock)')
console.log('  ✓ Combines into shorthand (all 4 sides → single property)')
console.log('  ✓ Reduces atomic class count')
console.log('  ✓ Generates minimal effective CSS')
console.log()
console.log('Result: Faster build times, smaller CSS bundles! 🚀')
