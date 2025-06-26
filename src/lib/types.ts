export type Genero = 'Masculino' | 'Femenino' | 'Otro';
export type TitularType = 'internal_employee' | 'corporate_affiliate' | 'private';
export type PatientKind = 'titular' | 'beneficiario';

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

export interface Consultation {
  id: string;
  pacienteId: string;
  consultationDate: Date;
  anamnesis: string;
  physicalExam: string;
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

export interface CreateConsultationInput {
    waitlistId: string;
    pacienteId: string;
    anamnesis: string;
    physicalExam: string;
    treatmentPlan: string;
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
