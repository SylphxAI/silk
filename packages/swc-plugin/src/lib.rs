use swc_core::{
    ecma::{
        ast::*,
        visit::{VisitMut, VisitMutWith},
    },
    plugin::{plugin_transform, proxies::TransformPluginProgramMetadata},
    common::DUMMY_SP,
};
use serde::Deserialize;
use std::collections::HashMap;

/// Plugin configuration options
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Config {
    /// Enable production mode optimizations
    #[serde(default)]
    pub production: bool,

    /// Class name prefix
    #[serde(default = "default_prefix")]
    pub class_prefix: String,
}

fn default_prefix() -> String {
    "silk".to_string()
}

impl Default for Config {
    fn default() -> Self {
        Self {
            production: false,
            class_prefix: default_prefix(),
        }
    }
}

/// CSS property shorthand mappings
fn get_property_map() -> HashMap<&'static str, &'static str> {
    let mut map = HashMap::new();
    map.insert("m", "margin");
    map.insert("mt", "margin-top");
    map.insert("mr", "margin-right");
    map.insert("mb", "margin-bottom");
    map.insert("ml", "margin-left");
    map.insert("mx", "margin-inline");
    map.insert("my", "margin-block");
    map.insert("p", "padding");
    map.insert("pt", "padding-top");
    map.insert("pr", "padding-right");
    map.insert("pb", "padding-bottom");
    map.insert("pl", "padding-left");
    map.insert("px", "padding-inline");
    map.insert("py", "padding-block");
    map.insert("w", "width");
    map.insert("h", "height");
    map.insert("minW", "min-width");
    map.insert("minH", "min-height");
    map.insert("maxW", "max-width");
    map.insert("maxH", "max-height");
    map.insert("bg", "background-color");
    map.insert("bgColor", "background-color");
    map.insert("rounded", "border-radius");
    map
}

/// Convert camelCase to kebab-case
fn camel_to_kebab(s: &str) -> String {
    let mut result = String::new();
    for ch in s.chars() {
        if ch.is_uppercase() {
            result.push('-');
            result.push(ch.to_lowercase().next().unwrap());
        } else {
            result.push(ch);
        }
    }
    result
}

/// Resolve CSS property name from shorthand
pub fn resolve_css_property(property: &str) -> String {
    let map = get_property_map();
    map.get(property)
        .map(|s| s.to_string())
        .unwrap_or_else(|| camel_to_kebab(property))
}

/// Normalize CSS value (add units)
pub fn normalize_css_value(property: &str, value: &str) -> String {
    // Try to parse as number
    if let Ok(num) = value.parse::<f64>() {
        // Spacing properties use 0.25rem units
        if property.starts_with('p') || property.starts_with('m') || property == "gap" {
            return format!("{}rem", num * 0.25);
        }

        // Unitless properties
        if property == "opacity"
            || property == "zIndex"
            || property == "fontWeight"
            || property == "lineHeight"
            || property == "flex" {
            return value.to_string();
        }

        // Default to px
        return format!("{}px", value);
    }

    value.to_string()
}

/// MurmurHash2 implementation (matches @emotion/hash and Babel plugin)
/// Returns Base-36 encoded hash for optimal compression
///
/// JavaScript equivalent:
/// ```js
/// let h = 0
/// for (let i = 0; i < str.length; i++) {
///   const c = str.charCodeAt(i)
///   h = Math.imul(h ^ c, 0x5bd1e995)
///   h ^= h >>> 13
/// }
/// return (h >>> 0).toString(36)
/// ```
fn murmur_hash2(s: &str) -> String {
    let mut h: u32 = 0;

    for ch in s.chars() {
        let c = ch as u32;
        // IMPORTANT: Must XOR first, THEN multiply (not separate steps)
        h = (h ^ c).wrapping_mul(0x5bd1e995);
        h ^= h >> 13;
    }

    // Convert to Base-36 (0-9, a-z)
    base36_encode(h)
}

/// Encode u32 to Base-36 string (0-9, a-z)
fn base36_encode(mut num: u32) -> String {
    if num == 0 {
        return "0".to_string();
    }

    const CHARSET: &[u8] = b"0123456789abcdefghijklmnopqrstuvwxyz";
    let mut result = Vec::new();

    while num > 0 {
        result.push(CHARSET[(num % 36) as usize] as char);
        num /= 36;
    }

    result.reverse();
    result.into_iter().collect()
}

