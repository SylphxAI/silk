#[test]
fn test_basic_transformation() {
    // Test that css() calls are detected and transformed
    // This is a placeholder - actual integration tests would parse fixtures
}

#[test]
fn test_property_shorthand_expansion() {
    use swc_plugin_silk::resolve_css_property;

    // Test margin shorthands
    assert_eq!(resolve_css_property("m"), "margin");
    assert_eq!(resolve_css_property("mt"), "margin-top");
    assert_eq!(resolve_css_property("mr"), "margin-right");
    assert_eq!(resolve_css_property("mb"), "margin-bottom");
    assert_eq!(resolve_css_property("ml"), "margin-left");
    assert_eq!(resolve_css_property("mx"), "margin-inline");
    assert_eq!(resolve_css_property("my"), "margin-block");

    // Test padding shorthands
    assert_eq!(resolve_css_property("p"), "padding");
    assert_eq!(resolve_css_property("pt"), "padding-top");
    assert_eq!(resolve_css_property("pr"), "padding-right");
    assert_eq!(resolve_css_property("pb"), "padding-bottom");
    assert_eq!(resolve_css_property("pl"), "padding-left");
    assert_eq!(resolve_css_property("px"), "padding-inline");
    assert_eq!(resolve_css_property("py"), "padding-block");

    // Test size shorthands
    assert_eq!(resolve_css_property("w"), "width");
    assert_eq!(resolve_css_property("h"), "height");
    assert_eq!(resolve_css_property("minW"), "min-width");
    assert_eq!(resolve_css_property("minH"), "min-height");
    assert_eq!(resolve_css_property("maxW"), "max-width");
    assert_eq!(resolve_css_property("maxH"), "max-height");

    // Test background shorthands
    assert_eq!(resolve_css_property("bg"), "background-color");
    assert_eq!(resolve_css_property("bgColor"), "background-color");

    // Test border radius
    assert_eq!(resolve_css_property("rounded"), "border-radius");
}

#[test]
fn test_unit_handling() {
    use swc_plugin_silk::normalize_css_value;

    // Spacing properties should use 0.25rem units
    assert_eq!(normalize_css_value("p", "4"), "1rem");
    assert_eq!(normalize_css_value("p", "0"), "0rem");
    assert_eq!(normalize_css_value("p", "8"), "2rem");
    assert_eq!(normalize_css_value("m", "2"), "0.5rem");
    assert_eq!(normalize_css_value("gap", "4"), "1rem");

    // Unitless properties should stay unitless
    assert_eq!(normalize_css_value("opacity", "0.5"), "0.5");
    assert_eq!(normalize_css_value("zIndex", "10"), "10");
    assert_eq!(normalize_css_value("fontWeight", "600"), "600");
    assert_eq!(normalize_css_value("lineHeight", "1.5"), "1.5");
    assert_eq!(normalize_css_value("flex", "1"), "1");

    // Other properties should get px
    assert_eq!(normalize_css_value("width", "200"), "200px");
    assert_eq!(normalize_css_value("height", "100"), "100px");
    assert_eq!(normalize_css_value("top", "50"), "50px");
    assert_eq!(normalize_css_value("left", "25"), "25px");

    // String values should be unchanged
    assert_eq!(normalize_css_value("color", "red"), "red");
    assert_eq!(normalize_css_value("bg", "#ff0000"), "#ff0000");
    assert_eq!(
        normalize_css_value("color", "rgb(255, 0, 0)"),
        "rgb(255, 0, 0)"
    );
}

#[test]
fn test_class_name_generation() {
    use swc_plugin_silk::{generate_class_name, Config};

    let config = Config::default();

    // Test basic class name format
    let class1 = generate_class_name("bg", "red", &config);
    assert!(class1.starts_with("silk_bg_red_"));
    assert_eq!(class1.split('_').count(), 4); // prefix_prop_value_hash

    // Test with different prefix
    let custom_config = Config {
        production: false,
        class_prefix: "custom".to_string(),
    };
    let class2 = generate_class_name("p", "4", &custom_config);
    assert!(class2.starts_with("custom_p_4_"));

    // Test that same property+value generates same class name
    let class3a = generate_class_name("color", "blue", &config);
    let class3b = generate_class_name("color", "blue", &config);
    assert_eq!(class3a, class3b);

    // Test that different values generate different class names
    let class4a = generate_class_name("color", "red", &config);
    let class4b = generate_class_name("color", "blue", &config);
    assert_ne!(class4a, class4b);
}

