
export interface DepartmentCategory {
  category: string;
  departments: string[];
}

export const DEPARTMENTS_GROUPED: DepartmentCategory[] = [
  {
    category: "Especialidades Médicas",
    departments: [
      "Alergología",
      "Anatomopatología",
      "Anestesiología",
      "Cardiología",
      "Cardiología Pediátrica",
      "Dermatología",
      "Endocrinología",
      "Endocrinología Pediátrica",
      "Gastroenterología",
      "Gastroenterología Pediátrica",
      "Ginecología y Obstetricia",
      "Hematología",
      "Hematología Pediátrica",
      "Infectología",
      "Infectología Pediátrica",
      "Inmunología",
      "Medicina Interna",
      "Nefrología",
      "Nefrología Pediátrica",
      "Neumonología",
      "Neumonología Pediátrica",
      "Neurocirugía",
      "Neurología",
      "Neurología Pediátrica",
      "Oftalmología",
      "Oftalmología Pediátrica",
      "Oncología y Radioterapia",
      "Otorrinolaringología",
      "Pediatría",
      "Psiquiatría",
      "Reumatología",
      "Traumatología",
      "Urología",
    ],
  },
  {
    category: "Especialidades Quirúrgicas",
    departments: [
      "Cirugía Bariátrica",
      "Cirugía Cardiovascular",
      "Cirugía de la Mano",
      "Cirugía de Tórax",
      "Cirugía General",
      "Cirugía Oncológica",
      "Cirugía Pediátrica",
      "Cirugía Plástica",
      "Coloproctología",
    ],
  },
  {
    category: "Servicios de Diagnóstico y Apoyo",
    departments: [
      "Bioanálisis",
      "Ecografía",
      "Laboratorio",
      "Medicina Nuclear",
      "Radiología",
      "Rayos X",
      "Tomografía",
      "Unidad de Hemodinamia",
      "Unidosis (Farmacia Hospitalaria)",
    ],
  },
  {
    category: "Estructura Directiva y Gerencial",
    departments: [
      "Junta Directiva",
      "Dirección Médica",
      "Fundación Policlínico La Viña",
      "Sociedad Médica",
      "Gerencia General",
      "Gerencia de Seguridad Integral",
    ],
  },
  {
    category: "Departamentos Administrativos",
    departments: [
      "Recursos Humanos",
      "Administración y Finanzas",
      "Coordinación de Contabilidad",
      "Analista de Impuestos",
      "Analista de Contabilidad",
      "Departamento Legal",
      "Auditoría Interna",
      "Departamento de Compras",
      "Departamento de Mantenimiento",
      "Departamento de Informática",
    ],
  },
];

// Flattened list for easier access if needed elsewhere
export const DEPARTMENTS: string[] = DEPARTMENTS_GROUPED.flatMap(
  (group) => group.departments
);
