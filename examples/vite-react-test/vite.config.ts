import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import silk from '@sylphx/silk-vite-plugin'

export default defineConfig({
  plugins: [
    silk({
      babelOptions: {
        production: false,
      },
    }),
    react(),
  ],
  build: {
    rollupOptions: {
      external: (id) => {
        // External lightningcss and its native dependencies
        return id === 'lightningcss' || id.includes('detect-libc')
      },
    },
    commonjsOptions: {
      exclude: ['@babel/core', '@sylphx/babel-plugin-silk'],
    },
  },
  optimizeDeps: {
    exclude: ['@babel/core', '@sylphx/babel-plugin-silk', '@sylphx/silk', 'lightningcss'],
  },
  resolve: {
    alias: {
      // Prevent lightningcss from being bundled in browser code
      'lightningcss': 'data:text/javascript,export default {}',
    },
  },
})
