# Babel Plugin Development Guide for CSS-in-JS Build-Time Compilation

> **Comprehensive guide for implementing `@sylphx/babel-plugin-silk`**
> Pattern: StyleX-inspired atomic CSS extraction with zero-runtime overhead

## Table of Contents

1. [Babel Plugin Architecture](#1-babel-plugin-architecture)
2. [StyleX Implementation Pattern](#2-stylex-implementation-pattern)
3. [Key Technical Challenges](#3-key-technical-challenges)
4. [Implementation for Silk](#4-implementation-for-silk)
5. [Complete Code Examples](#5-complete-code-examples)
6. [Architecture Recommendations](#6-architecture-recommendations)
7. [Implementation Roadmap](#7-implementation-roadmap)

---

## 1. Babel Plugin Architecture

### 1.1 How Babel AST Visitors Work

Babel uses the **visitor pattern** to traverse and transform Abstract Syntax Trees (ASTs). Each visitor method corresponds to a node type in the AST.

**Basic Structure:**
```javascript
export default function babelPluginSilk(babel) {
  const { types: t } = babel;

  return {
    name: 'babel-plugin-silk',
    visitor: {
      // Visit CallExpression nodes (function calls)
      CallExpression(path, state) {
        // Transformation logic here
      },

      // Visit Program node (root of file)
      Program: {
        enter(path, state) {
          // Initialize plugin state
          state.cssRules = new Map();
          state.importedSilk = false;
        },
        exit(path, state) {
          // Store metadata for CSS extraction
          state.file.metadata.silk = {
            cssRules: Array.from(state.cssRules.values()),
          };
        },
      },
    },
  };
}
```

**Key Concepts:**
- **`path`**: Abstraction above node, provides link between nodes, scope info, and methods like `replaceWith()`, `remove()`, `skip()`
- **`state`**: Contains plugin options (`state.opts`), file metadata (`state.file.metadata`), and custom plugin state
- **`types` (t)**: Babel's utility for creating and checking AST node types

---

### 1.2 Traversing and Transforming CallExpression Nodes

**Detecting specific function calls:**

```javascript
CallExpression(path, state) {
  const { node } = path;

  // Check if callee is 'css' identifier
  if (t.isIdentifier(node.callee, { name: 'css' })) {
    // Verify it's imported from @sylphx/silk
    const binding = path.scope.getBinding('css');
    if (!binding) return;

    const importPath = binding.path.parent;
    if (
      t.isImportDeclaration(importPath) &&
      importPath.source.value === '@sylphx/silk'
    ) {
      // This is a css() call from @sylphx/silk
      this.transformCssCall(path, state);
    }
  }
}
```

**Alternative: Using `referencesImport()`**

```javascript
CallExpression(path, state) {
  const callee = path.get('callee');

  if (callee.referencesImport('@sylphx/silk', 'css')) {
    this.transformCssCall(path, state);
  }
}
```

---

### 1.3 Extracting Static Values from AST Nodes

**Using `path.evaluate()` for static evaluation:**

```javascript
function extractStaticValue(path) {
  const evaluation = path.evaluate();

  if (evaluation.confident) {
    // Value can be statically determined
    return evaluation.value;
  }

  // Value is dynamic (contains variables, function calls, etc.)
  return null;
}
```

**Example: Extracting object properties:**

```javascript
function extractStaticStyles(argumentPath, t) {
  const node = argumentPath.node;

  // Only process ObjectExpression
  if (!t.isObjectExpression(node)) {
    return null;
  }

  const styles = {};
  const dynamicProps = [];

  for (const prop of node.properties) {
    // Skip spread elements
    if (t.isSpreadElement(prop)) {
      dynamicProps.push(prop);
      continue;
    }

    // Get property key
    const key = prop.computed
      ? extractStaticValue(prop.key)
      : (t.isIdentifier(prop.key) ? prop.key.name : prop.key.value);

    if (key === null) {
      dynamicProps.push(prop);
      continue;
    }

    // Get property value
    const value = extractStaticValue(prop.value);

    if (value !== null) {
      styles[key] = value;
    } else {
      dynamicProps.push(prop);
    }
  }

  return { styles, dynamicProps };
}
```

**Using `ast-to-literal` library:**

```javascript
import astToLiteral from 'ast-to-literal';

function extractStaticStyles(argumentPath) {
  try {
    // Converts AST ObjectExpression to JS object
    const styles = astToLiteral(argumentPath.node);
    return { styles, dynamicProps: [] };
  } catch (error) {
    // Contains dynamic values
    return null;
  }
}
```

---

### 1.4 Replacing Function Calls with String Literals

**Basic replacement:**

```javascript
function replaceWithClassName(path, className, t) {
  path.replaceWith(t.stringLiteral(className));

  // Skip traversing the newly inserted node (prevent infinite loop)
  path.skip();
}
```

**Example transformation:**

```javascript
// Input:
const button = css({ bg: 'red', p: 4 });

// Transform to:
const button = 'silk_abc123';
```

**Implementation:**

```javascript
CallExpression(path, state) {
  const callee = path.get('callee');

  if (!callee.referencesImport('@sylphx/silk', 'css')) {
    return;
  }

  const args = path.get('arguments');
  if (args.length !== 1) return;

  const styleArg = args[0];
  const extracted = extractStaticStyles(styleArg, this.babel.types);

  if (!extracted || extracted.dynamicProps.length > 0) {
    // Cannot fully extract - leave as runtime call
    return;
  }

  // Generate CSS and class name
  const { css, className } = this.generateAtomicCSS(extracted.styles);

  // Store CSS for extraction
  state.cssRules.set(className, css);

  // Replace call with string literal
  path.replaceWith(this.babel.types.stringLiteral(className));
  path.skip();
}
```

---

### 1.5 Generating External Files During Compilation

**Using Babel's metadata API:**

```javascript
export default function babelPluginSilk(babel) {
  return {
    visitor: {
      Program: {
        exit(path, state) {
          // Collect all CSS rules
          const cssRules = Array.from(state.cssRules.values()).join('\n');

          // Store in metadata for bundler to access
          state.file.metadata.silk = {
            css: cssRules,
            classNames: Array.from(state.cssRules.keys()),
          };
        },
      },
    },
  };
}
```

**Accessing metadata in bundler:**

```javascript
// In Webpack/Vite plugin
const result = babel.transformSync(code, {
  filename: filepath,
  plugins: [[babelPluginSilk, options]],
});

const transformedCode = result.code;
const cssMetadata = result.metadata.silk;

if (cssMetadata && cssMetadata.css) {
  // Write to CSS file
  fs.writeFileSync('output.css', cssMetadata.css);
}
```

**Alternative: Direct file writing (not recommended):**

```javascript
import fs from 'fs';
import path from 'path';

Program: {
  exit(path, state) {
    const cssRules = Array.from(state.cssRules.values()).join('\n');
    const outputPath = path.join(state.opts.outputDir, 'silk.css');

    // Append to CSS file
    fs.appendFileSync(outputPath, cssRules + '\n');
  },
}
```

**Why metadata is preferred:**
- Bundlers can deduplicate CSS across files
- Supports code splitting and dynamic imports
- Better integration with build pipeline
- Avoids race conditions with parallel builds

---

## 2. StyleX Implementation Pattern

### 2.1 How StyleX's Babel Plugin Works

StyleX uses a multi-stage approach:

1. **Detection**: Finds all `stylex.create()` and `stylex.props()` calls
2. **Extraction**: Converts AST to JavaScript objects using static evaluation
3. **Processing**: Passes extracted styles to `@stylexjs/shared` for atomic CSS generation
4. **Transformation**: Replaces function calls with optimized runtime code
5. **Metadata**: Returns array of CSS rules via `file.metadata.stylex`

**Key Architecture:**

```
Source Code → Babel Plugin → AST Traversal
                             ↓
                        Static Extraction
                             ↓
                    @stylexjs/shared (style processing)
                             ↓
                    ┌────────┴────────┐
                    ↓                 ↓
            Atomic CSS Rules    Optimized JS Code
                    ↓                 ↓
              file.metadata      AST Replacement
```

---

### 2.2 Detecting `stylex.create()` Calls

**Pattern used by StyleX:**

```javascript
import * as t from '@babel/types';

CallExpression(path, state) {
  const callee = path.get('callee');

  // Handle: stylex.create()
  if (
    t.isMemberExpression(callee.node) &&
    t.isIdentifier(callee.node.object, { name: 'stylex' }) &&
    t.isIdentifier(callee.node.property, { name: 'create' })
  ) {
    const binding = path.scope.getBinding('stylex');
    if (binding && isStyleXImport(binding.path)) {
      this.transformStyleXCreate(path, state);
    }
  }
}

function isStyleXImport(bindingPath) {
  const parent = bindingPath.parent;
  return (
    t.isImportDeclaration(parent) &&
    parent.source.value === '@stylexjs/stylex'
  );
}
```

**Supporting multiple import patterns:**

```javascript
// Default import: import stylex from '@stylexjs/stylex'
// Named import: import { create } from '@stylexjs/stylex'
// Namespace import: import * as stylex from '@stylexjs/stylex'

function detectStyleXCall(path, functionName) {
  const callee = path.get('callee');

  // Namespace or default: stylex.create()
  if (callee.isMemberExpression()) {
    const object = callee.get('object');
    const property = callee.get('property');

    if (
      object.isIdentifier() &&
      property.isIdentifier({ name: functionName })
    ) {
      return object.referencesImport('@stylexjs/stylex', 'default') ||
             object.referencesImport('@stylexjs/stylex', '*');
    }
  }

  // Named import: create()
  if (callee.isIdentifier({ name: functionName })) {
    return callee.referencesImport('@stylexjs/stylex', functionName);
  }

  return false;
}
```

---

### 2.3 Extracting Static vs Dynamic Styles

**Static styles** (compile-time):
```javascript
const styles = stylex.create({
  button: {
    backgroundColor: 'red',
    padding: '10px',
  },
});
```

**Dynamic styles** (runtime):
```javascript
const styles = stylex.create({
  button: {
    backgroundColor: props.color, // Dynamic!
    padding: '10px',
  },
});
```

**Detection strategy:**

```javascript
function separateStaticAndDynamic(stylesObject, t) {
  const static = {};
  const dynamic = {};

  for (const [key, value] of Object.entries(stylesObject)) {
    if (typeof value === 'object' && value !== null) {
      // Nested style object
      const nested = separateStaticAndDynamic(value, t);
      if (Object.keys(nested.dynamic).length > 0) {
        dynamic[key] = nested;
      } else {
        static[key] = nested.static;
      }
    } else if (isStaticValue(value)) {
      static[key] = value;
    } else {
      dynamic[key] = value;
    }
  }

  return { static, dynamic };
}

function isStaticValue(value) {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null ||
    value === undefined
  );
}
```

**Handling at AST level:**

```javascript
function extractStylesFromAST(path, t) {
  const arg = path.get('arguments.0');

  if (!arg.isObjectExpression()) {
    return { static: null, dynamic: true };
  }

  const staticStyles = {};
  const dynamicProperties = [];

  for (const prop of arg.get('properties')) {
    if (prop.isSpreadElement()) {
      dynamicProperties.push(prop);
      continue;
    }

    const keyPath = prop.get('key');
    const valuePath = prop.get('value');

    // Try to evaluate value
    const evaluation = valuePath.evaluate();

    if (evaluation.confident) {
      const key = keyPath.node.name || keyPath.node.value;
      staticStyles[key] = evaluation.value;
    } else {
      dynamicProperties.push(prop);
    }
  }

  const hasOnlyStatic = dynamicProperties.length === 0;

  return {
    static: hasOnlyStatic ? staticStyles : null,
    dynamic: !hasOnlyStatic,
    dynamicProperties,
  };
}
```

---

### 2.4 Generating Atomic CSS Class Names

**StyleX pattern: One class per property-value pair**

```javascript
// Input:
const styles = stylex.create({
  button: {
    backgroundColor: 'red',
    padding: '10px',
  },
});

// Generated CSS:
.x1e2f3g { background-color: red; }
.x4h5i6j { padding: 10px; }

// Runtime code:
const styles = {
  button: 'x1e2f3g x4h5i6j',
};
```

**Implementation:**

```javascript
import { createHash } from 'crypto';

function generateAtomicClassName(property, value, prefix = 'x') {
  const content = `${property}:${value}`;
  const hash = createHash('sha256')
    .update(content)
    .digest('base64')
    .slice(0, 6)
    .replace(/[+/=]/g, (m) => {
      return { '+': 'a', '/': 'b', '=': 'c' }[m];
    });

  return `${prefix}${hash}`;
}

function generateAtomicCSS(styles) {
  const cssRules = new Map();
  const classNames = [];

  for (const [property, value] of Object.entries(styles)) {
    const className = generateAtomicClassName(property, value);
    const cssProperty = camelToKebab(property);
    const cssValue = normalizeValue(value);
    const rule = `.${className} { ${cssProperty}: ${cssValue}; }`;

    cssRules.set(className, rule);
    classNames.push(className);
  }

  return {
    classNames,
    cssRules,
    className: classNames.join(' '),
  };
}

function camelToKebab(str) {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

function normalizeValue(value) {
  if (typeof value === 'number') {
    return `${value}px`;
  }
  return value;
}
```

**Using MurmurHash2 (like @emotion/hash):**

```javascript
// Faster than crypto.createHash, smaller output
function murmurHash2(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h = Math.imul(h ^ c, 0x5bd1e995);
    h ^= h >>> 13;
  }
  return (h >>> 0).toString(36);
}

function generateAtomicClassName(property, value) {
  return `x${murmurHash2(`${property}:${value}`)}`;
}
```

---

### 2.5 Handling Runtime Fallbacks for Dynamic Values

**Strategy: Partial compilation**

```javascript
// Input:
const styles = css({
  bg: props.color,     // Dynamic
  p: 4,                // Static
  m: 2,                // Static
});

// Output:
const styles = cx('silk_p4 silk_m2', { backgroundColor: props.color });
```

**Implementation:**

```javascript
function transformCssCall(path, state, t) {
  const extracted = extractStylesFromAST(path, t);

  if (!extracted.static && !extracted.dynamic) {
    // No styles at all
    return;
  }

  if (extracted.static && !extracted.dynamic) {
    // Fully static - compile to string literal
    const { className, cssRules } = generateAtomicCSS(extracted.static);

    for (const [cls, rule] of cssRules) {
      state.cssRules.set(cls, rule);
    }

    path.replaceWith(t.stringLiteral(className));
    path.skip();
  } else {
    // Has dynamic values - partial compilation
    const staticClassNames = extracted.static
      ? generateAtomicCSS(extracted.static).classNames
      : [];

    // Build runtime object with only dynamic properties
    const dynamicProps = t.objectExpression(
      extracted.dynamicProperties.map((prop) => prop.node)
    );

    // Replace with: cx('static classes', { dynamic: props })
    const cxCall = t.callExpression(
      t.identifier('cx'),
      [
        t.stringLiteral(staticClassNames.join(' ')),
        dynamicProps,
      ]
    );

    path.replaceWith(cxCall);
    path.skip();
  }
}
```

**Alternative: Keep css() call but inject static classes:**

```javascript
// Output:
const styles = css(
  { bg: props.color },
  '__static_silk_p4 silk_m2'
);

// Runtime implementation:
function css(styles, staticClasses = '') {
  const dynamicStyle = { backgroundColor: styles.bg };
  return {
    className: staticClasses,
    style: dynamicStyle,
  };
}
```

---

## 3. Key Technical Challenges

### 3.1 Detecting Static vs Dynamic CSS Calls

**Challenge:** Determining if a `css()` call can be fully compiled at build-time.

**Solution patterns:**

**Pattern 1: Conservative (safe)**
```javascript
function canFullyCompile(path) {
  const arg = path.get('arguments.0');

  // Only compile ObjectExpression literals
  if (!arg.isObjectExpression()) return false;

  // Check all properties are static
  for (const prop of arg.get('properties')) {
    if (prop.isSpreadElement()) return false;
    if (prop.node.computed) return false;

    const value = prop.get('value');
    const evaluation = value.evaluate();

    if (!evaluation.confident) return false;
  }

  return true;
}
```

**Pattern 2: Aggressive (partial compilation)**
```javascript
function compilableLevel(path) {
  const arg = path.get('arguments.0');

  if (!arg.isObjectExpression()) {
    return 'none'; // Cannot compile at all
  }

  let hasStatic = false;
  let hasDynamic = false;

  for (const prop of arg.get('properties')) {
    if (prop.isSpreadElement() || prop.node.computed) {
      hasDynamic = true;
      continue;
    }

    const value = prop.get('value');
    if (value.evaluate().confident) {
      hasStatic = true;
    } else {
      hasDynamic = true;
    }
  }

  if (hasStatic && !hasDynamic) return 'full';
  if (hasStatic && hasDynamic) return 'partial';
  return 'none';
}
```

---

### 3.2 Handling Object Spread and Computed Properties

**Challenge:**

```javascript
const baseStyles = { p: 4 };
const button = css({ ...baseStyles, bg: 'red' });

const key = 'backgroundColor';
const dynamic = css({ [key]: 'blue' });
```

**Solution:**

```javascript
function resolveSpreadElements(path, t) {
  const arg = path.get('arguments.0');
  if (!arg.isObjectExpression()) return null;

  const resolvedProps = new Map();

  for (const prop of arg.get('properties')) {
    if (prop.isSpreadElement()) {
      // Try to resolve spread source
      const argument = prop.get('argument');
      const evaluation = argument.evaluate();

      if (evaluation.confident && typeof evaluation.value === 'object') {
        // Spread is a static object
        for (const [k, v] of Object.entries(evaluation.value)) {
          resolvedProps.set(k, v);
        }
      } else {
        // Dynamic spread - cannot compile
        return null;
      }
    } else {
      // Regular property
      const key = prop.node.computed
        ? prop.get('key').evaluate().value
        : (prop.node.key.name || prop.node.key.value);

      const value = prop.get('value').evaluate();

      if (key === undefined || !value.confident) {
        return null;
      }

      resolvedProps.set(key, value.value);
    }
  }

  return Object.fromEntries(resolvedProps);
}
```

**Advanced: Follow variable references:**

```javascript
function resolveIdentifierToValue(identPath, scope) {
  if (!identPath.isIdentifier()) return null;

  const binding = scope.getBinding(identPath.node.name);
  if (!binding) return null;

  const bindingPath = binding.path;

  // Variable declaration
  if (bindingPath.isVariableDeclarator()) {
    const init = bindingPath.get('init');
    return init.evaluate();
  }

  // Import (cannot resolve)
  if (bindingPath.isImportSpecifier()) {
    return null;
  }

  return null;
}
```

---

### 3.3 Dealing with Imported/Shared Style Objects

**Challenge:**

```javascript
// styles.ts
export const baseButton = { p: 4, rounded: 8 };

// Button.tsx
import { baseButton } from './styles';
const button = css({ ...baseButton, bg: 'red' });
```

**Solution 1: Require inline definitions (StyleX approach)**
```javascript
// Only compile if styles are defined inline
if (hasImportedSpread(path)) {
  // Leave as runtime call
  return;
}
```

**Solution 2: Module resolution (complex)**
```javascript
function resolveImportedValue(binding, state) {
  if (!binding.path.isImportSpecifier()) return null;

  const importDecl = binding.path.parentPath;
  const source = importDecl.node.source.value;

  // Resolve module path
  const modulePath = resolveModulePath(source, state.filename);

  // Parse and extract export
  const moduleCode = fs.readFileSync(modulePath, 'utf-8');
  const moduleAst = babel.parse(moduleCode);

  // Find export
  const exportValue = findExportValue(moduleAst, binding.node.imported.name);

  return exportValue;
}
```

**Solution 3: Pre-compilation pass**
```javascript
// First pass: Extract all style exports
// Second pass: Inline them during compilation

// Plugin option:
{
  styleModules: {
    './styles': {
      baseButton: { p: 4, rounded: 8 },
    },
  },
}
```

---

### 3.4 Managing CSS File Generation

**Challenge:** Multiple files generating CSS, need deduplication and ordering.

**Solution: Metadata aggregation**

```javascript
// Babel plugin: Emit metadata
Program: {
  exit(path, state) {
    state.file.metadata.silk = {
      cssRules: Array.from(state.cssRules.entries()),
    };
  },
}

// Bundler plugin: Aggregate and deduplicate
class SilkWebpackPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('SilkPlugin', (compilation) => {
      compilation.hooks.afterOptimizeModules.tap('SilkPlugin', (modules) => {
        const allCssRules = new Map();

        // Collect CSS from all modules
        for (const module of modules) {
          const metadata = module.buildMeta?.silk;
          if (metadata && metadata.cssRules) {
            for (const [className, rule] of metadata.cssRules) {
              allCssRules.set(className, rule);
            }
          }
        }

        // Generate CSS file
        const css = Array.from(allCssRules.values()).join('\n');
        compilation.assets['silk.css'] = {
          source: () => css,
          size: () => css.length,
        };
      });
    });
  }
}
```

---

### 3.5 Hash Stability Across Rebuilds

**Challenge:** Class names must be deterministic for caching.

**Solution: Content-based hashing**

```javascript
// ❌ BAD: Counter-based (changes every build)
let counter = 0;
function generateClassName() {
  return `silk_${counter++}`;
}

// ✅ GOOD: Content-based hash
function generateClassName(property, value, prefix = 'silk') {
  const content = `${property}:${value}`;
  const hash = hashString(content);
  return `${prefix}_${hash}`;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}
```

**Advanced: Include file path for uniqueness**

```javascript
function generateClassName(property, value, filepath) {
  // Include filepath to prevent collisions across files
  const content = `${filepath}:${property}:${value}`;
  return `silk_${hashString(content)}`;
}
```

**Development vs Production:**

```javascript
function generateClassName(property, value, options) {
  const { production, filepath } = options;

  if (production) {
    // Short hash for production
    const hash = hashString(`${property}:${value}`);
    return hash.slice(0, 6);
  } else {
    // Descriptive for development
    const filename = path.basename(filepath, path.extname(filepath));
    const hash = hashString(`${property}:${value}`).slice(0, 4);
    return `silk_${filename}_${property}_${hash}`;
  }
}
```

---

## 4. Implementation for Silk

### 4.1 Input/Output Examples

**Example 1: Simple static styles**

```typescript
// Input:
import { css } from '@sylphx/silk';

const button = css({ bg: 'red', p: 4 });

// Output (JavaScript):
const button = 'silk_bg_red_a7f3 silk_p_4_b2e1';

// Generated CSS:
.silk_bg_red_a7f3 { background-color: red; }
.silk_p_4_b2e1 { padding: 1rem; }
```

**Example 2: Dynamic styles**

```typescript
// Input:
const button = css({
  bg: props.color,  // dynamic
  p: 4,             // static
});

// Output:
const button = css(
  { bg: props.color },
  'silk_p_4_b2e1'
);

// Generated CSS:
.silk_p_4_b2e1 { padding: 1rem; }
```

**Example 3: Pseudo-selectors**

```typescript
// Input:
const button = css({
  bg: 'blue',
  _hover: { bg: 'darkblue' },
});

// Output:
const button = 'silk_bg_blue_c3d4 silk_hover_bg_darkblue_e5f6';

// Generated CSS:
.silk_bg_blue_c3d4 { background-color: blue; }
.silk_hover_bg_darkblue_e5f6:hover { background-color: darkblue; }
```

**Example 4: Responsive styles**

```typescript
// Input:
const box = css({
  w: { base: '100%', md: '50%' },
});

// Output:
const box = 'silk_w_100pct_base_a1b2 silk_w_50pct_md_c3d4';

// Generated CSS:
.silk_w_100pct_base_a1b2 { width: 100%; }
@media (min-width: 768px) {
  .silk_w_50pct_md_c3d4 { width: 50%; }
}
```

---

### 4.2 Configuration Options

```typescript
interface BabelPluginSilkOptions {
  /**
   * Enable production mode optimizations
   * - Short class names (a0, b1, etc.)
   * - Minified CSS output
   */
  production?: boolean;

  /**
   * Class name prefix
   * @default 'silk' in dev, '' in production
   */
  classPrefix?: string;

  /**
   * Import sources to transform
   * @default ['@sylphx/silk']
   */
  importSources?: string[];

  /**
   * Functions to transform
   * @default ['css', 'cx']
   */
  functions?: string[];

  /**
   * Output CSS to file during compilation
   * (Not recommended - use bundler integration instead)
   */
  outputFile?: string;

  /**
   * Generate source maps for CSS
   */
  sourceMaps?: boolean;

  /**
   * Runtime injection for development
   * Injects CSS via JavaScript
   */
  runtimeInjection?: boolean;
}
```

**Usage:**

```javascript
// .babelrc
{
  "plugins": [
    ["@sylphx/babel-plugin-silk", {
      "production": true,
      "classPrefix": "",
      "importSources": ["@sylphx/silk"]
    }]
  ]
}
```

---

## 5. Complete Code Examples

### 5.1 Basic Babel Plugin Skeleton

```javascript
import { createHash } from 'crypto';

export default function babelPluginSilk(babel) {
  const { types: t } = babel;

  return {
    name: 'babel-plugin-silk',

    visitor: {
      Program: {
        enter(path, state) {
          // Initialize plugin state
          state.cssRules = new Map();
          state.classNames = new Set();
        },

        exit(path, state) {
          // Store metadata for bundler
          state.file.metadata.silk = {
            cssRules: Array.from(state.cssRules.entries()),
            classNames: Array.from(state.classNames),
          };
        },
      },

      CallExpression(path, state) {
        this.handleCallExpression(path, state, t);
      },
    },

    // Helper methods
    handleCallExpression(path, state, t) {
      const callee = path.get('callee');

      // Check if it's css() from @sylphx/silk
      if (!callee.isIdentifier({ name: 'css' })) return;
      if (!callee.referencesImport('@sylphx/silk', 'css')) return;

      const args = path.get('arguments');
      if (args.length !== 1) return;

      const styleArg = args[0];
      const extracted = this.extractStaticStyles(styleArg, t);

      if (!extracted) {
        // Cannot extract - leave as runtime call
        return;
      }

      if (extracted.dynamicProps.length > 0) {
        // Partial compilation
        this.handlePartialCompilation(path, extracted, state, t);
      } else {
        // Full compilation
        this.handleFullCompilation(path, extracted.styles, state, t);
      }
    },

    extractStaticStyles(path, t) {
      if (!path.isObjectExpression()) return null;

      const styles = {};
      const dynamicProps = [];

      for (const prop of path.get('properties')) {
        if (prop.isSpreadElement()) {
          const arg = prop.get('argument');
          const evaluation = arg.evaluate();

          if (evaluation.confident && typeof evaluation.value === 'object') {
            Object.assign(styles, evaluation.value);
          } else {
            return null; // Dynamic spread
          }
          continue;
        }

        const key = prop.node.key.name || prop.node.key.value;
        const value = prop.get('value').evaluate();

        if (value.confident) {
          styles[key] = value.value;
        } else {
          dynamicProps.push(prop);
        }
      }

      return { styles, dynamicProps };
    },

    handleFullCompilation(path, styles, state, t) {
      const { classNames, cssRules } = this.generateAtomicCSS(
        styles,
        state.opts
      );

      // Store CSS rules
      for (const [className, rule] of cssRules) {
        state.cssRules.set(className, rule);
        state.classNames.add(className);
      }

      // Replace with string literal
      const className = classNames.join(' ');
      path.replaceWith(t.stringLiteral(className));
      path.skip();
    },

    handlePartialCompilation(path, extracted, state, t) {
      // Generate static classes
      const { classNames, cssRules } = this.generateAtomicCSS(
        extracted.styles,
        state.opts
      );

      for (const [className, rule] of cssRules) {
        state.cssRules.set(className, rule);
      }

      // Build dynamic object
      const dynamicObj = t.objectExpression(
        extracted.dynamicProps.map(p => p.node)
      );

      // Replace with: css(dynamic, 'static classes')
      path.get('arguments.0').replaceWith(dynamicObj);
      path.node.arguments.push(t.stringLiteral(classNames.join(' ')));
      path.skip();
    },

    generateAtomicCSS(styles, options = {}) {
      const prefix = options.production ? '' : (options.classPrefix || 'silk');
      const cssRules = new Map();
      const classNames = [];

      for (const [property, value] of Object.entries(styles)) {
        const className = this.generateClassName(property, value, prefix);
        const cssProperty = this.camelToKebab(property);
        const cssValue = this.normalizeValue(property, value);

        const rule = `.${className} { ${cssProperty}: ${cssValue}; }`;

        cssRules.set(className, rule);
        classNames.push(className);
      }

      return { classNames, cssRules };
    },

    generateClassName(property, value, prefix) {
      const content = `${property}:${value}`;
      const hash = createHash('sha256')
        .update(content)
        .digest('hex')
        .slice(0, 8);

      return prefix ? `${prefix}_${hash}` : hash;
    },

    camelToKebab(str) {
      return str.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
    },

    normalizeValue(property, value) {
      // Handle token resolution
      const needsPx = ['p', 'padding', 'margin', 'm', 'w', 'width', 'h', 'height'];
      if (needsPx.includes(property) && typeof value === 'number') {
        // 1 unit = 0.25rem (like Tailwind)
        return `${value * 0.25}rem`;
      }

      return String(value);
    },
  };
}
```

---

### 5.2 AST Transformation Examples

**Example 1: Replace css() with class name**

```javascript
// Input AST:
CallExpression {
  callee: Identifier { name: 'css' },
  arguments: [
    ObjectExpression {
      properties: [
        ObjectProperty {
          key: Identifier { name: 'bg' },
          value: StringLiteral { value: 'red' }
        }
      ]
    }
  ]
}

// Output AST:
StringLiteral { value: 'silk_abc123' }

// Code:
path.replaceWith(t.stringLiteral('silk_abc123'));
```

**Example 2: Handle cx() merging**

```javascript
// Input: cx('class1', css({ p: 4 }), condition && 'class2')

CallExpression(path, state) {
  const callee = path.get('callee');
  if (!callee.isIdentifier({ name: 'cx' })) return;

  const args = path.get('arguments');
  const newArgs = [];

  for (const arg of args) {
    if (arg.isCallExpression()) {
      const innerCallee = arg.get('callee');
      if (innerCallee.isIdentifier({ name: 'css' })) {
        // Extract and compile css() call
        const className = this.compileCssCall(arg, state);
        if (className) {
          newArgs.push(t.stringLiteral(className));
          continue;
        }
      }
    }

    newArgs.push(arg.node);
  }

  // Replace arguments
  path.node.arguments = newArgs;
}
```

**Example 3: Handle spread objects**

```javascript
// Input: css({ ...baseStyles, bg: 'red' })

const spreadArg = prop.get('argument');
const binding = path.scope.getBinding(spreadArg.node.name);

if (binding && binding.path.isVariableDeclarator()) {
  const init = binding.path.get('init');
  const evaluation = init.evaluate();

  if (evaluation.confident) {
    // Inline the spread
    Object.assign(styles, evaluation.value);
  }
}
```

---

### 5.3 CSS Generation Logic

```javascript
class CSSGenerator {
  constructor(config) {
    this.config = config;
    this.propertyMap = {
      m: 'margin',
      mt: 'margin-top',
      mr: 'margin-right',
      mb: 'margin-bottom',
      ml: 'margin-left',
      mx: 'margin-inline',
      my: 'margin-block',
      p: 'padding',
      pt: 'padding-top',
      pr: 'padding-right',
      pb: 'padding-bottom',
      pl: 'padding-left',
      px: 'padding-inline',
      py: 'padding-block',
      w: 'width',
      h: 'height',
      bg: 'background-color',
      rounded: 'border-radius',
    };
  }

  generateAtomicCSS(styles) {
    const cssRules = new Map();
    const classNames = [];

    for (const [prop, value] of Object.entries(styles)) {
      // Handle pseudo-selectors
      if (prop.startsWith('_')) {
        const pseudo = this.getPseudoSelector(prop);
        const nestedRules = this.generateAtomicCSS(value);

        for (const [cls, rule] of nestedRules.cssRules) {
          const pseudoRule = rule.replace('}', `${pseudo} }`);
          cssRules.set(cls, pseudoRule);
          classNames.push(cls);
        }
        continue;
      }

      // Handle responsive values
      if (typeof value === 'object' && value !== null) {
        const breakpoints = this.config.breakpoints || {};

        for (const [breakpoint, val] of Object.entries(value)) {
          const className = this.generateClassName(prop, val, breakpoint);
          const cssProperty = this.resolveCSSProperty(prop);
          const cssValue = this.resolveCSSValue(prop, val);

          let rule;
          if (breakpoint === 'base') {
            rule = `.${className} { ${cssProperty}: ${cssValue}; }`;
          } else {
            const mediaQuery = breakpoints[breakpoint] || breakpoint;
            rule = `@media (min-width: ${mediaQuery}) { .${className} { ${cssProperty}: ${cssValue}; } }`;
          }

          cssRules.set(className, rule);
          classNames.push(className);
        }
        continue;
      }

      // Regular property
      const className = this.generateClassName(prop, value);
      const cssProperty = this.resolveCSSProperty(prop);
      const cssValue = this.resolveCSSValue(prop, value);
      const rule = `.${className} { ${cssProperty}: ${cssValue}; }`;

      cssRules.set(className, rule);
      classNames.push(className);
    }

    return { classNames, cssRules };
  }

  resolveCSSProperty(prop) {
    return this.propertyMap[prop] || this.camelToKebab(prop);
  }

  resolveCSSValue(prop, value) {
    // Check design tokens
    const tokens = this.config.tokens || {};

    // Color tokens
    if (['bg', 'backgroundColor', 'color', 'borderColor'].includes(prop)) {
      if (tokens.colors && tokens.colors[value]) {
        return tokens.colors[value];
      }
    }

    // Spacing tokens
    if (['p', 'padding', 'm', 'margin'].includes(prop)) {
      if (typeof value === 'number') {
        return `${value * 0.25}rem`; // Tailwind-style
      }
      if (tokens.spacing && tokens.spacing[value]) {
        return tokens.spacing[value];
      }
    }

    return String(value);
  }

  getPseudoSelector(prop) {
    const map = {
      _hover: ':hover',
      _focus: ':focus',
      _active: ':active',
      _disabled: ':disabled',
      _visited: ':visited',
      _focusVisible: ':focus-visible',
    };
    return map[prop] || prop.slice(1);
  }

  generateClassName(property, value, variant = '') {
    const prefix = this.config.production ? '' : 'silk';
    const content = `${property}:${value}:${variant}`;
    const hash = this.hash(content);

    if (this.config.production) {
      return hash.slice(0, 6);
    } else {
      return `${prefix}_${property}_${hash.slice(0, 4)}`;
    }
  }

  hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return (hash >>> 0).toString(36);
  }

  camelToKebab(str) {
    return str.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
  }
}
```

---

### 5.4 Metadata Collection

```javascript
// In Babel plugin
Program: {
  exit(path, state) {
    const cssArray = Array.from(state.cssRules.entries()).map(([className, rule]) => ({
      className,
      rule,
    }));

    state.file.metadata.silk = {
      css: cssArray,
      version: '1.0.0',
    };
  },
}

// In Webpack plugin
class SilkWebpackPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('Silk', (compilation) => {
      // Hook into module build
      compilation.hooks.succeedModule.tap('Silk', (module) => {
        if (module.buildMeta && module.buildMeta.silk) {
          this.collectCSS(module.buildMeta.silk);
        }
      });

      // Generate CSS file
      compilation.hooks.processAssets.tap(
        {
          name: 'Silk',
          stage: compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
        },
        (assets) => {
          const css = this.generateCSS();
          assets['silk.css'] = {
            source: () => css,
            size: () => css.length,
          };
        }
      );
    });
  }

  collectCSS(metadata) {
    for (const { className, rule } of metadata.css) {
      this.cssRules.set(className, rule);
    }
  }

  generateCSS() {
    return Array.from(this.cssRules.values()).join('\n');
  }
}

// In Vite plugin
export function silkVitePlugin() {
  const cssRules = new Map();

  return {
    name: 'vite-plugin-silk',

    transform(code, id) {
      if (!id.endsWith('.tsx') && !id.endsWith('.ts')) return null;

      const result = babel.transformSync(code, {
        filename: id,
        plugins: [babelPluginSilk],
      });

      if (result.metadata.silk) {
        for (const { className, rule } of result.metadata.silk.css) {
          cssRules.set(className, rule);
        }
      }

      return {
        code: result.code,
        map: result.map,
      };
    },

    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'silk.css',
        source: Array.from(cssRules.values()).join('\n'),
      });
    },
  };
}
```

---

## 6. Architecture Recommendations

### 6.1 Package Structure

```
@sylphx/babel-plugin-silk/
├── src/
│   ├── index.ts                 # Main plugin entry
│   ├── visitors/
│   │   ├── program.ts           # Program visitor (metadata)
│   │   ├── call-expression.ts   # css() call handler
│   │   └── import-declaration.ts # Track imports
│   ├── extractors/
│   │   ├── static-extractor.ts  # Extract static values
│   │   ├── spread-resolver.ts   # Resolve spreads
│   │   └── token-resolver.ts    # Resolve design tokens
│   ├── generators/
│   │   ├── css-generator.ts     # Generate atomic CSS
│   │   ├── class-name.ts        # Class name generation
│   │   └── hash.ts              # Hashing utilities
│   ├── utils/
│   │   ├── ast-helpers.ts       # AST utilities
│   │   └── property-map.ts      # Property mappings
│   └── types.ts                 # TypeScript types
├── test/
│   ├── fixtures/                # Test fixtures
│   └── transform.test.ts        # Tests
└── package.json
```

---

### 6.2 Separation of Concerns

**Layer 1: AST Detection & Traversal**
- Detect `css()` calls
- Track imports
- Navigate AST structure

**Layer 2: Static Analysis**
- Evaluate expressions
- Resolve spreads
- Follow variable bindings

**Layer 3: CSS Generation**
- Convert styles to CSS
- Generate class names
- Handle responsive/pseudo

**Layer 4: Code Transformation**
- Replace AST nodes
- Generate runtime fallbacks
- Emit metadata

---

### 6.3 Error Handling

```javascript
try {
  const extracted = this.extractStaticStyles(styleArg);

  if (!extracted) {
    // Cannot extract - emit warning in dev mode
    if (!state.opts.production) {
      console.warn(
        `[Silk] Could not compile css() call at ${state.filename}:${path.node.loc.start.line}`
      );
    }
    return; // Leave as runtime call
  }

  this.handleFullCompilation(path, extracted, state);
} catch (error) {
  // Fatal error - preserve original code
  console.error(`[Silk] Compilation error:`, error);
  return;
}
```

---

### 6.4 Testing Strategy

```javascript
import { transform } from '@babel/core';
import babelPluginSilk from '../src';

describe('babel-plugin-silk', () => {
  function testTransform(input, expected, options = {}) {
    const result = transform(input, {
      plugins: [[babelPluginSilk, options]],
    });

    expect(result.code).toBe(expected);
    expect(result.metadata.silk).toBeDefined();
  }

  it('transforms static css() calls', () => {
    testTransform(
      `const button = css({ bg: 'red', p: 4 });`,
      `const button = "silk_abc123 silk_def456";`
    );
  });

  it('handles dynamic values', () => {
    testTransform(
      `const button = css({ bg: props.color, p: 4 });`,
      `const button = css({ bg: props.color }, "silk_def456");`
    );
  });

  it('generates correct CSS', () => {
    const result = transform(`css({ bg: 'red' })`, {
      plugins: [babelPluginSilk],
    });

    expect(result.metadata.silk.css).toContainEqual({
      className: expect.any(String),
      rule: expect.stringContaining('background-color: red'),
    });
  });
});
```

---

## 7. Implementation Roadmap

### Phase 1: MVP (Weeks 1-2)

**Goal:** Basic static transformation working

- [x] Set up package structure
- [ ] Implement basic AST visitors
  - [ ] Program visitor (metadata)
  - [ ] CallExpression visitor
- [ ] Static extraction for simple objects
  - [ ] ObjectExpression parsing
  - [ ] Literal value extraction
- [ ] Basic CSS generation
  - [ ] Property mapping (bg → background-color)
  - [ ] Value normalization
  - [ ] Class name hashing
- [ ] String literal replacement
- [ ] Metadata emission
- [ ] Basic tests

**Success Criteria:**
```javascript
// This works:
const button = css({ bg: 'red', p: 4 });
// → const button = 'silk_abc123 silk_def456';
```

---

### Phase 2: Advanced Static Analysis (Weeks 3-4)

**Goal:** Handle complex static patterns

- [ ] Spread operator resolution
  - [ ] Static object spreads
  - [ ] Variable reference resolution
- [ ] Computed property support
- [ ] Pseudo-selector support (`_hover`, `_focus`)
- [ ] Responsive values
  - [ ] Object syntax: `{ base: '100%', md: '50%' }`
  - [ ] Media query generation
- [ ] Design token resolution
- [ ] Improved error messages

**Success Criteria:**
```javascript
// All of these work:
const base = { p: 4 };
const button = css({ ...base, bg: 'red' });

const hover = css({ _hover: { bg: 'blue' } });

const responsive = css({ w: { base: '100%', md: '50%' } });
```

---

### Phase 3: Dynamic Fallbacks (Week 5)

**Goal:** Graceful degradation for dynamic values

- [ ] Detect dynamic vs static properties
- [ ] Partial compilation
  - [ ] Extract static properties
  - [ ] Leave dynamic properties at runtime
- [ ] Runtime helper optimization
- [ ] cx() function support for merging

**Success Criteria:**
```javascript
// Partial compilation works:
const button = css({
  bg: props.color,  // dynamic
  p: 4,             // static
});
// → const button = css({ bg: props.color }, 'silk_p4');
```

---

### Phase 4: Bundler Integration (Week 6)

**Goal:** Full build pipeline integration

- [ ] Webpack plugin
  - [ ] Module metadata collection
  - [ ] CSS file generation
  - [ ] HMR support
- [ ] Vite plugin (already exists, integrate Babel transform)
- [ ] Rollup plugin
- [ ] Next.js plugin
- [ ] CSS deduplication across files
- [ ] Source maps

**Success Criteria:**
- Silk CSS extracts to external file
- No duplicate CSS rules
- HMR updates CSS without refresh

---

### Phase 5: Production Optimizations (Week 7)

**Goal:** Minimal bundle sizes

- [ ] Short class names in production
  - [ ] a0, b1, c2 style naming
  - [ ] Deterministic hashing
- [ ] CSS minification
- [ ] Dead code elimination
  - [ ] Remove unused css() imports
  - [ ] Tree-shake unused styles
- [ ] Critical CSS extraction
- [ ] Compression (Brotli)

**Success Criteria:**
- 30-40% smaller CSS output
- Class names are stable across builds
- Only used styles in output

---

### Phase 6: Developer Experience (Week 8)

**Goal:** Best-in-class DX

- [ ] Detailed error messages
- [ ] Development mode features
  - [ ] Descriptive class names
  - [ ] Source attribution (data attributes)
- [ ] VS Code extension
  - [ ] Syntax highlighting
  - [ ] IntelliSense
  - [ ] Go to definition
- [ ] Documentation
- [ ] Migration guide from runtime Silk

**Success Criteria:**
- Errors point to exact source location
- Dev mode class names are readable
- VS Code provides autocomplete

---

### Phase 7: Advanced Features (Weeks 9-10)

**Goal:** Feature parity with competitors

- [ ] Component variants (CVA-style)
- [ ] Slots/compound components
- [ ] CSS custom properties (theming)
- [ ] Container queries
- [ ] Cascade layers
- [ ] Import resolution for shared styles
- [ ] Monorepo support

**Success Criteria:**
- Complex UI libraries can use Silk
- Theming system works at build time
- Shared style libraries compile correctly

---

## Appendix: Key Resources

### Documentation
- [Babel Plugin Handbook](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md)
- [Babel Types API](https://babeljs.io/docs/babel-types)
- [AST Explorer](https://astexplorer.net/) - Visualize AST

### Inspiration
- [StyleX Babel Plugin](https://github.com/facebook/stylex/tree/main/packages/babel-plugin)
- [Emotion Babel Plugin](https://github.com/emotion-js/emotion/tree/main/packages/babel-plugin)
- [Linaria](https://github.com/callstack/linaria)
- [Vanilla Extract](https://github.com/vanilla-extract-css/vanilla-extract)

### Libraries
- `@babel/core` - Babel transformation
- `@babel/types` - AST node utilities
- `@babel/traverse` - AST traversal
- `@emotion/hash` - Fast hashing (MurmurHash2)
- `ast-to-literal` - AST to JS object conversion

---

## Summary

Building a Babel plugin for CSS-in-JS build-time compilation requires:

1. **AST Mastery**: Understanding visitor pattern, path manipulation, and node types
2. **Static Analysis**: Evaluating expressions, resolving spreads, following bindings
3. **CSS Generation**: Atomic class naming, hashing, deduplication
4. **Metadata System**: Passing data from plugin to bundler
5. **Error Handling**: Graceful degradation for dynamic values
6. **Build Integration**: Working with Webpack/Vite/Rollup

The StyleX pattern of **atomic CSS + compile-time extraction** provides the best performance characteristics, but requires careful handling of edge cases like spreads, imports, and dynamic values.

This guide provides a complete roadmap from basic AST transformation to production-ready build tool. Start with Phase 1 (MVP) and iterate based on real-world usage.
