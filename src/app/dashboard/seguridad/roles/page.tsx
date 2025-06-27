import { RoleManagement } from "@/components/role-management";

export default async function RolesPage() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="font-headline text-3xl font-bold tracking-tight">Gestión de Roles</h2>
            </div>
            <RoleManagement />
        </div>
    );
}
