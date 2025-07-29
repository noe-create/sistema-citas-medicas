import { authorize } from "@/lib/auth";

export default async function PersonasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await authorize('people.manage');
  return <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">{children}</div>;
}
