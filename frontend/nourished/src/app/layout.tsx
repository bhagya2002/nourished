'use client';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { baselightTheme } from '@/utils/theme/DefaultColors';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('🔥 RootLayout is rendering...');

  return (
    <html lang='en'>
      <body>
        <AuthProvider>
          {' '}
          <ThemeProvider theme={baselightTheme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
