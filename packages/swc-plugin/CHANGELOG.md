# @sylphx/swc-plugin-silk

## 0.2.0

### Minor Changes

- 9c3e232: **🎉 Complete SWC Plugin Rewrite - Full Feature Parity with Babel Plugin**

  Version 0.2.0 is a complete rewrite with 100% feature parity and hash consistency with the Babel plugin.

  ## ✅ New Features

  - ✅ **Production mode** with short class names (6-7 chars)
  - ✅ **Invalid CSS class name fix** (0-9 → g-p digit mapping)
  - ✅ **MurmurHash2 + Base-36** (100% consistent with Babel plugin)
  - ✅ **Custom prefix support** for branding

  ## 📊 Hash Consistency

  All test cases produce **identical** class names:

  | Property | Value   | Babel   | SWC     | Status |
  | -------- | ------- | ------- | ------- | ------ |
  | bg       | "red"   | oqmaqr  | oqmaqr  | ✅     |
  | p        | "8"     | js61pc  | js61pc  | ✅     |
  | fontSize | "16px"  | h5ld1bc | h5ld1bc | ✅     |
  | maxWidth | "800px" | a9cob9  | a9cob9  | ✅     |

  ## 🔧 Breaking Changes

  - Hash algorithm changed to MurmurHash2 (from simple hash)
  - API: `generate_class_name()` now takes `&Config` parameter

  ## 🧪 Testing

  **All 14 tests passing** ✅

  - Hash consistency verified
  - Production mode tested
  - Digit mapping validated

  ***

  **Upgrade recommended** for all users on v0.1.0 (deprecated).
