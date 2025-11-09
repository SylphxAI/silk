import { css } from '@sylphx/silk';

// 測試 Babel plugin 是否轉換這些 css() 調用
const styles = {
  container: css({
    display: 'flex',
    padding: '1rem',
    background: 'red',
  }),
  title: css({
    fontSize: '2rem',
    color: 'blue',
  }),
};

export default function TestBabel() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Test Babel Plugin in Turbopack</h1>
      <p>Check if class names are static (transformed) or runtime-generated.</p>
    </div>
  );
}