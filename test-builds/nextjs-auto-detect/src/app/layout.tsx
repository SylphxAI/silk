// Webpack: import 'silk.css';  // Virtual module
import '../silk.generated.css';  // Turbopack: physical file (also works in webpack)

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
