import { css } from '@sylphx/silk';

// 測試 Webpack 版本是否需要 CLI codegen
const styles = {
  container: css({
    display: 'flex',
    padding: '2rem',
    background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
    borderRadius: '1rem',
  }),
  title: css({
    fontSize: '2rem',
    color: 'white',
    fontWeight: 'bold',
    marginBottom: '1rem',
  }),
  text: css({
    color: 'white',
    fontSize: '1.2rem',
  }),
};

console.log('Webpack 測試 - styles:', styles);

export default function WebpackTest() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>✨ Webpack + Silk 測試</h1>
      <p className={styles.text}>
        測試 Webpack 版本是否需要 CLI codegen
      </p>
      <p className={styles.text}>
        檢查 class names 是否為靜態字符串（Babel 轉換）或運行時生成
      </p>
    </div>
  );
}