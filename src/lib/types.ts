// For Patient Queue
export type ServiceType = 'Medicina General' | 'Pediatría' | 'Enfermería';
export type AccountType = 'Empleado' | 'Afiliado Corporativo' | 'Privado';
export type PatientStatus = 'Esperando' | 'En Consulta' | 'Completado';
export type PatientKind = 'titular' | 'beneficiario';

export interface Patient {
  id: string; // Unique ID for the queue entry
  patientDbId: string; // ID from the titulares or beneficiarios table
  name: string;
  kind: PatientKind;
  serviceType: ServiceType;
  accountType: AccountType;
  status: PatientStatus;
  checkInTime: Date;
}

export interface SearchResult {
  id: string; // The ID from titulares or beneficiarios table
  nombreCompleto: string;
  cedula: string;
  kind: PatientKind;
  // For beneficiaries, include titular info for context
  titularInfo?: {
    id: string;
    nombreCompleto: string;
  };
}


// For Patient Management (CRUD)
export type TitularType = 'internal_employee' | 'corporate_affiliate' | 'private';
export type Genero = 'Masculino' | 'Femenino' | 'Otro';

export interface Empresa {
  id: string;
  name: string;
  rif: string;
  telefono: string;
  direccion: string;
}

export interface Beneficiario {
  id: string;
  titularId: string;
  nombreCompleto: string;
  cedula: string;
  fechaNacimiento: Date;
  genero: Genero;
}

export interface BeneficiarioConTitular extends Beneficiario {
  titularNombre: string;
}

export interface Titular {
  id: string;
  nombreCompleto: string;
  cedula: string;
  fechaNacimiento: Date;
  genero: Genero;
  telefono: string;
  telefonoCelular?: string;
  email: string;
  tipo: TitularType;
  empresaId?: string; // Optional, only if tipo is 'corporate_affiliate'
  empresaName?: string;
  beneficiarios: Beneficiario[];
}
