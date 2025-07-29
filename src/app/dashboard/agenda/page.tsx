import { CalendarView } from "@/components/calendar-view";

export default function AgendaPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Agenda de Citas</h2>
      </div>
      <CalendarView />
    </div>
  );
}
