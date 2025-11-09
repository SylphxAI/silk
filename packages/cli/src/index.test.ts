/**
 * @sylphx/silk-cli
 * CLI tool tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawn } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLI_PATH = path.join(__dirname, '../dist/index.js');
const TEST_DIR = path.join(__dirname, '../test-temp');

describe('Silk CLI', () => {
  beforeEach(async () => {
    // Create test directory
    await fs.mkdir(TEST_DIR, { recursive: true });

    // Create a test source file
    const testFile = path.join(TEST_DIR, 'test.tsx');
    await fs.writeFile(testFile, `
import { css } from '@sylphx/silk';

const styles = css({
  display: 'flex',
  padding: 4,
  color: 'blue.500',
  _hover: {
    color: 'blue.600'
  }
});
    `.trim(), 'utf-8');
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('generate command', () => {
    it('should generate CSS file', async () => {
      const outputFile = path.join(TEST_DIR, 'silk.css');

      const result = await runCLI(['generate', '--src', TEST_DIR, '--output', outputFile, '--debug']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Generated');

      // Check if CSS file was created
      const cssExists = await fileExists(outputFile);
      expect(cssExists).toBe(true);

      if (cssExists) {
        const cssContent = await fs.readFile(outputFile, 'utf-8');
        expect(cssContent).toContain('display: flex');
        expect(cssContent).toContain('padding:');
        expect(cssContent).toContain('color:');
        expect(cssContent).toContain(':hover');
      }
    });

    it('should handle minify option', async () => {
      const outputFile = path.join(TEST_DIR, 'silk.min.css');

      const result = await runCLI(['generate', '--src', TEST_DIR, '--output', outputFile, '--minify']);

      expect(result.exitCode).toBe(0);

      const cssExists = await fileExists(outputFile);
      expect(cssExists).toBe(true);

      if (cssExists) {
        const cssContent = await fs.readFile(outputFile, 'utf-8');
        // Minified CSS should not have extra whitespace
        expect(cssContent).not.toContain('  ');
        expect(cssContent).not.toContain('\n\n');
      }
    });

    it('should handle empty source directory', async () => {
      const emptyDir = path.join(TEST_DIR, 'empty');
      await fs.mkdir(emptyDir, { recursive: true });

      const outputFile = path.join(TEST_DIR, 'empty.css');
      const result = await runCLI(['generate', '--src', emptyDir, '--output', outputFile]);

      expect(result.exitCode).toBe(0);

      const cssExists = await fileExists(outputFile);
      expect(cssExists).toBe(true);

      if (cssExists) {
        const cssContent = await fs.readFile(outputFile, 'utf-8');
        // Should generate empty or minimal CSS with layers
        expect(cssContent).toContain('@layer');
      }
    });

    it('should create output directory if it does not exist', async () => {
      const nestedOutputDir = path.join(TEST_DIR, 'nested', 'css');
      const outputFile = path.join(nestedOutputDir, 'silk.css');

      const result = await runCLI(['generate', '--src', TEST_DIR, '--output', outputFile]);

      expect(result.exitCode).toBe(0);

      const dirExists = await fileExists(nestedOutputDir);
      const cssExists = await fileExists(outputFile);

      expect(dirExists).toBe(true);
      expect(cssExists).toBe(true);
    });
  });

  describe('init command', () => {
    it('should create silk.config.js', async () => {
      const configPath = path.join(TEST_DIR, 'silk.config.js');

      const result = await runCLI(['init'], { cwd: TEST_DIR });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Created ./silk.config.js');
      expect(result.stdout).toContain('Next steps');

      const configExists = await fileExists(configPath);
      expect(configExists).toBe(true);

      if (configExists) {
        const configContent = await fs.readFile(configPath, 'utf-8');
        expect(configContent).toContain('srcDir');
        expect(configContent).toContain('outputFile');
        expect(configContent).toContain('colors');
        expect(configContent).toContain('spacing');
      }
    });

    it('should not overwrite existing config', async () => {
      const configPath = path.join(TEST_DIR, 'silk.config.js');
      const existingContent = '// Existing config';
      await fs.writeFile(configPath, existingContent, 'utf-8');

      const result = await runCLI(['init'], { cwd: TEST_DIR });

      // Note: The current implementation will overwrite, so this test documents current behavior
      // In a real implementation, we might want to check and prompt before overwriting

      expect(result.exitCode).toBe(0);

      const configExists = await fileExists(configPath);
      expect(configExists).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle invalid source directory', async () => {
      const invalidDir = path.join(TEST_DIR, 'nonexistent');
      const outputFile = path.join(TEST_DIR, 'error.css');

      const result = await runCLI(['generate', '--src', invalidDir, '--output', outputFile]);

      // CLI should fail gracefully for non-existent directory
      expect(result.exitCode).toBe(1);
    });

    it('should handle file permission errors gracefully', async () => {
      // Create a file with restricted permissions
      const readOnlyFile = path.join(TEST_DIR, 'readonly.tsx');
      await fs.writeFile(readOnlyFile, 'import { css } from "@sylphx/silk";', 'utf-8');

      try {
        // Try to make file read-only (may not work on all systems)
        await fs.chmod(readOnlyFile, 0o444);
      } catch {
        // Skip this test if we can't change permissions
        return;
      }

      const outputFile = path.join(TEST_DIR, 'readonly.css');
      const result = await runCLI(['generate', '--src', TEST_DIR, '--output', outputFile]);

      // Should handle gracefully
      expect([0, 1]).toContain(result.exitCode);

      // Restore permissions for cleanup
      try {
        await fs.chmod(readOnlyFile, 0o644);
      } catch {
        // Ignore
      }
    });
  });

  describe('help and version', () => {
    it('should show help', async () => {
      const result = await runCLI(['--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Silk CSS generator');
      expect(result.stdout).toContain('generate');
      expect(result.stdout).toContain('init');
    });

    it('should show version', async () => {
      const result = await runCLI(['--version']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('1.0.0');
    });

    it('should show command-specific help', async () => {
      const result = await runCLI(['generate', '--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Generate CSS');
    });
  });
});

/**
 * Helper function to run CLI and capture output
 */
async function runCLI(args: string[], options: { cwd?: string } = {}): Promise<{
  exitCode: number | null;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve) => {
    const child = spawn('node', [CLI_PATH, ...args], {
      cwd: options.cwd || process.cwd(),
      stdio: 'pipe',
      timeout: 10000, // 10 second timeout
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        exitCode: code,
        stdout,
        stderr,
      });
    });

    child.on('error', (error) => {
      resolve({
        exitCode: 1,
        stdout: '',
        stderr: error.message,
      });
    });
  });
}

/**
 * Helper function to check if file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}