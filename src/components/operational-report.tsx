'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';
import { addDays, format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2, Clock, Users, AreaChart } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from './ui/calendar';
import { getOperationalReport } from '@/actions/patient-actions';
import type { OperationalReportData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function formatSeconds(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export function OperationalReport() {
  const { toast } = useToast();
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const [reportData, setReportData] = React.useState<OperationalReportData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const handleGenerateReport = React.useCallback(async () => {
    if (!date?.from || !date?.to) {
      toast({
        title: 'Fechas requeridas',
        description: 'Por favor seleccione un rango de fechas.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await getOperationalReport({ from: date.from, to: date.to });
      setReportData(data);
    } catch (error) {
      console.error('Error generating operational report:', error);
      toast({
        title: 'Error al generar reporte',
        description: 'No se pudo obtener el reporte operacional.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [date, toast]);
  
  React.useEffect(() => {
    handleGenerateReport();
  }, [handleGenerateReport]);

  const chartData = React.useMemo(() => {
    return reportData?.patientsPerDay.map(item => ({
        ...item,
        day: format(new Date(item.day), 'MMM d', { locale: es }),
    })) || [];
  }, [reportData]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros del Reporte</CardTitle>
          <CardDescription>
            Seleccione el rango de fechas para generar los reportes operacionales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={'outline'}
                  className={cn(
                    'w-full md:w-[300px] justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, 'LLL dd, y', { locale: es })} -{' '}
                        {format(date.to, 'LLL dd, y', { locale: es })}
                      </>
                    ) : (
                      format(date.from, 'LLL dd, y', { locale: es })
                    )
                  ) : (
                    <span>Seleccione fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : reportData ? (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Pacientes Atendidos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reportData.totalPatients}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tiempo Promedio de Estadía</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">{formatSeconds(reportData.avgStaySeconds)}</div>
                        <p className="text-xs text-muted-foreground">Desde el check-in hasta el fin de la consulta</p>
                    </CardContent>
                </Card>
            </div>
          <Card>
            <CardHeader>
              <CardTitle>Pacientes Atendidos por Día</CardTitle>
              <CardDescription>
                Número de consultas completadas en el rango de fechas seleccionado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="patientCount"
                    name="Pacientes"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{
                      r: 4,
                      fill: 'hsl(var(--primary))',
                      strokeWidth: 2,
                      stroke: 'hsl(var(--background))',
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <p>No se encontraron datos para los filtros seleccionados.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
