
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
  nombreCompleto: string;
  cedula: string;
  fechaNacimiento: Date;
  genero: Genero;
  telefono?: string;
  telefonoCelular?: string;
  email?: string;
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
  persona: Persona;
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
  ta?: string;
  fc?: number;
  fr?: number;
  temp?: number;
  peso?: number;
  talla?: number;
  imc?: number;
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

export interface Consultation {
  id: string;
  pacienteId: string;
  waitlistId?: string;
  consultationDate: Date;
  motivoConsulta?: string;
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
}


export interface CreateConsultationDocumentInput {
  fileName: string;
  fileType: string;
  documentType: DocumentType;
  description: string;
  fileData: string; // as a data URI
}

export interface CreateConsultationInput extends Omit<Consultation, 'id' | 'consultationDate' | 'diagnoses' | 'documents'> {
    diagnoses: Diagnosis[];
    documents?: CreateConsultationDocumentInput[];
}

export interface PacienteConInfo extends Persona {
    roles: string[];
}

// For Treatment Log
export interface TreatmentOrder {
  id: string;
  pacienteId: string;
  procedureDescription: string;
  frequency: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
  status: 'Activo' | 'Completado' | 'Cancelado';
  createdAt: Date;
  // Denormalized for display
  pacienteNombre: string;
  pacienteCedula: string;
}

export interface CreateTreatmentOrderInput {
  pacienteId: string;
  procedureDescription: string;
  frequency: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
}

export interface TreatmentExecution {
  id: string;
  treatmentOrderId: string;
  executionTime: Date;
  observations: string;
  executedBy: string; // e.g., 'Dr. Smith'
  // Denormalized
  procedureDescription: string;
  pacienteId: string;
}

export interface CreateTreatmentExecutionInput {
  treatmentOrderId: string;
  observations: string;
}

export type HistoryEntry =
  | { type: 'consultation'; data: Consultation }
  | { type: 'treatment_execution'; data: TreatmentExecution };

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
