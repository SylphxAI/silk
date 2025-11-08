import { withSilk } from '@sylphx/silk-nextjs'

export default withSilk({
  // Next.js config
  // Note: Use --webpack flag for production builds
  // Dev mode can use --turbo flag
}, {
  // Silk config
  outputFile: 'silk.css',
  minify: true,
})
