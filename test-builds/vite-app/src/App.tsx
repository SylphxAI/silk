import { createStyleSystem } from '@sylphx/silk';

const { css } = createStyleSystem({});

const styles = {
  container: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  }),
  title: css({
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '1rem'
  }),
  button: css({
    backgroundColor: '#10b981',
    color: 'white',
    padding: '1rem 2rem',
    borderRadius: '0.5rem',
    fontSize: '1.125rem',
    fontWeight: 600
  })
};

export function App() {
  return (
    <div className={styles.container.className}>
      <h1 className={styles.title.className}>
        Vite + Silk Test ✅
      </h1>
      <button className={styles.button.className}>
        Click me
      </button>
    </div>
  );
}
