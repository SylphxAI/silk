/**
 * AST-based CSS extraction utilities
 *
 * Safe replacement for eval()-based CSS extraction
 */

import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import * as t from '@babel/types';
import * as fs from 'node:fs';

// Handle both CJS and ESM imports
const traverse = (traverseModule as any).default || traverseModule;

export interface CSSRule {
  styles: Record<string, any>;
  loc?: { line: number; column: number };
}

export interface ScanResult {
  filePath: string;
  cssRules: CSSRule[];
}

/**
 * Extract CSS rules from a single file using AST parsing
 *
 * This is a production-quality implementation that safely parses
 * css() calls without using eval or regex hacks.
 *
 * @param filePath - Path to source file
 * @returns Scan result with extracted CSS rules
 */
export function extractCssFromFile(filePath: string): ScanResult {
  let content = fs.readFileSync(filePath, 'utf-8');
  const cssRules: CSSRule[] = [];

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
 *
 * This handles:
 * - Simple properties: { color: 'red' }
 * - Nested objects: { _hover: { color: 'blue' } }
 * - Spread properties: { ...baseStyles } (skipped)
 * - Computed properties: { [key]: value } (skipped)
 * - Template literals: { width: `${size}px` } (static only)
 *
 * @param node - Babel AST ObjectExpression node
 * @returns Plain JavaScript object
 */
function evaluateObjectExpression(node: t.ObjectExpression): Record<string, any> {
  const result: Record<string, any> = {};

  for (const prop of node.properties) {
    if (t.isSpreadElement(prop)) {
      // Handle spread: { ...baseStyles }
      // We can't evaluate this statically, so skip it
      if (process.env.DEBUG) {
        console.warn('Skipping spread element in css() call - cannot statically analyze');
      }
      continue;
    }

    if (t.isObjectProperty(prop) || t.isObjectMethod(prop)) {
      if (t.isObjectMethod(prop)) {
        // Skip methods: { get foo() { return 'bar' } }
        continue;
      }

      // Get property key
      let key: string | undefined;
      if (prop.computed && t.isStringLiteral(prop.key)) {
        // Computed with string literal: { ['color']: 'red' }
        key = prop.key.value;
      } else if (t.isIdentifier(prop.key)) {
        // Simple property: { color: 'red' }
        key = prop.key.name;
      } else if (t.isStringLiteral(prop.key)) {
        // String key: { 'color': 'red' }
        key = prop.key.value;
      } else if (t.isNumericLiteral(prop.key)) {
        // Numeric key: { 0: 'value' }
        key = String(prop.key.value);
      } else {
        // Skip computed properties we can't statically evaluate
        if (process.env.DEBUG) {
          console.warn('Skipping computed property in css() call - cannot statically analyze');
        }
        continue;
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
 *
 * @param node - Babel AST node
 * @returns JavaScript value or undefined if cannot evaluate
 */
function evaluateValue(node: t.Node): any {
  if (t.isStringLiteral(node)) {
    return node.value;
  }

  if (t.isNumericLiteral(node)) {
    return node.value;
  }

  if (t.isBooleanLiteral(node)) {
    return node.value;
  }

  if (t.isNullLiteral(node)) {
    return null;
  }

  if (t.isObjectExpression(node)) {
    // Recursive: handle nested objects
    return evaluateObjectExpression(node);
  }

  if (t.isArrayExpression(node)) {
    // Handle arrays: [value1, value2]
    return node.elements
      .map(el => el ? evaluateValue(el) : null)
      .filter(v => v !== null);
  }

  if (t.isUnaryExpression(node)) {
    // Handle negative numbers: -5
    if (node.operator === '-' && t.isNumericLiteral(node.argument)) {
      return -node.argument.value;
    }
    if (node.operator === '+' && t.isNumericLiteral(node.argument)) {
      return node.argument.value;
    }
    return undefined;
  }

  if (t.isTemplateLiteral(node)) {
    // Handle template literals: `${size}px`
    // For static analysis, we can only handle simple cases
    if (node.expressions.length === 0 && node.quasis.length === 1) {
      // No expressions: `static string`
      return node.quasis[0]?.value.cooked;
    }
    // Skip template literals with expressions
    if (process.env.DEBUG) {
      console.warn('Skipping template literal with expressions in css() call');
    }
    return undefined;
  }

  if (t.isIdentifier(node)) {
    // Skip identifiers (variables) - can't statically evaluate
    if (process.env.DEBUG) {
      console.warn(`Skipping identifier '${node.name}' in css() call - cannot statically analyze`);
    }
    return undefined;
  }

  if (t.isMemberExpression(node)) {
    // Skip member expressions like 'colors.red' - can't statically evaluate
    if (process.env.DEBUG) {
      console.warn('Skipping member expression in css() call - cannot statically analyze');
    }
    return undefined;
  }

  if (t.isCallExpression(node)) {
    // Skip function calls - can't statically evaluate
    if (process.env.DEBUG) {
      console.warn('Skipping function call in css() call - cannot statically analyze');
    }
    return undefined;
  }

  // Unknown node type - skip
  if (process.env.DEBUG) {
    console.warn(`Skipping unknown node type '${node.type}' in css() call`);
  }
  return undefined;
}