/// Hash property-value pair (matches Babel plugin format)
fn hash_property_value(property: &str, value: &str, variant: &str) -> String {
    // Format: "property:value:variant" (same as Babel plugin)
    let content = if variant.is_empty() {
        format!("{}:\"{}\":", property, value)
    } else {
        format!("{}:\"{}\":{}", property, value, variant)
    };
    murmur_hash2(&content)
}

/// Generate class name for property-value pair
/// Supports both development and production modes
pub fn generate_class_name(property: &str, value: &str, config: &Config) -> String {
    // IMPORTANT: Hash using ORIGINAL property and value (not resolved/normalized)
    // This matches Babel plugin behavior
    let hash = hash_property_value(property, value, "");

    if config.production {
        // Production mode: short hash (6-7 chars) with digit mapping
        // CSS class names cannot start with a digit, so map 0-9 to g-p
        let mut short_hash = hash.chars().take(8).collect::<String>();

        if let Some(first_char) = short_hash.chars().next() {
            if first_char.is_ascii_digit() {
                // Map 0→g, 1→h, 2→i, ..., 9→p
                let mapped_char = (b'g' + (first_char as u8 - b'0')) as char;
                short_hash = format!("{}{}", mapped_char, &short_hash[1..]);
            }
        }

        // Apply custom prefix if provided (for branding)
        if !config.class_prefix.is_empty() && config.class_prefix != "s" {
            return format!("{}{}", config.class_prefix, short_hash);
        }

        short_hash
    } else {
        // Development mode: descriptive class names
        let prefix = if config.class_prefix.is_empty() {
            "silk"
        } else {
            &config.class_prefix
        };

        // Create safe value for class name
        let safe_value = value
            .replace(' ', "_")
            .replace('(', "")
            .replace(')', "")
            .replace('#', "")
            .replace('.', "_")
            .chars()
            .take(10)
            .collect::<String>();

        let short_hash = hash.chars().take(4).collect::<String>();

        format!("{}_{}_{}_{}", prefix, property, safe_value, short_hash)
    }
}

/// Generate CSS rule for property-value pair
pub fn generate_css_rule(class_name: &str, property: &str, value: &str) -> String {
    let css_property = resolve_css_property(property);
    let css_value = normalize_css_value(property, value);

    format!(".{} {{ {}: {}; }}", class_name, css_property, css_value)
}

/// Extract style properties from ObjectExpression
pub fn extract_styles(obj: &ObjectLit) -> Vec<(String, String)> {
    let mut styles = Vec::new();

    for prop in &obj.props {
        if let PropOrSpread::Prop(prop) = prop {
            if let Prop::KeyValue(kv) = &**prop {
                // Get property name
                let prop_name = match &kv.key {
                    PropName::Ident(ident) => ident.sym.as_str().to_string(),
                    PropName::Str(s) => s.value.as_str().unwrap_or("").to_string(),
                    _ => continue,
                };

                // Get property value (only handle string and number literals for now)
                let prop_value = match &*kv.value {
                    Expr::Lit(Lit::Str(s)) => s.value.as_str().unwrap_or("").to_string(),
                    Expr::Lit(Lit::Num(n)) => n.value.to_string(),
                    _ => continue,
                };

                styles.push((prop_name, prop_value));
            }
        }
    }

    styles
}

/// Main transform visitor
pub struct SilkTransformVisitor {
    config: Config,
    css_rules: Vec<String>,
}

impl SilkTransformVisitor {
    pub fn new(config: Config) -> Self {
        Self {
            config,
            css_rules: Vec::new(),
        }
    }
}

