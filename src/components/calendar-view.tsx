'use client';

import * as React from 'react';
import { Calendar, dateFnsLocalizer, Views, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { getAppointments, getDoctors, createAppointment } from '@/actions/patient-actions';
import type { Appointment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { AppointmentDialog } from './appointment-dialog';

const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }), // Monday
  getDay,
  locales,
});

const messages = {
    allDay: 'Todo el día',
    previous: 'Anterior',
    next: 'Siguiente',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay citas en este rango.',
    showMore: (total: number) => `+ Ver más (${total})`,
};


export function CalendarView() {
  const { toast } = useToast();
  const [events, setEvents] = React.useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [view, setView] = React.useState<View>(Views.WEEK);
  const [date, setDate] = React.useState(new Date());

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [slotInfo, setSlotInfo] = React.useState<any>(null);

  const fetchEvents = React.useCallback(async (currentDate: Date, currentView: View) => {
    setIsLoading(true);
    try {
        // Calculate start and end dates based on view
        let start: Date, end: Date;
        if (currentView === Views.MONTH) {
            start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        } else if (currentView === Views.WEEK) {
            start = startOfWeek(currentDate, { weekStartsOn: 1 });
            end = new Date(start);
            end.setDate(start.getDate() + 6);
        } else { // Day view
            start = new Date(currentDate);
            end = new Date(currentDate);
        }
        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);

      const data = await getAppointments(start, end);
      setEvents(data);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudieron cargar las citas.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchEvents(date, view);
  }, [date, view, fetchEvents]);
  
  const handleSelectSlot = React.useCallback((slot: any) => {
    setSlotInfo(slot);
    setIsDialogOpen(true);
  }, []);

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSlotInfo(null);
  };

  const handleAppointmentCreated = () => {
    handleDialogClose();
    fetchEvents(date, view); // Refresh events
  };

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-card/50 flex items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '80vh' }}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        view={view}
        date={date}
        onView={setView}
        onNavigate={setDate}
        selectable
        onSelectSlot={handleSelectSlot}
        messages={messages}
        culture="es"
      />
      {slotInfo && (
        <AppointmentDialog
            isOpen={isDialogOpen}
            onClose={handleDialogClose}
            onAppointmentCreated={handleAppointmentCreated}
            slotInfo={slotInfo}
        />
      )}
    </div>
  );
}
