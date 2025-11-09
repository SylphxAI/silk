// Test auto-detection: Same config for both webpack and turbopack
import { withSilk } from '@sylphx/silk-nextjs';

export default withSilk({
  // Your Next.js config
  reactStrictMode: true,
}, {
  // Silk config
  debug: true  // Enable debug logging
});
