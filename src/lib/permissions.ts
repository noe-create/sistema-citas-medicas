import type { Permission } from './types';

export const ALL_PERMISSIONS: Permission[] = [
  // Seguridad
  { id: 'roles.manage', name: 'Gestionar Roles y Permisos', description: 'Permite crear, editar y eliminar roles de seguridad.', module: 'Seguridad' },
  { id: 'users.manage', name: 'Gestionar Usuarios', description: 'Permite crear, editar y eliminar usuarios del sistema.', module: 'Seguridad' },
  
  // Parametrización
  { id: 'companies.manage', name: 'Gestionar Empresas', description: 'Permite administrar el catálogo de empresas afiliadas.', module: 'Parametrización' },
  { id: 'cie10.manage', name: 'Gestionar Catálogo CIE-10', description: 'Permite administrar el catálogo de códigos de diagnóstico.', module: 'Parametrización' },
  
  // Admisión y Pacientes
  { id: 'people.manage', name: 'Gestionar Personas', description: 'Permite gestionar el repositorio central de personas.', module: 'Admisión' },
  { id: 'titulars.manage', name: 'Gestionar Titulares', description: 'Permite crear, editar y eliminar titulares.', module: 'Admisión' },
  { id: 'beneficiaries.manage', name: 'Gestionar Beneficiarios', description: 'Permite añadir o quitar beneficiarios de un titular.', module: 'Admisión' },
  { id: 'patientlist.view', name: 'Ver Lista de Pacientes', description: 'Permite consultar la lista de todos los pacientes con HCE.', module: 'Admisión' },

  // Flujo de Atención
  { id: 'agenda.manage', name: 'Gestionar Agenda', description: 'Permite ver, crear y modificar citas en la agenda.', module: 'Atención' },
  { id: 'waitlist.manage', name: 'Gestionar Sala de Espera', description: 'Permite registrar pacientes y cambiar su estado en la cola.', module: 'Atención' },
  { id: 'consultation.perform', name: 'Realizar Consulta Médica', description: 'Permite acceder al módulo de consulta para atender pacientes.', module: 'Atención' },
  { id: 'hce.view', name: 'Ver Historia Clínica (HCE)', description: 'Permite buscar y consultar el historial clínico de los pacientes.', module: 'Atención' },
  { id: 'treatmentlog.manage', name: 'Gestionar Bitácora de Tratamiento', description: 'Permite crear órdenes y registrar ejecuciones de tratamientos.', module: 'Atención' },
  
  // Reportes
  { id: 'reports.view', name: 'Ver Reportes', description: 'Permite visualizar reportes de morbilidad y operacionales.', module: 'Reportes' },
];

export const PERMISSION_MODULES = [
    'Seguridad',
    'Parametrización',
    'Admisión',
    'Atención',
    'Reportes',
];
