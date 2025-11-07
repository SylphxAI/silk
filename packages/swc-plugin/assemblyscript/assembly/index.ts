/**
 * Silk CSS Transformation (AssemblyScript)
 *
 * This module handles CSS generation logic in AssemblyScript,
 * which compiles to WebAssembly for use in the Rust SWC plugin.
 */

// Property shorthand mappings
const PROPERTY_MAP = new Map<string, string>();
PROPERTY_MAP.set('m', 'margin');
PROPERTY_MAP.set('mt', 'margin-top');
PROPERTY_MAP.set('mr', 'margin-right');
PROPERTY_MAP.set('mb', 'margin-bottom');
PROPERTY_MAP.set('ml', 'margin-left');
PROPERTY_MAP.set('mx', 'margin-inline');
PROPERTY_MAP.set('my', 'margin-block');
PROPERTY_MAP.set('p', 'padding');
PROPERTY_MAP.set('pt', 'padding-top');
PROPERTY_MAP.set('pr', 'padding-right');
PROPERTY_MAP.set('pb', 'padding-bottom');
PROPERTY_MAP.set('pl', 'padding-left');
PROPERTY_MAP.set('px', 'padding-inline');
PROPERTY_MAP.set('py', 'padding-block');
PROPERTY_MAP.set('w', 'width');
PROPERTY_MAP.set('h', 'height');
PROPERTY_MAP.set('minW', 'min-width');
PROPERTY_MAP.set('minH', 'min-height');
PROPERTY_MAP.set('maxW', 'max-width');
PROPERTY_MAP.set('maxH', 'max-height');
PROPERTY_MAP.set('bg', 'background-color');
PROPERTY_MAP.set('bgColor', 'background-color');
PROPERTY_MAP.set('rounded', 'border-radius');

/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str: string): string {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const char = str.charAt(i);
    const code = str.charCodeAt(i);
    if (code >= 65 && code <= 90) { // A-Z
      result += '-' + char.toLowerCase();
    } else {
      result += char;
    }
  }
  return result;
}

/**
 * Resolve CSS property name from shorthand
 */
function resolveCSSProperty(property: string): string {
  if (PROPERTY_MAP.has(property)) {
    return PROPERTY_MAP.get(property);
  }
  return camelToKebab(property);
}

/**
 * Normalize CSS value
 */
function normalizeCSSValue(property: string, value: string): string {
  // Check if it's a number string
  const num = parseFloat(value);
  if (!isNaN(num) && value === num.toString()) {
    // Spacing properties use 0.25rem units
    if (property.startsWith('p') ||
        property.startsWith('m') ||
        property === 'gap') {
      return (num * 0.25).toString() + 'rem';
    }

    // Unitless properties
    if (property === 'opacity' ||
        property === 'zIndex' ||
        property === 'fontWeight' ||
        property === 'lineHeight' ||
        property === 'flex') {
      return value;
    }

    // Default to px
    return value + 'px';
  }

  return value;
}

/**
 * Simple hash function for class names
 */
function hashString(str: string): string {
  let hash: u32 = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to hex and take first 4 characters
  const hex = hash.toString(16);
  return hex.substring(0, 4);
}

/**
 * Generate a class name for a property-value pair
 */
export function generateClassName(property: string, value: string, prefix: string): string {
  const cssProperty = resolveCSSProperty(property);
  const cssValue = normalizeCSSValue(property, value);

  // Create a safe value for class name (replace spaces, special chars)
  let safeValue = value;
  safeValue = safeValue.replace(' ', '_');
  safeValue = safeValue.replace('(', '');
  safeValue = safeValue.replace(')', '');
  safeValue = safeValue.replace('#', '');
  safeValue = safeValue.replace('.', '_');

  // Generate hash
  const hash = hashString(cssProperty + cssValue);

  // Format: prefix_property_value_hash
  return prefix + '_' + property + '_' + safeValue + '_' + hash;
}

/**
 * Generate CSS rule for a property-value pair
 */
export function generateCSSRule(className: string, property: string, value: string): string {
  const cssProperty = resolveCSSProperty(property);
  const cssValue = normalizeCSSValue(property, value);

  return '.' + className + ' { ' + cssProperty + ': ' + cssValue + '; }';
}

/**
 * Transform a style object to class names
 *
 * Input format: "bg:red,p:4,color:blue"
 * Output format: "silk_bg_red_a7f3 silk_p_4_b2e1 silk_color_blue_c9d2"
 */
export function transformStyles(styles: string, prefix: string): string {
  const pairs = styles.split(',');
  let classNames = '';

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    const colonIndex = pair.indexOf(':');

    if (colonIndex > 0) {
      const property = pair.substring(0, colonIndex);
      const value = pair.substring(colonIndex + 1);

      const className = generateClassName(property, value, prefix);

      if (i > 0) {
        classNames += ' ';
      }
      classNames += className;
    }
  }

  return classNames;
}

/**
 * Generate all CSS rules for a style string
 *
 * Input: "bg:red,p:4"
 * Output: ".silk_bg_red_a7f3{background-color:red}.silk_p_4_b2e1{padding:1rem}"
 */
export function generateAllCSS(styles: string, prefix: string): string {
  const pairs = styles.split(',');
  let css = '';

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    const colonIndex = pair.indexOf(':');

    if (colonIndex > 0) {
      const property = pair.substring(0, colonIndex);
      const value = pair.substring(colonIndex + 1);

      const className = generateClassName(property, value, prefix);
      const rule = generateCSSRule(className, property, value);

      css += rule;
    }
  }

  return css;
}
