import { AppShell } from '@/components/app-shell';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user || !session.permissions) {
        redirect('/login');
    }

  return (<AppShell user={session.user} permissions={session.permissions}>{children}</AppShell>);
}
