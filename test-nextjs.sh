#!/bin/bash
set -e

echo "🔨 打包本地包..."

# 打包 core
cd /Users/kyle/new_project/packages/core
npm pack
CORE_TGZ=$(ls sylphx-silk-*.tgz | tail -1)

# 打包 nextjs
cd /Users/kyle/new_project/packages/nextjs-plugin
npm pack
NEXTJS_TGZ=$(ls sylphx-silk-nextjs-*.tgz | tail -1)

echo "✅ 打包完成"
echo "  Core: $CORE_TGZ"
echo "  Next.js: $NEXTJS_TGZ"

# 创建测试目录
echo ""
echo "📦 创建 Next.js 测试项目..."
cd /tmp
rm -rf silk-nextjs-local-test
mkdir silk-nextjs-local-test
cd silk-nextjs-local-test

# 初始化简单的 package.json
cat > package.json <<'EOF'
{
  "name": "silk-nextjs-test",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  }
}
EOF

# 安装 Next.js 和本地包
echo ""
echo "📥 安装依赖..."
npm install next@15 react@latest react-dom@latest
npm install "/Users/kyle/new_project/packages/core/$CORE_TGZ"
npm install "/Users/kyle/new_project/packages/nextjs-plugin/$NEXTJS_TGZ"

# 创建 Next.js 配置
echo ""
echo "⚙️  创建配置文件..."
cat > next.config.mjs <<'EOF'
import { withSilk } from '@sylphx/silk-nextjs';

export default withSilk({
  // Next.js config
}, {
  outputFile: 'silk.css',
  babelOptions: {
    production: true
  }
});
EOF

# 创建 app 目录
mkdir -p app

# 创建 layout
cat > app/layout.tsx <<'EOF'
import './silk.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
EOF

# 创建测试页面
cat > app/page.tsx <<'EOF'
import { createStyleSystem } from '@sylphx/silk';

const { css } = createStyleSystem({
  colors: {
    brand: { 500: '#3b82f6' },
    success: { 500: '#10b981' }
  }
});

export default function Home() {
  const container = css({
    p: 8,
    maxW: '1200px',
    mx: 'auto'
  });

  const title = css({
    fontSize: '32px',
    fontWeight: 'bold',
    color: 'brand.500',
    mb: 4
  });

  const button = css({
    bg: 'success.500',
    color: 'white',
    p: 4,
    rounded: 8,
    cursor: 'pointer',
    border: 'none'
  });

  return (
    <div className={container.className}>
      <h1 className={title.className}>
        Silk + Next.js 本地测试
      </h1>
      <button className={button.className}>
        测试按钮
      </button>
      <p style={{ marginTop: '20px', color: '#666' }}>
        如果这个页面能正常显示样式，说明 ESM 导入没问题！
      </p>
    </div>
  );
}
EOF

echo ""
echo "✅ 测试项目创建完成！"
echo ""
echo "📍 位置: /tmp/silk-nextjs-local-test"
echo ""
echo "🚀 运行测试:"
echo "  cd /tmp/silk-nextjs-local-test"
echo "  npm run dev      # 开发模式"
echo "  npm run build    # 生产构建"
