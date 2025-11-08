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

/// Simple hash function for class names
fn hash_string(s: &str) -> String {
    let mut hash: u32 = 0;
    for ch in s.chars() {
        hash = hash.wrapping_shl(5).wrapping_sub(hash).wrapping_add(ch as u32);
    }
    format!("{:x}", hash).chars().take(4).collect()
}

/// Generate class name for property-value pair
pub fn generate_class_name(property: &str, value: &str, prefix: &str) -> String {
    let css_property = resolve_css_property(property);
    let css_value = normalize_css_value(property, value);

    // Create safe value for class name
    let safe_value = value
        .replace(' ', "_")
        .replace('(', "")
        .replace(')', "")
        .replace('#', "")
        .replace('.', "_");

    let hash = hash_string(&format!("{}{}", css_property, css_value));

    format!("{}_{}_{}_{}", prefix, property, safe_value, hash)
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
                    PropName::Ident(ident) => ident.sym.to_string(),
                    PropName::Str(s) => s.value.to_string(),
                    _ => continue,
                };

                // Get property value (only handle string and number literals for now)
                let prop_value = match &*kv.value {
                    Expr::Lit(Lit::Str(s)) => s.value.to_string(),
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
                                &self.config.class_prefix,
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
    fn test_generate_class_name() {
        let class_name = generate_class_name("bg", "red", "silk");
        assert!(class_name.starts_with("silk_bg_red_"));
        assert_eq!(class_name.split('_').count(), 4); // prefix_prop_value_hash
    }

    #[test]
    fn test_generate_css_rule() {
        let class_name = "silk_bg_red_a7f3";
        let rule = generate_css_rule(class_name, "bg", "red");
        assert_eq!(rule, ".silk_bg_red_a7f3 { background-color: red; }");
    }
}
