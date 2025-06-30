

export type Genero = 'Masculino' | 'Femenino' | 'Otro';
export type TitularType = 'internal_employee' | 'corporate_affiliate' | 'private';
export type PatientKind = 'titular' | 'beneficiario';
export type DoctorSpecialty = 'medico general' | 'medico pediatra';

// --- NEW RBAC (Role-Based Access Control) Types ---
export interface Permission {
  id: string; // e.g., 'users.create'
  name: string; // e.g., 'Create Users'
  description: string;
  module: string; // e.g., 'Usuarios'
}

export interface Role {
  id: string;
  name: string;
  description: string;
  hasSpecialty?: boolean;
  permissions?: Permission[]; // Populated when fetching a specific role
}
// --- End RBAC Types ---

export interface User {
  id: string;
  username: string;
  role: { id: string, name: string };
  specialty?: DoctorSpecialty;
  personaId?: string;
  name?: string; 
}

export interface Persona {
  id: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  cedula: string;
  fechaNacimiento: Date;
  genero: Genero;
  telefono1?: string;
  telefono2?: string;
  email?: string;
  direccion?: string;
  // Computed property, not in DB
  nombreCompleto?: string; 
}

export interface Paciente {
  id: string; // The specific ID for the patient record in the 'pacientes' table
  personaId: string;
}

export interface Empresa {
  id: string;
  name: string;
  rif: string;
  telefono: string;
  direccion: string;
}

export interface Titular {
  id: string; 
  personaId: string;
  tipo: TitularType;
  empresaId?: string;
  // Denormalized fields for convenience
  persona: Persona;
  empresaName?: string;
  beneficiariosCount?: number;
}

export interface Beneficiario {
  id: string; // The ID of the 'beneficiario' relationship record
  personaId: string;
  titularId: string;
  persona: Persona;
  titular?: {
    id: string,
    persona: Persona,
  }
}

export interface BeneficiarioConTitular extends Beneficiario {
  titularNombre: string;
}

// For Check-in Search
export interface SearchResult {
  persona: Persona & { nombreCompleto: string };
  // A person can be a titular, a beneficiary of one or more titulares, or both.
  titularInfo?: {
    id: string; // titular record id
    tipo: TitularType;
  };
  beneficiarioDe?: {
    titularId: string;
    titularNombre: string;
  }[];
}

// For Patient Queue
export type ServiceType = 'medicina general' | 'consulta pediatrica' | 'servicio de enfermeria';
export type AccountType = 'Empleado' | 'Afiliado Corporativo' | 'Privado';
export type PatientStatus =
  | 'Esperando'
  | 'En Consulta'
  | 'Completado'
  | 'Ausente'
  | 'En Tratamiento'
  | 'Cancelado'
  | 'Pospuesto'
  | 'Reevaluacion';


export interface Patient {
  id: string; // Unique ID for the queue entry
  personaId: string;
  pacienteId: string;
  name: string;
  kind: PatientKind;
  serviceType: ServiceType;
  accountType: AccountType;
  status: PatientStatus;
  checkInTime: Date;
  fechaNacimiento: Date;
  genero: Genero;
}


// For EHR / Consultation
export interface Cie10Code {
  code: string;
  description: string;
}

export interface Diagnosis {
  cie10Code: string;
  cie10Description: string;
}

export type DocumentType = 'laboratorio' | 'imagenologia' | 'informe medico' | 'otro';

export interface ConsultationDocument {
  id: string;
  consultationId: string;
  fileName: string;
  fileType: string;
  documentType: DocumentType;
  description: string;
  fileData: string; // as a data URI
  uploadedAt: Date;
}

export interface SignosVitales {
  taSistolica?: number;
  taDiastolica?: number;
  taBrazo?: 'izquierdo' | 'derecho';
  taPosicion?: 'sentado' | 'acostado';
  fc?: number;
  fcRitmo?: 'regular' | 'irregular';
  fr?: number;
  temp?: number;
  tempUnidad?: 'C' | 'F';
  tempSitio?: 'oral' | 'axilar' | 'rectal' | 'timpanica';
  peso?: number;
  pesoUnidad?: 'kg' | 'lb';
  talla?: number;
  tallaUnidad?: 'cm' | 'in';
  imc?: number;
  satO2?: number;
  satO2Ambiente?: boolean; // true for aire ambiente, false for O2 supplement
  satO2Flujo?: number; // L/min if satO2Ambiente is false
  dolor?: number; // Scale 0-10
}


