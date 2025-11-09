import { withSilk } from '@sylphx/silk-nextjs'

export default withSilk({
  // Next.js config - using Webpack (default)
}, {
  // Silk config
  srcDir: './app',  // 正確的源代碼目錄
  outputFile: 'silk.css',
  minify: true,
  debug: true,
})
