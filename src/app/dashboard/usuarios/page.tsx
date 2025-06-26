import { UserManagement } from '@/components/user-management';

export default async function UsuariosPage() {
  // La autorización ahora se maneja en dos niveles:
  // 1. La interfaz de usuario (menú lateral) solo muestra el enlace a los superusuarios.
  // 2. Las Server Actions (getUsers, createUser, etc.) lanzan un error si el rol no es 'superuser'.
  // Esta comprobación a nivel de página era redundante y causaba problemas de sesión.

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
      </div>
      <UserManagement />
    </div>
  );
}
