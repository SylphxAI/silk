// Test Node.js ESM imports
import { createStyleSystem, css } from '@sylphx/silk';

console.log('✅ Successfully imported from @sylphx/silk');
console.log('  - createStyleSystem:', typeof createStyleSystem);
console.log('  - css:', typeof css);

// Test optimizer import
try {
  const { smartOptimizeCSS } = await import('@sylphx/silk/optimizer');
  console.log('✅ Successfully imported from @sylphx/silk/optimizer');
  console.log('  - smartOptimizeCSS:', typeof smartOptimizeCSS);
} catch (error) {
  console.error('❌ Failed to import from @sylphx/silk/optimizer');
  console.error(error.message);
  process.exit(1);
}

// Test basic functionality
try {
  const { css: cssRuntime } = createStyleSystem({
    colors: {
      brand: { 500: '#3b82f6' }
    }
  });

  const className = cssRuntime({ bg: 'brand.500', p: 4 });
  console.log('✅ Runtime CSS generation works');
  console.log('  - Generated className:', className);
} catch (error) {
  console.error('❌ Runtime CSS generation failed');
  console.error(error.message);
  process.exit(1);
}

console.log('\n🎉 All tests passed!');