#[test]
fn test_css_rule_generation() {
    use swc_plugin_silk::generate_css_rule;

    // Test basic rule generation
    let rule1 = generate_css_rule("silk_bg_red_a7f3", "bg", "red");
    assert_eq!(rule1, ".silk_bg_red_a7f3 { background-color: red; }");

    // Test with padding (should use rem)
    let rule2 = generate_css_rule("silk_p_4_b2e1", "p", "4");
    assert_eq!(rule2, ".silk_p_4_b2e1 { padding: 1rem; }");

    // Test with width (should use px)
    let rule3 = generate_css_rule("silk_width_200_c3d4", "width", "200");
    assert_eq!(rule3, ".silk_width_200_c3d4 { width: 200px; }");

    // Test camelCase conversion
    let rule4 = generate_css_rule("silk_fontSize_16_e5f6", "fontSize", "16");
    assert_eq!(rule4, ".silk_fontSize_16_e5f6 { font-size: 16px; }");
}

#[test]
fn test_empty_object() {
    use swc_plugin_silk::extract_styles;
    use swc_core::ecma::ast::ObjectLit;

    // Empty object should produce empty styles
    let empty_obj = ObjectLit {
        span: swc_core::common::DUMMY_SP,
        props: vec![],
    };

    let styles = extract_styles(&empty_obj);
    assert_eq!(styles.len(), 0);
}

#[test]
fn test_multiple_properties() {
    // Test that multiple properties in one css() call all get transformed
    // This would require parsing actual code, so it's a placeholder
}

#[test]
fn test_special_characters_in_values() {
    use swc_plugin_silk::{generate_class_name, Config};

    let config = Config::default();

    // Test values with special characters
    let class1 = generate_class_name("color", "rgb(255, 0, 0)", &config);
    assert!(class1.starts_with("silk_color_"));
    assert!(!class1.contains('(')); // Should be sanitized
    assert!(!class1.contains(')')); // Should be sanitized

    let class2 = generate_class_name("bg", "#ff0000", &config);
    assert!(class2.starts_with("silk_bg_"));
    assert!(!class2.contains('#')); // Should be sanitized

    let class3 = generate_class_name("boxShadow", "0 4px 6px rgba(0, 0, 0, 0.1)", &config);
    assert!(class3.starts_with("silk_boxShadow_"));
    assert!(!class3.contains('(')); // Should be sanitized
    assert!(!class3.contains(')')); // Should be sanitized
    assert!(!class3.contains('.')); // Should be sanitized (converted to _)
}

#[test]
fn test_config_custom_prefix() {
    use swc_plugin_silk::{generate_class_name, Config};

    let config1 = Config {
        production: false,
        class_prefix: "custom".to_string(),
    };
    let class1 = generate_class_name("bg", "red", &config1);
    assert!(class1.starts_with("custom_"));

    let config2 = Config {
        production: false,
        class_prefix: "my-app".to_string(),
    };
    let class2 = generate_class_name("bg", "red", &config2);
    assert!(class2.starts_with("my-app_"));
}

#[test]
fn test_hash_consistency() {
    use swc_plugin_silk::{generate_class_name, Config};

    let config = Config::default();

    // Same inputs should generate same hash
    let class1a = generate_class_name("bg", "red", &config);
    let class1b = generate_class_name("bg", "red", &config);
    assert_eq!(class1a, class1b);

    // Different inputs should generate different hashes
    let class2 = generate_class_name("bg", "blue", &config);
    assert_ne!(class1a, class2);

    let class3 = generate_class_name("color", "red", &config);
    assert_ne!(class1a, class3);
}
