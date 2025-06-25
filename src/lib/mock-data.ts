import type { Empresa, Titular, Beneficiario } from './types';

export const mockEmpresas: Empresa[] = [
  { id: 'emp1', name: 'Innovatech Solutions' },
  { id: 'emp2', name: 'Nexus Group' },
  { id: 'emp3', name: 'Quantum Industries' },
];

const createBeneficiarios = (titularId: string, nombreTitular: string): Beneficiario[] => [
    { id: `${titularId}-b1`, titularId, nombreCompleto: `Hijo de ${nombreTitular.split(' ')[0]}`, cedula: `V-${Math.floor(10000000 + Math.random() * 90000000)}`, fechaNacimiento: new Date(2010, 5, 15), genero: 'Masculino' },
    { id: `${titularId}-b2`, titularId, nombreCompleto: `Hija de ${nombreTitular.split(' ')[0]}`, cedula: `V-${Math.floor(10000000 + Math.random() * 90000000)}`, fechaNacimiento: new Date(2012, 8, 20), genero: 'Femenino' },
];

export const mockTitulares: Titular[] = [
  {
    id: 't1',
    nombreCompleto: 'Carlos Rodriguez',
    cedula: 'V-12345678',
    fechaNacimiento: new Date(1985, 1, 20),
    genero: 'Masculino',
    telefono: '0414-1234567',
    email: 'carlos.r@email.com',
    tipo: 'private',
    beneficiarios: createBeneficiarios('t1', 'Carlos Rodriguez'),
  },
  {
    id: 't2',
    nombreCompleto: 'Ana Martinez',
    cedula: 'V-87654321',
    fechaNacimiento: new Date(1990, 7, 10),
    genero: 'Femenino',
    telefono: '0412-7654321',
    email: 'ana.m@email.com',
    tipo: 'internal_employee',
    beneficiarios: [],
  },
  {
    id: 't3',
    nombreCompleto: 'Luis Hernandez',
    cedula: 'E-98765432',
    fechaNacimiento: new Date(1978, 11, 5),
    genero: 'Masculino',
    telefono: '0424-9876543',
    email: 'luis.h@email.com',
    tipo: 'corporate_affiliate',
    empresaId: 'emp1',
    beneficiarios: createBeneficiarios('t3', 'Luis Hernandez'),
  },
  {
    id: 't4',
    nombreCompleto: 'Sofia Gomez',
    cedula: 'V-23456789',
    fechaNacimiento: new Date(1995, 3, 30),
    genero: 'Femenino',
    telefono: '0416-2345678',
    email: 'sofia.g@email.com',
    tipo: 'private',
    beneficiarios: [],
  },
];