impl VisitMut for SilkTransformVisitor {
    /// Visit expressions to transform css() calls
    fn visit_mut_expr(&mut self, expr: &mut Expr) {
        // First visit children
        expr.visit_mut_children_with(self);

        // Check if this is a css() call expression
        if let Expr::Call(call) = expr {
            if is_css_call(call) {
                // Extract first argument (should be ObjectExpression)
                if let Some(ExprOrSpread { spread: None, expr: arg }) = call.args.first() {
                    if let Expr::Object(obj) = &**arg {
                        // Extract styles from object
                        let styles = extract_styles(obj);

                        // Generate class names
                        let mut class_names = Vec::new();

                        for (property, value) in &styles {
                            let class_name = generate_class_name(
                                property,
                                value,
                                &self.config,
                            );

                            // Generate and collect CSS rule
                            let css_rule = generate_css_rule(&class_name, property, value);
                            self.css_rules.push(css_rule);

                            class_names.push(class_name);
                        }

                        // Replace CallExpression with StringLiteral
                        let class_string = class_names.join(" ");
                        *expr = Expr::Lit(Lit::Str(Str {
                            span: DUMMY_SP,
                            value: class_string.into(),
                            raw: None,
                        }));
                    }
                }
            }
        }
    }
}

/// Check if a CallExpr is a css() function call
fn is_css_call(call: &CallExpr) -> bool {
    match &call.callee {
        Callee::Expr(expr) => match &**expr {
            Expr::Ident(ident) => {
                // Direct call: css()
                ident.sym.as_ref() == "css"
            }
            Expr::Member(member) => {
                // Member call: styled.css() or system.css()
                match &member.prop {
                    MemberProp::Ident(ident) => ident.sym.as_ref() == "css",
                    _ => false,
                }
            }
            _ => false,
        },
        _ => false,
    }
}

