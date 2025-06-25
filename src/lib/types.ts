// For Patient Queue
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


// For Patient Management (CRUD)
export type TitularType = 'internal_employee' | 'corporate_affiliate' | 'private';
export type Genero = 'Masculino' | 'Femenino' | 'Otro';

export interface Empresa {
  id: string;
  name: string;
}

export interface Beneficiario {
  id: string;
  titularId: string;
  nombreCompleto: string;
  cedula: string;
  fechaNacimiento: Date;
  genero: Genero;
}

export interface Titular {
  id: string;
  nombreCompleto: string;
  cedula: string;
  fechaNacimiento: Date;
  genero: Genero;
  telefono: string;
  email: string;
  tipo: TitularType;
  empresaId?: string; // Optional, only if tipo is 'corporate_affiliate'
  beneficiarios: Beneficiario[];
}
