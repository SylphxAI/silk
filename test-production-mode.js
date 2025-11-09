// Test NODE_ENV detection in runtime
process.env.NODE_ENV = 'production';

import { createStyleSystem } from './packages/core/dist/index.js';

const styleSystem = createStyleSystem({});
const result = styleSystem.css({ position: 'relative', display: 'flex' });

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Generated className:', result.className);
console.log('Should start with "s" for production mode');

// Expected: syw9nms s1ehecwq (production)
// Old behavior: silk_position_relative_yw9n silk_display_flex_1ehe (development)

const isProduction = result.className.split(' ')[0].startsWith('s') &&
                     !result.className.includes('silk_');

if (isProduction) {
  console.log('✅ Production mode working!');
  process.exit(0);
} else {
  console.log('❌ Still using development mode');
  process.exit(1);
}
