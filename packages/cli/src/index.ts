#!/usr/bin/env node

/**
 * @sylphx/silk-cli
 * CLI tool for semi-codegen CSS generation
 *
 * Used by frameworks without plugin hooks (e.g., Next.js Turbopack)
 */

import { Command } from 'commander';
import { scanAndGenerate } from '@sylphx/silk/codegen';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import chokidar from 'chokidar';

const program = new Command();

program
  .name('silk')
  .description('Silk CSS generator for semi-codegen frameworks')
  .version('1.0.0');

/**
 * Generate command
 */
program
  .command('generate')
  .description('Generate CSS from source files')
  .option('-s, --src <dir>', 'Source directory to scan', './src')
  .option('-o, --output <file>', 'Output CSS file', './src/silk.generated.css')
  .option('-w, --watch', 'Watch mode: regenerate on file changes')
  .option('--minify', 'Minify CSS output', false)
  .option('--debug', 'Enable debug logging', false)
  .action(async (options) => {
    const { src, output, watch, minify, debug } = options;

    if (debug) {
      console.log('[Silk CLI] Options:', { src, output, watch, minify });
    }

    // Generate CSS function
    const generate = async () => {
      try {
        const startTime = Date.now();

        if (debug) {
          console.log(`[Silk CLI] Scanning ${src}...`);
        }

        // Generate CSS
        const css = await scanAndGenerate(src, {
          minify,
          debug
        });

        // Ensure output directory exists
        const outputDir = path.dirname(output);
        await fs.mkdir(outputDir, { recursive: true });

        // Write CSS file
        await fs.writeFile(output, css, 'utf-8');

        const elapsed = Date.now() - startTime;
        const sizeKB = (css.length / 1024).toFixed(2);

        console.log(`✅ Generated ${output} (${sizeKB} KB) in ${elapsed}ms`);
      } catch (error) {
        console.error('❌ CSS generation failed:', error);
        process.exit(1);
      }
    };

    // Initial generation
    await generate();

    // Watch mode
    if (watch) {
      console.log(`\n👀 Watching ${src} for changes...\n`);

      const watcher = chokidar.watch(src, {
        ignored: /(^|[\/\\])\../,  // Ignore dotfiles
        persistent: true,
        ignoreInitial: true
      });

      watcher
        .on('add', async (filePath) => {
          if (/\.[jt]sx?$/.test(filePath)) {
            if (debug) {
              console.log(`[Silk CLI] File added: ${filePath}`);
            }
            await generate();
          }
        })
        .on('change', async (filePath) => {
          if (/\.[jt]sx?$/.test(filePath)) {
            if (debug) {
              console.log(`[Silk CLI] File changed: ${filePath}`);
            }
            await generate();
          }
        })
        .on('unlink', async (filePath) => {
          if (/\.[jt]sx?$/.test(filePath)) {
            if (debug) {
              console.log(`[Silk CLI] File removed: ${filePath}`);
            }
            await generate();
          }
        })
        .on('error', (error) => {
          console.error('❌ Watcher error:', error);
        });

      // Keep process alive
      process.on('SIGINT', () => {
        console.log('\n👋 Stopping watcher...');
        watcher.close();
        process.exit(0);
      });
    }
  });

/**
 * Init command (create silk.config.js)
 */
program
  .command('init')
  .description('Initialize Silk configuration')
  .action(async () => {
    const configPath = './silk.config.js';

    const configTemplate = `/**
 * Silk CLI Configuration
 * @type {import('@sylphx/silk-cli').SilkConfig}
 */
export default {
  // Source directory to scan
  srcDir: './src',

  // Output CSS file
  outputFile: './src/silk.generated.css',

  // Minify CSS in production
  minify: process.env.NODE_ENV === 'production',

  // Design tokens (optional)
  config: {
    colors: {
      primary: '#10b981',
      secondary: '#3b82f6',
      // ...
    },
    spacing: {
      sm: '0.5rem',
      md: '1rem',
      lg: '2rem',
      // ...
    }
  }
};
`;

    try {
      await fs.writeFile(configPath, configTemplate, 'utf-8');
      console.log(`✅ Created ${configPath}`);
      console.log('\nNext steps:');
      console.log('  1. Edit silk.config.js to customize settings');
      console.log('  2. Run: silk generate');
      console.log('  3. Import CSS in your app');
    } catch (error) {
      console.error('❌ Failed to create config:', error);
      process.exit(1);
    }
  });

// Parse command line
program.parse();
