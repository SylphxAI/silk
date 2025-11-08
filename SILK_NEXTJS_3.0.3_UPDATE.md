# 🔧 Silk Next.js 3.0.3 更新說明

## 發佈資訊
- **版本：** @sylphx/silk-nextjs@3.0.3
- **發佈日期：** 2024-11-09
- **類型：** Bug Fix (Patch)

---

## 🐛 修正問題

### 1. ✅ 修正 `lightningcss-wasm` 被 bundle 到 client-side

**問題：**
```
Module not found: Can't resolve 'child_process'
```

**原因：**
- Webpack 嘗試將 `lightningcss-wasm` bundle 到 browser code
- lightningcss-wasm 依賴 Node.js APIs (如 `child_process`)
- Client bundle 無法使用 Node.js modules

**修正：**
```typescript
// 在 client build 時，將 lightningcss-wasm 設為 external
if (!options.isServer) {
  config.externals.push({
    'lightningcss-wasm': 'commonjs lightningcss-wasm'
  });
}
```

### 2. ✅ 支援 root-level `app/` 目錄結構

**問題：**
```
Error: ENOENT: no such file or directory, scandir './src'
```

**原因：**
- Silk 預設掃描 `./src` 目錄
- 但 Next.js App Router 支援兩種結構：
  - `src/app/` (Silk 預設)
  - `app/` (root-level, Silk 未配置)

**修正：**
- `srcDir` 參數現已完全支援
- 可自由配置掃描目錄

---

## 📦 升級步驟

### 1. 更新 package

```bash
npm install @sylphx/silk-nextjs@latest
# or
pnpm update @sylphx/silk-nextjs
# or
yarn upgrade @sylphx/silk-nextjs
```

### 2. 檢查你的項目結構

#### 如果你使用 **root-level `app/` 目錄**：

```
your-project/
├── app/              ← app 在 root
│   ├── layout.tsx
│   └── page.tsx
├── components/
├── lib/
└── next.config.mjs
```

**必須配置 `srcDir`：**

```javascript
// next.config.mjs
import { withSilk } from '@sylphx/silk-nextjs';

export default withSilk({}, {
  srcDir: './app',    // ✅ 指定 root-level app/
  debug: true         // 可選：查看 debug 資訊
});
```

#### 如果你使用 **`src/app/` 目錄**（預設）：

```
your-project/
├── src/
│   └── app/          ← app 在 src/ 入面
│       ├── layout.tsx
│       └── page.tsx
└── next.config.mjs
```

**無需更改配置（預設已正確）：**

```javascript
// next.config.mjs
import { withSilk } from '@sylphx/silk-nextjs';

export default withSilk({
  // Your Next.js config
});
// srcDir 預設為 './src'，無需指定
```

### 3. 確認 CSS import 正確

```typescript
// app/layout.tsx (or src/app/layout.tsx)
import 'silk.css';  // ✅ Virtual module (webpack mode)

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### 4. 測試 build

```bash
# 測試 development
npm run dev

# 測試 production build
npm run build
```

**預期結果：**
```
✅ [Silk] Webpack mode: Injecting SilkWebpackPlugin
✅ [Silk] isServer: false
✅ [Silk] srcDir: ./app (或你的配置)
✅ [Silk] Added lightningcss-wasm to client externals
✅ [Silk] Generated 1234 bytes of CSS
```

---

## 🎯 常見問題排查

### ❌ 仍然出現 `ENOENT: ./src` 錯誤？

**原因：** 未配置 `srcDir`

**解決：**
```javascript
export default withSilk({}, {
  srcDir: './app',  // 改為你的實際目錄
  debug: true       // 開啟 debug 確認
});
```

### ❌ 仍然出現 `child_process` 錯誤？

**原因：** 可能仍使用舊版本

**解決：**
```bash
# 確認版本
npm list @sylphx/silk-nextjs
# 應該顯示 3.0.3

# 清理 cache 重新安裝
rm -rf node_modules package-lock.json
npm install
```

### ❌ CSS 沒有生成？

**原因：** srcDir 路徑錯誤

**解決：**
```javascript
export default withSilk({}, {
  srcDir: './app',  // 或 './src'，取決於你的結構
  debug: true       // 查看 debug 輸出確認掃描路徑
});
```

**查看 debug 輸出：**
```
[Silk] Scanning: ./app
[Silk] Found 5 files with css() calls
[Silk] Generated 1234 bytes of CSS
```

---

## 📚 完整配置參考

```javascript
// next.config.mjs
import { withSilk } from '@sylphx/silk-nextjs';

export default withSilk({
  // Next.js config
  reactStrictMode: true,
  // ...
}, {
  // Silk config
  srcDir: './app',             // 掃描目錄（預設 './src'）
  virtualModuleId: 'silk.css', // Virtual module 名稱
  minify: true,                // 壓縮 CSS（production 預設 true）
  debug: false,                // Debug logging

  // 進階選項
  optimize: true,              // 啟用 CSS 優化
  targets: {                   // Browserslist targets
    chrome: 100,
    firefox: 100,
    safari: 15
  }
});
```

---

## 🔗 相關資源

- **GitHub:** https://github.com/sylphxltd/silk
- **npm:** https://www.npmjs.com/package/@sylphx/silk-nextjs
- **文檔:** `/Users/kyle/new_project/NEXTJS_ROOT_APP_DIRECTORY.md`
- **Changelog:** `/Users/kyle/new_project/packages/nextjs-plugin/CHANGELOG.md`

---

## 💬 需要幫助？

如遇問題，請提供：
1. Next.js 版本
2. 項目目錄結構 (`app/` or `src/app/`)
3. `next.config.mjs` 配置
4. 完整錯誤訊息
5. Debug log (`debug: true` 的輸出)

**GitHub Issues:** https://github.com/sylphxltd/silk/issues
