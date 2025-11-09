import { withSilk } from '@sylphx/silk-nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withSilk(nextConfig, {
  turbopack: true,  // Enable Turbopack mode with SWC plugin
  srcDir: './src',
  debug: true
});
