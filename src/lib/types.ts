export type ServiceType = 'Medicina General' | 'Pediatría' | 'Enfermería';
export type AccountType = 'Empleado' | 'Afiliado Corporativo' | 'Privado';

export interface Patient {
  id: string;
  name: string;
  serviceType: ServiceType;
  accountType: AccountType;
  status: 'Esperando' | 'En Consulta' | 'Completado';
  checkInTime: Date;
}
