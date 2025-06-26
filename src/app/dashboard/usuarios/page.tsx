import { UserManagement } from '@/components/user-management';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function UsuariosPage() {
  const session = await getSession();
  if (session.user?.role !== 'superuser') {
    redirect('/dashboard');
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
      </div>
      <UserManagement />
    </div>
  );
}
