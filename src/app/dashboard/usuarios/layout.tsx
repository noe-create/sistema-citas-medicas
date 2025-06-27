import { authorize } from "@/lib/auth";

export default async function UsuariosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await authorize('users.manage');
  return <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">{children}</div>;
}
