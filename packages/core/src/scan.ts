/**
 * Scan source files for css() calls and extract CSS rules
 *
 * This module provides functionality to:
 * 1. Glob source files (*.ts, *.tsx, *.js, *.jsx)
 * 2. Parse AST to find css() function calls
 * 3. Extract CSS content from those calls
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import * as t from '@babel/types';

// Handle both CJS and ESM imports
const traverse = (traverseModule as any).default || traverseModule;

/**
 * Result of scanning a single file
 */
export interface ScanResult {
  /** File path */
  filePath: string;
  /** CSS rules found in this file */
  cssRules: Array<{
    /** CSS content (object form) */
    styles: Record<string, any>;
    /** Source location (for debugging) */
    loc?: { line: number; column: number };
  }>;
}

/**
 * Options for scanning
 */
export interface ScanOptions {
  /** Source directory to scan (default: './src') */
  srcDir?: string;
  /** File patterns to include (default: ['**\/*.{ts,tsx,js,jsx,vue,svelte}']) */
  include?: string[];
  /** File patterns to exclude (default: ['**\/node_modules/**', '**\/.next/**', '**\/dist/**']) */
  exclude?: string[];
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Recursively find files matching patterns
 */
function findFiles(
  dir: string,
  include: string[] = ['**/*.{ts,tsx,js,jsx,vue,svelte}'],
  exclude: string[] = ['**/node_modules/**', '**/.next/**', '**/dist/**']
): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(dir, fullPath);

      // Check exclude patterns
      const shouldExclude = exclude.some(pattern => {
        const regex = patternToRegex(pattern);
        return regex.test(relativePath) || regex.test(entry.name);
      });

      if (shouldExclude) continue;

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        // Check include patterns
        const shouldInclude = include.some(pattern => {
          const regex = patternToRegex(pattern);
          return regex.test(relativePath) || regex.test(entry.name);
        });

