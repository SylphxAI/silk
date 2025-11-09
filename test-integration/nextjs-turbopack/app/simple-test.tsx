import { css } from '@sylphx/silk';

// 簡單測試 Babel plugin 是否工作
const styles = {
  red: css({ color: 'red' }),
  blue: css({ color: 'blue' }),
  green: css({ color: 'green' }),
};

console.log('測試 Babel plugin:', styles);

export default function SimpleTest() {
  return (
    <div>
      <h1 className={styles.red}>Red Text</h1>
      <h1 className={styles.blue}>Blue Text</h1>
      <h1 className={styles.green}>Green Text</h1>
    </div>
  );
}