/// SWC plugin entry point
#[plugin_transform]
pub fn process_transform(mut program: Program, metadata: TransformPluginProgramMetadata) -> Program {
    let config = metadata
        .get_transform_plugin_config()
        .and_then(|json_str| serde_json::from_str::<Config>(&json_str).ok())
        .unwrap_or_default();

    let mut visitor = SilkTransformVisitor::new(config);
    program.visit_mut_with(&mut visitor);
    program
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_default() {
        let config = Config::default();
        assert_eq!(config.production, false);
        assert_eq!(config.class_prefix, "silk");
    }

    #[test]
    fn test_config_deserialize() {
        let json = r#"{"production": true, "classPrefix": "custom"}"#;
        let config: Config = serde_json::from_str(json).unwrap();
        assert_eq!(config.production, true);
        assert_eq!(config.class_prefix, "custom");
    }

    #[test]
    fn test_camel_to_kebab() {
        assert_eq!(camel_to_kebab("backgroundColor"), "background-color");
        assert_eq!(camel_to_kebab("fontSize"), "font-size");
        assert_eq!(camel_to_kebab("padding"), "padding");
    }

    #[test]
    fn test_resolve_css_property() {
        assert_eq!(resolve_css_property("bg"), "background-color");
        assert_eq!(resolve_css_property("p"), "padding");
        assert_eq!(resolve_css_property("mt"), "margin-top");
        assert_eq!(resolve_css_property("fontSize"), "font-size");
    }

    #[test]
    fn test_normalize_css_value() {
        // Spacing properties
        assert_eq!(normalize_css_value("p", "4"), "1rem");
        assert_eq!(normalize_css_value("m", "2"), "0.5rem");

        // Unitless properties
        assert_eq!(normalize_css_value("opacity", "0.5"), "0.5");
        assert_eq!(normalize_css_value("zIndex", "10"), "10");

        // Default px
        assert_eq!(normalize_css_value("width", "200"), "200px");

        // String values
        assert_eq!(normalize_css_value("color", "red"), "red");
    }

    #[test]
    fn test_base36_encode() {
        assert_eq!(base36_encode(0), "0");
        assert_eq!(base36_encode(10), "a");
        assert_eq!(base36_encode(35), "z");
        assert_eq!(base36_encode(36), "10");
    }

    #[test]
    fn test_murmur_hash2() {
        // Test that hash is deterministic
        let hash1 = murmur_hash2("test");
        let hash2 = murmur_hash2("test");
        assert_eq!(hash1, hash2);

        // Test that different inputs produce different hashes
        let hash3 = murmur_hash2("different");
        assert_ne!(hash1, hash3);

        // Test Base-36 output (only 0-9, a-z)
        assert!(hash1.chars().all(|c| c.is_ascii_alphanumeric() && !c.is_uppercase()));
    }

    #[test]
    fn test_generate_class_name_dev_mode() {
        let config = Config {
            production: false,
            class_prefix: "silk".to_string(),
        };
        let class_name = generate_class_name("bg", "red", &config);
        assert!(class_name.starts_with("silk_bg_red_"));
        assert_eq!(class_name.split('_').count(), 4); // prefix_prop_value_hash
    }

    #[test]
    fn test_generate_class_name_production_mode() {
        let config = Config {
            production: true,
            class_prefix: String::new(),
        };
        let class_name = generate_class_name("bg", "red", &config);

        // Should be 6-8 characters
        assert!(class_name.len() >= 6 && class_name.len() <= 8);

        // Should start with a letter (not a digit)
        assert!(class_name.chars().next().unwrap().is_ascii_alphabetic());

        // Should only contain alphanumeric characters
        assert!(class_name.chars().all(|c| c.is_ascii_alphanumeric()));
    }

    #[test]
    fn test_digit_mapping() {
        let config = Config {
            production: true,
            class_prefix: String::new(),
        };

        // Test multiple properties to ensure we hit some that start with digits
        let properties = vec![
            ("p", "8"),
            ("m", "4"),
            ("bg", "red"),
            ("color", "blue"),
        ];

        for (prop, value) in properties {
            let class_name = generate_class_name(prop, value, &config);
            let first_char = class_name.chars().next().unwrap();

            // First character must be a letter (g-p if mapped from digit)
            assert!(first_char.is_ascii_alphabetic(),
                "Class name '{}' starts with non-letter '{}'", class_name, first_char);
        }
    }

    #[test]
    fn test_production_with_custom_prefix() {
        let config = Config {
            production: true,
            class_prefix: "app".to_string(),
        };
        let class_name = generate_class_name("bg", "red", &config);

        // Should start with custom prefix
        assert!(class_name.starts_with("app"));

        // Should be prefix + hash (9-11 chars)
        assert!(class_name.len() >= 9 && class_name.len() <= 11);
    }

    #[test]
    fn test_generate_css_rule() {
        let class_name = "silk_bg_red_a7f3";
        let rule = generate_css_rule(class_name, "bg", "red");
        assert_eq!(rule, ".silk_bg_red_a7f3 { background-color: red; }");
    }

    #[test]
    fn test_hash_consistency() {
        // Test that hashing the same property-value produces the same result
        let hash1 = hash_property_value("background-color", "red", "");
        let hash2 = hash_property_value("background-color", "red", "");
        assert_eq!(hash1, hash2);
    }

    #[test]
    fn test_babel_swc_consistency() {
        // Test that SWC plugin generates the same class names as Babel plugin
        // These expected values come from running test-hash-consistency.mjs
        let config = Config {
            production: true,
            class_prefix: String::new(),
        };

        let test_cases = vec![
            ("bg", "red", "oqmaqr"),
            ("p", "8", "js61pc"),
            ("p", "4", "azg4xx"),
            ("m", "2", "hyolz3s"),
            ("color", "blue", "h7qhtp"),
            ("fontSize", "16px", "h5ld1bc"),
            ("maxWidth", "800px", "a9cob9"),
            ("borderRadius", "12px", "hhxlwrj"),
        ];

        println!("\n🔍 Verifying Babel-SWC hash consistency:");
        println!("{}", "-".repeat(60));

        for (property, value, expected) in test_cases {
            let actual = generate_class_name(property, value, &config);
            let matches = actual == expected;

            println!(
                "{}: '{}' → {} (expected: {}) {}",
                format!("{:15}", property),
                format!("{:10}", value),
                actual,
                expected,
                if matches { "✅" } else { "❌" }
            );

            assert_eq!(
                actual, expected,
                "SWC generated '{}' but Babel generated '{}' for {}:'{}'",
                actual, expected, property, value
            );
        }

        println!("{}", "-".repeat(60));
        println!("✅ All class names match Babel plugin!\n");
    }

    #[test]
    fn test_extended_babel_swc_consistency() {
        // Extended test cases from extended-test-cases.mjs
        // Verifies more comprehensive set of properties and values
        let config = Config {
            production: true,
            class_prefix: String::new(),
        };

        let test_cases = vec![
            // Basic colors
            ("bg", "red", "oqmaqr"),
            ("bg", "blue", "ey45xi"),
            ("bg", "#ff0000", "mjp4tr"),
            ("bg", "rgb(255, 0, 0)", "hwc6q52"),
            // Spacing
            ("p", "0", "h44nbof"),
            ("p", "1", "oy0c2k"),
            ("p", "2", "is8hzn"),
            ("p", "4", "azg4xx"),
            ("p", "8", "js61pc"),
            ("p", "16", "hvblvfl"),
            // Typography
            ("fontSize", "12px", "hvklyzl"),
            ("fontSize", "14px", "lmoox4"),
            ("fontSize", "16px", "h5ld1bc"),
            ("fontWeight", "bold", "hq6c490"),
            ("fontWeight", "400", "fxvgn8"),
            // Layout
            ("width", "100%", "hoz6j9l"),
            ("width", "50%", "jkrbrw"),
            ("maxWidth", "800px", "a9cob9"),
            ("maxWidth", "1200px", "hh3nixn"),
            // Colors
            ("color", "white", "nixcd8"),
            ("color", "black", "ny9fyw"),
            ("color", "blue", "h7qhtp"),
            // Border
            ("borderRadius", "4px", "h3t7lck"),
            ("borderRadius", "8px", "d8vpdm"),
            ("borderRadius", "12px", "hhxlwrj"),
        ];

        println!("\n🔍 Extended Babel-SWC consistency verification ({} test cases):", test_cases.len());
        println!("{}", "-".repeat(70));

        let mut pass_count = 0;
        let mut _fail_count = 0;

        for (property, value, expected) in &test_cases {
            let actual = generate_class_name(property, value, &config);
            let matches = actual == *expected;

            if matches {
                pass_count += 1;
            } else {
                _fail_count += 1;
                println!(
                    "❌ {}: '{}' → {} (expected: {})",
                    format!("{:15}", property),
                    format!("{:20}", value),
                    actual,
                    expected
                );
            }

            assert_eq!(
                actual, *expected,
                "SWC generated '{}' but Babel generated '{}' for {}:'{}'",
                actual, expected, property, value
            );
        }

        println!("{}", "-".repeat(70));
        println!("✅ All {} test cases passed!\n", pass_count);
    }

    #[test]
    fn test_no_invalid_class_names_comprehensive() {
        // Test that NO class names start with digits across many test cases
        let config = Config {
            production: true,
            class_prefix: String::new(),
        };

        let test_values = vec![
            ("bg", "red"), ("bg", "blue"), ("bg", "#000"), ("bg", "#fff"),
            ("p", "0"), ("p", "1"), ("p", "2"), ("p", "4"), ("p", "8"), ("p", "16"),
            ("m", "0"), ("m", "1"), ("m", "2"), ("m", "4"), ("m", "8"),
            ("color", "white"), ("color", "black"), ("color", "red"), ("color", "blue"),
            ("fontSize", "12px"), ("fontSize", "14px"), ("fontSize", "16px"), ("fontSize", "18px"),
            ("width", "100%"), ("width", "50%"), ("width", "auto"),
            ("display", "flex"), ("display", "block"), ("display", "none"),
            ("position", "relative"), ("position", "absolute"), ("position", "fixed"),
            ("opacity", "0"), ("opacity", "0.5"), ("opacity", "1"),
            ("zIndex", "1"), ("zIndex", "10"), ("zIndex", "100"),
        ];

        println!("\n🔍 Testing {} cases for invalid class names:", test_values.len());

        let mut invalid_count = 0;

        for (property, value) in &test_values {
            let class_name = generate_class_name(property, value, &config);
            let first_char = class_name.chars().next().unwrap();

            if first_char.is_ascii_digit() {
                invalid_count += 1;
                println!("❌ INVALID: {} '{}' → .{} (starts with '{}')",
                    property, value, class_name, first_char);
            }
        }

        println!("✅ Valid: {}/{}", test_values.len() - invalid_count, test_values.len());
        println!("❌ Invalid: {}/{}\n", invalid_count, test_values.len());

        assert_eq!(invalid_count, 0,
            "Found {} class names starting with digits!", invalid_count);
    }
}
