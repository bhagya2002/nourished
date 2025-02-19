import { AuthProvider } from '@/context/AuthContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {' '}
      <section>{children}</section>
    </AuthProvider>
  );
}
