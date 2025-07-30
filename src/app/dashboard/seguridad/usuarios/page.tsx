import { UserManagement } from '@/components/user-management';
import { getRoles } from '@/actions/security-actions';

export default async function UsuariosPage() {
  const roles = await getRoles();

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2 bg-background p-4 rounded-lg shadow-sm border">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
      </div>
      <UserManagement roles={roles} />
    </div>
  );
}
