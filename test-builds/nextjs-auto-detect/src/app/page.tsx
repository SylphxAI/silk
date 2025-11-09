import { css } from '@sylphx/silk';

const styles = {
  container: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }),
  title: css({
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: 'white'
  })
};

export default function Home() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Auto-Detection Test</h1>
      <p style={{ color: 'white', marginTop: '1rem' }}>
        Same config works for both webpack and turbopack!
      </p>
    </div>
  );
}
