# ZenCSS React Configuration Setup

## ✨ Simplified API (Recommended)

### Option 1: 最簡潔方式（推薦）

直接在 `createZenReact` 中定義 config：

```typescript
// zen.config.ts
import { defineConfig } from '@sylphx/zencss'
import { createZenReact } from '@sylphx/zencss-react'

// ✅ 最簡潔：直接傳入 defineConfig 結果
export const { styled, Box, Flex, Grid, Text, css, cx } = createZenReact(
  defineConfig({
    colors: {
      brand: { 500: '#3b82f6' },
      gray: { 900: '#111827' }
    },
    spacing: { 4: '1rem', 8: '2rem' },
    fontSizes: { base: '1rem', lg: '1.125rem' }
  } as const)
)
```

**優點：**
- ✅ 最少代碼（3 行）
- ✅ 無中間變量
- ✅ 完整類型推導

**使用場景：**
- 99% 的普通使用場景
- 不需要在其他地方引用 config type

### Option 2: 需要導出 Config Type

如果需要在其他地方使用 config type（例如創建自定義 utilities）：

```typescript
// zen.config.ts
import { defineConfig } from '@sylphx/zencss'
import { createZenReact } from '@sylphx/zencss-react'

const config = defineConfig({
  colors: {
    brand: { 500: '#3b82f6' },
    gray: { 900: '#111827' }
  },
  spacing: { 4: '1rem', 8: '2rem' }
} as const)

export const { styled, Box, Flex, Grid, Text, css, cx } = createZenReact(config)

// 導出 config type 供其他地方使用
export type Config = typeof config
```

**優點：**
- ✅ 可以導出 Config type
- ✅ 可以在其他文件中引用 config

**使用場景：**
- 需要基於 config 創建自定義工具
- 需要在測試中引用 config type
- 需要擴展 ZenCSS 功能

**特點：**
- ✅ 一行代碼創建所有組件
- ✅ 自動處理所有類型註解
- ✅ JSX 中完整的類型推導
- ✅ 無需手動管理複雜的類型註解

## 🔧 Manual API (Advanced)

如果你需要更多控制，可以使用手動 API：

```typescript
// zen.config.ts
import { defineConfig, createStyleSystem } from '@sylphx/zencss'
import { createReactStyleSystem } from '@sylphx/zencss-react'

const config = defineConfig({
  colors: { brand: { 500: '#3b82f6' } }
} as const)

export type Config = typeof config

// 手動創建 style system
const styleSystem = createStyleSystem<Config>(config)

// 手動創建 React system
const reactSystem = createReactStyleSystem<Config>(styleSystem)

// 手動類型註解（確保 JSX 中的類型推導）
type ZenStyledComponent<E extends keyof JSX.IntrinsicElements> = ReturnType<
  typeof reactSystem.styled<E>
>

export const styled = reactSystem.styled
export const Box: ZenStyledComponent<'div'> = reactSystem.Box
export const Flex: ZenStyledComponent<'div'> = reactSystem.Flex
export const Grid: ZenStyledComponent<'div'> = reactSystem.Grid
export const Text: ZenStyledComponent<'span'> = reactSystem.Text
export const css = reactSystem.css
export const cx = reactSystem.cx

// 高級用例：訪問底層系統
export { styleSystem, reactSystem }
```

**使用場景：**
- 需要訪問底層的 `styleSystem` 或 `reactSystem`
- 需要在創建 React components 前對 style system 進行額外配置
- 需要創建自定義的 styled components factory

## 📊 對比

| 功能 | Option 1 (最簡) | Option 2 (導出 Type) | Manual API |
|------|----------------|---------------------|------------|
| **代碼行數** | ~3 行 | ~5 行 | ~20 行 |
| **中間變量** | ❌ 無 | ✅ 1 個 | ✅ 多個 |
| **導出 Config Type** | ❌ 不支持 | ✅ 支持 | ✅ 支持 |
| **類型推導** | ✅ 自動 | ✅ 自動 | ✅ 手動註解 |
| **JSX 類型** | ✅ 完整 | ✅ 完整 | ✅ 完整 |
| **訪問底層系統** | ❌ 不支持* | ❌ 不支持* | ✅ 支持 |
| **推薦場景** | 大部分使用場景 | 需要 Config Type | 高級用例 |

\* 注意：`createZenReact` 也會返回 `styleSystem` 和 `reactSystem`，如果需要的話可以解構出來：

```typescript
export const { styled, Box, Flex, Grid, Text, css, cx, styleSystem, reactSystem } = createZenReact(config)
```

## 🎯 推薦實踐

**大部分項目使用 Simplified API:**

```typescript
// zen.config.ts - 簡單清晰
import { defineConfig } from '@sylphx/zencss'
import { createZenReact } from '@sylphx/zencss-react'

const config = defineConfig({
  // ... your design tokens
} as const)

export const { styled, Box, Flex, Grid, Text, css, cx } = createZenReact(config)
```

**高級需求使用 Manual API 或混合使用:**

```typescript
// zen.config.ts - 需要自定義時
import { defineConfig } from '@sylphx/zencss'
import { createZenReact } from '@sylphx/zencss-react'

const config = defineConfig({
  // ... your design tokens
} as const)

// 使用 simplified API，但解構出底層系統供高級用例
export const {
  styled, Box, Flex, Grid, Text, css, cx,
  styleSystem,  // 供高級用例使用
  reactSystem   // 供高級用例使用
} = createZenReact(config)

// 例如：創建自定義的 utility
export function customUtility() {
  return styleSystem.css({ /* ... */ })
}
```

## ✅ Migration Guide

### 遷移到最簡潔方式（Option 1）

**從舊語法遷移到新語法：**

```diff
// zen.config.ts
  import { defineConfig } from '@sylphx/zencss'
- import { createStyleSystem } from '@sylphx/zencss'
- import { createReactStyleSystem } from '@sylphx/zencss-react'
+ import { createZenReact } from '@sylphx/zencss-react'

- const config = defineConfig({
+ export const { styled, Box, Flex, Grid, Text, css, cx } = createZenReact(
+   defineConfig({
-   // ... your config
- } as const)
+     // ... your config
+   } as const)
+ )

- export type Config = typeof config
- const styleSystem = createStyleSystem<Config>(config)
- const reactSystem = createReactStyleSystem<Config>(styleSystem)
- type ZenStyledComponent<E extends keyof JSX.IntrinsicElements> = ReturnType<...>
- export const styled = reactSystem.styled
- export const Box: ZenStyledComponent<'div'> = reactSystem.Box
- export const Flex: ZenStyledComponent<'div'> = reactSystem.Flex
- export const Grid: ZenStyledComponent<'div'> = reactSystem.Grid
- export const Text: ZenStyledComponent<'span'> = reactSystem.Text
- export const css = reactSystem.css
- export const cx = reactSystem.cx
```

**結果：**
- ❌ 刪除了 ~17 行樣板代碼
- ❌ 刪除了所有中間變量
- ✅ 保持相同的類型推導質量
- ✅ 保持相同的功能
- ✅ 更容易維護和理解

### 如果需要 Config Type（Option 2）

保留 `const config` 變量並導出類型：

```typescript
const config = defineConfig({
  // ... your config
} as const)

export const { styled, Box, Flex, Grid, Text, css, cx } = createZenReact(config)
export type Config = typeof config  // 供其他地方使用
```