export interface AntecedentesPersonales {
  patologicos?: string;
  quirurgicos?: string;
  alergicos?: string[];
  alergicosOtros?: string;
  medicamentos?: string;
  habitos?: string[];
  habitosOtros?: string;
}

export interface AntecedentesGinecoObstetricos {
  menarquia?: number;
  ciclos?: string;
  fum?: Date;
  g?: number;
  p?: number;
  a?: number;
  c?: number;
  metodoAnticonceptivo?: string;
}

export interface AntecedentesPediatricos {
  prenatales?: string;
  natales?: string;
  postnatales?: string;
  inmunizaciones?: string;
  desarrolloPsicomotor?: string;
}

export interface MotivoConsulta {
  sintomas: string[];
  otros?: string;
}

// For Treatment Log (Refactored)
export type TreatmentOrderItemStatus = 'Pendiente' | 'Administrado' | 'Omitido';
export type TreatmentOrderStatus = 'Pendiente' | 'En Progreso' | 'Completado' | 'Cancelado';

export interface TreatmentExecution {
  id: string;
  treatmentOrderItemId: string;
  executionTime: Date;
  observations: string;
  executedBy: string;
}

export interface TreatmentOrderItem {
  id: string;
  treatmentOrderId: string;
  medicamentoProcedimiento: string;
  dosis?: string;
  via?: string;
  frecuencia?: string;
  duracion?: string;
  instrucciones?: string;
  status: TreatmentOrderItemStatus;
  executions?: TreatmentExecution[];
}

export interface TreatmentOrder {
  id: string;
  pacienteId: string;
  consultationId: string;
  status: TreatmentOrderStatus;
  createdAt: Date;
  items: TreatmentOrderItem[];
  // Denormalized for display
  paciente?: Persona & { nombreCompleto?: string };
  diagnosticoPrincipal?: string;
  orderedBy?: string;
}

export interface CreateTreatmentItemInput extends Omit<TreatmentOrderItem, 'id' | 'treatmentOrderId' | 'status' | 'executions'> {}

export interface Consultation {
  id: string;
  pacienteId: string;
  waitlistId?: string;
  consultationDate: Date;
  motivoConsulta?: MotivoConsulta;
  enfermedadActual?: string;
  revisionPorSistemas?: string;
  antecedentesPersonales?: AntecedentesPersonales;
  antecedentesFamiliares?: string;
  antecedentesGinecoObstetricos?: AntecedentesGinecoObstetricos;
  antecedentesPediatricos?: AntecedentesPediatricos;
  signosVitales?: SignosVitales;
  examenFisicoGeneral?: string;
  treatmentPlan: string;
  diagnoses: Diagnosis[];
  documents?: ConsultationDocument[];
  treatmentOrder?: TreatmentOrder; // Added to nest the order within the consultation history
}

export interface CreateConsultationDocumentInput {
  fileName: string;
  fileType: string;
  documentType: DocumentType;
  description: string;
  fileData: string; // as a data URI
}

export interface CreateConsultationInput extends Omit<Consultation, 'id' | 'consultationDate' | 'diagnoses' | 'documents' | 'treatmentOrder'> {
    diagnoses: Diagnosis[];
    documents?: CreateConsultationDocumentInput[];
    treatmentItems?: CreateTreatmentItemInput[];
}

export interface PacienteConInfo extends Persona {
    roles: string[];
    nombreCompleto: string;
}

export interface CreateTreatmentExecutionInput {
  treatmentOrderItemId: string;
  observations: string;
}

// --- Lab Orders ---
export interface LabOrder {
    id: string;
    pacienteId: string;
    consultationId: string;
    orderDate: Date;
    status: 'Pendiente' | 'Completado';
    tests: string[];
    // Denormalized for display
    paciente: Persona & { nombreCompleto?: string };
}

export type HistoryEntry =
  | { type: 'consultation'; data: Consultation }
  | { type: 'lab_order'; data: LabOrder };

// For Reports
export interface MorbidityReportRow {
  cie10Code: string;
  cie10Description: string;
  frequency: number;
}

export interface OperationalReportData {
  avgStaySeconds: number;
  totalPatients: number;
  patientsPerDay: { day: string; patientCount: number }[];
}