        if (shouldInclude) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Convert glob pattern to regex
 * Simple implementation - supports *, **, and {a,b}
 */
function patternToRegex(pattern: string): RegExp {
  // Handle special patterns with placeholders first
  let regex = pattern
    .replace(/\{([^}]+)\}/g, (_, p1) => `%%GROUP%%${p1.split(',').join('%%OR%%')}%%ENDGROUP%%`)
    // Handle **/ specially (zero or more directories)
    .replace(/\*\*\//g, '%%GLOBSTAR%%')
    .replace(/\*/g, '%%STAR%%')
    // Escape special regex characters (but not our placeholders)
    .replace(/[.+^${}()[\]\\]/g, '\\$&')
    // Restore patterns
    .replace(/%%GROUP%%/g, '(')
    .replace(/%%ENDGROUP%%/g, ')')
    .replace(/%%OR%%/g, '|')
    // **/ matches zero or more directories
    .replace(/%%GLOBSTAR%%/g, '(?:.*\\/)?')
    .replace(/%%STAR%%/g, '[^/]*');

  return new RegExp(`^${regex}$`);
}

/**
 * Production-quality AST-based CSS extraction
 *
 * Uses @babel/parser and @babel/traverse to safely parse css() calls
 * without using eval or regex hacks.
 *
 * Handles:
 * - Simple objects: css({ color: 'red' })
 * - Nested objects: css({ _hover: { color: 'blue' } })
 * - Type assertions: css({ color: 'red' } as const)
 * - Satisfies operator: css({ color: 'red' } satisfies StyleProps)
 *
 * Skips (with warnings if DEBUG=true):
 * - Spread operators: css({ ...baseStyles })
 * - Computed properties: css({ [key]: value })
 * - Variables: css({ color: brandColor })
 * - Template literals with expressions: css({ width: `${size}px` })
 */
function extractCssFromFile(filePath: string): ScanResult {
  let content = fs.readFileSync(filePath, 'utf-8');
  const cssRules: ScanResult['cssRules'] = [];

  // Extract <script> content from Vue/Svelte files
  if (filePath.endsWith('.vue') || filePath.endsWith('.svelte')) {
    const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    if (scriptMatch && scriptMatch[1]) {
      content = scriptMatch[1];
    } else {
      // No script section found
      return { filePath, cssRules: [] };
    }
  }

  try {
    // Parse file to AST using Babel parser
    const ast = parse(content, {
      sourceType: 'module',
      plugins: [
        'typescript',
        'jsx',
        'decorators-legacy'
      ],
      errorRecovery: true
    });

    // Traverse AST to find css() calls
    traverse(ast, {
      CallExpression(path: any) {
        // Check if this is a css() call
        if (
          t.isIdentifier(path.node.callee) &&
          path.node.callee.name === 'css' &&
          path.node.arguments.length > 0
        ) {
          let firstArg = path.node.arguments[0];

          // Unwrap type assertions: css({ ... } as any) or css({ ... } satisfies Type)
          while (t.isTSAsExpression(firstArg) || t.isTSSatisfiesExpression(firstArg)) {
            firstArg = firstArg.expression;
          }

          // Only process object literal arguments
          if (t.isObjectExpression(firstArg)) {
            try {
              // Convert AST ObjectExpression to plain JavaScript object
              const styles = evaluateObjectExpression(firstArg);

              // Get location info
              const loc = firstArg.loc;

              cssRules.push({
                styles,
                loc: loc ? {
                  line: loc.start.line,
                  column: loc.start.column
                } : undefined
              });
            } catch (err) {
              if (process.env.DEBUG) {
                console.warn(
                  `Failed to evaluate css() call at ${filePath}:${firstArg.loc?.start.line}:`,
                  err
                );
              }
            }
          }
        }
      }
    });
  } catch (err) {
    if (process.env.DEBUG) {
      console.warn(`Failed to parse file ${filePath}:`, err);
    }
  }

  return {
    filePath,
    cssRules
  };
}

/**
 * Safely evaluate an ObjectExpression AST node to a plain object
 */
function evaluateObjectExpression(node: t.ObjectExpression): Record<string, any> {
  const result: Record<string, any> = {};

  for (const prop of node.properties) {
    if (t.isSpreadElement(prop)) {
      // Skip spread elements - can't statically analyze
      continue;
    }

    if (t.isObjectProperty(prop)) {
      // Get property key
      let key: string | undefined;
      if (prop.computed && t.isStringLiteral(prop.key)) {
        key = prop.key.value;
      } else if (t.isIdentifier(prop.key)) {
        key = prop.key.name;
      } else if (t.isStringLiteral(prop.key)) {
        key = prop.key.value;
      } else if (t.isNumericLiteral(prop.key)) {
        key = String(prop.key.value);
      } else {
        continue; // Skip computed properties
      }

      // Get property value
      const value = evaluateValue(prop.value);
      if (value !== undefined) {
        result[key] = value;
      }
    }
  }

  return result;
}

/**
 * Evaluate an AST node to a plain JavaScript value
 */
function evaluateValue(node: t.Node): any {
  if (t.isStringLiteral(node)) return node.value;
  if (t.isNumericLiteral(node)) return node.value;
  if (t.isBooleanLiteral(node)) return node.value;
  if (t.isNullLiteral(node)) return null;

  if (t.isObjectExpression(node)) {
    return evaluateObjectExpression(node);
  }

  if (t.isArrayExpression(node)) {
    return node.elements
      .map(el => el ? evaluateValue(el) : null)
      .filter(v => v !== null);
  }

  if (t.isUnaryExpression(node)) {
    if (node.operator === '-' && t.isNumericLiteral(node.argument)) {
      return -node.argument.value;
    }
  }

  if (t.isTemplateLiteral(node)) {
    // Only handle static template literals
    if (node.expressions.length === 0 && node.quasis.length === 1) {
      return node.quasis[0]?.value.cooked;
    }
  }

  // Can't statically evaluate: identifiers, member expressions, function calls, etc.
  return undefined;
}

/**
 * Scan source directory for css() calls
 *
 * @example
 * ```ts
 * const results = scanSourceFiles({ srcDir: './src' });
 * console.log(`Found ${results.length} files with CSS`);
 * ```
 */
export function scanSourceFiles(options: ScanOptions = {}): ScanResult[] {
  const {
    srcDir = './src',
    include = ['**/*.{ts,tsx,js,jsx,vue,svelte}'],
    exclude = ['**/node_modules/**', '**/.next/**', '**/dist/**'],
    debug = false
  } = options;

  if (debug) {
    console.log(`Scanning ${srcDir} for CSS...`);
  }

  // Find all matching files
  const files = findFiles(srcDir, include, exclude);

  if (debug) {
    console.log(`Found ${files.length} files to scan`);
  }

  // Extract CSS from each file
  const results = files
    .map(file => extractCssFromFile(file))
    .filter(result => result.cssRules.length > 0);

  if (debug) {
    const totalRules = results.reduce((sum, r) => sum + r.cssRules.length, 0);
    console.log(`Extracted ${totalRules} CSS rules from ${results.length} files`);
  }

  return results;
}

/**
 * TODO: Implement proper AST-based extraction
 *
 * For production quality, we should:
 * 1. Use @babel/parser or @swc/core to parse files
 * 2. Use @babel/traverse or SWC visitor pattern
 * 3. Handle edge cases:
 *    - Nested css() calls
 *    - Spread operators in style objects
 *    - Variable references
 *    - Imported styles
 *
 * Example with @babel/parser:
 *
 * ```ts
 * import { parse } from '@babel/parser';
 * import traverse from '@babel/traverse';
 *
 * const ast = parse(content, {
 *   sourceType: 'module',
 *   plugins: ['typescript', 'jsx']
 * });
 *
 * traverse(ast, {
 *   CallExpression(path) {
 *     if (path.node.callee.name === 'css') {
 *       // Extract styles from arguments
 *     }
 *   }
 * });
 * ```
 */
