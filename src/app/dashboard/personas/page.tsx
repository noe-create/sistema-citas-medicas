import { PeopleList } from '@/components/people-list';

export default async function PersonasPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Personas</h2>
      </div>
      <PeopleList />
    </div>
  );
}
