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
import { Calendar as CalendarIcon, Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from './ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getEmpresas, getMorbidityReport } from '@/actions/patient-actions';
import type { Empresa, MorbidityReportRow, AccountType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


const accountTypes: AccountType[] = ['Empleado', 'Afiliado Corporativo', 'Privado'];

export function MorbidityReport() {
    const { toast } = useToast();
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });
    const [accountType, setAccountType] = React.useState<string>('all');
    const [company, setCompany] = React.useState<string>('all');
    
    const [companies, setCompanies] = React.useState<Empresa[]>([]);
    const [reportData, setReportData] = React.useState<MorbidityReportRow[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        getEmpresas().then(setCompanies).catch(console.error);
    }, []);

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
            const filters = {
                from: date.from,
                to: date.to,
                accountType: accountType === 'all' ? undefined : accountType,
                empresaId: company === 'all' ? undefined : company,
            };
            const data = await getMorbidityReport(filters);
            setReportData(data);
        } catch (error) {
            console.error('Error generating morbidity report:', error);
            toast({
                title: 'Error al generar reporte',
                description: 'No se pudo obtener el reporte de morbilidad.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [date, accountType, company, toast]);
    
    React.useEffect(() => {
        handleGenerateReport();
    }, [handleGenerateReport]);

    const handleExport = (format: 'csv' | 'xlsx') => {
        if (reportData.length === 0) {
            toast({ title: 'No hay datos para exportar', variant: 'destructive' });
            return;
        }

        const dataToExport = reportData.map(row => ({
            'Código CIE-10': row.cie10Code,
            'Descripción': row.cie10Description,
            'Frecuencia': row.frequency,
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte de Morbilidad');

        if (format === 'xlsx') {
            XLSX.writeFile(workbook, 'ReporteMorbosidad.xlsx');
        } else { // CSV
            const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
            const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
            saveAs(blob, 'ReporteMorbosidad.csv');
        }
    };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros del Reporte</CardTitle>
          <CardDescription>
            Seleccione los filtros para generar el reporte de morbilidad.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="md:col-span-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal',
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
             <Select value={accountType} onValueChange={setAccountType}>
                <SelectTrigger>
                    <SelectValue placeholder="Tipo de Cuenta" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos los Tipos de Cuenta</SelectItem>
                    {accountTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                </SelectContent>
             </Select>
             <Select value={company} onValueChange={setCompany} disabled={accountType !== 'Afiliado Corporativo'}>
                 <SelectTrigger>
                    <SelectValue placeholder="Empresa" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas las Empresas</SelectItem>
                    {companies.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
             </Select>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : reportData.length > 0 ? (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Gráfico de Morbilidad</CardTitle>
                    <CardDescription>Top 10 diagnósticos más frecuentes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={reportData.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="cie10Code" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: 'var(--radius)'
                                }}
                            />
                            <Bar dataKey="frequency" fill="hsl(var(--primary))" name="Frecuencia" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Datos del Reporte</CardTitle>
                            <CardDescription>Lista completa de diagnósticos y su frecuencia.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                             <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                                <Download className="mr-2 h-4 w-4" />
                                Exportar CSV
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleExport('xlsx')}>
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Exportar XLSX
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">Código CIE-10</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="text-right">Frecuencia</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.map(row => (
                                <TableRow key={row.cie10Code}>
                                    <TableCell className="font-mono">{row.cie10Code}</TableCell>
                                    <TableCell>{row.cie10Description}</TableCell>
                                    <TableCell className="text-right font-semibold">{row.frequency}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                     </Table>
                </CardContent>
            </Card>
        </>
      ) : (
         <Card>
            <CardContent className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                <p>No se encontraron datos para los filtros seleccionados.</p>
                <p className="text-sm">Intente ajustar el rango de fechas u otros filtros.</p>
            </CardContent>
         </Card>
      )}

    </div>
  );
}
