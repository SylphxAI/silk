import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import silk from '@sylphx/silk-vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    silk({
      debug: true
    })
  ]
});
