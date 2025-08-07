

'use server';

import { getDb } from '@/lib/db';
import type { 
    Persona, 
    Titular, 
    Beneficiario, 
    Empresa, 
    Patient, 
    PatientStatus, 
    Cie10Code, 
    Consultation, 
    CreateConsultationInput, 
    SearchResult,
    BeneficiarioConTitular,
    PacienteConInfo,
    TreatmentOrder,
    CreateTreatmentExecutionInput,
    TreatmentExecution,
    HistoryEntry,
    MorbidityReportRow,
    OperationalReportData,
    LabOrder,
    MotivoConsulta,
    TreatmentOrderItem,
    User,
    PatientSummary,
    Invoice
} from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { calculateAge } from '@/lib/utils';
import { startOfDay, endOfDay } from 'date-fns';
import { summarizePatientHistory } from '@/ai/flows/summarize-patient-history';


// --- Helpers ---
const generateId = (prefix: string) => `${prefix}${Date.now()}${Math.random().toString(36).substring(2, 6)}`;
const fullNameSql = `TRIM(p.primerNombre || ' ' || COALESCE(p.segundoNombre, '') || ' ' || p.primerApellido || ' ' || COALESCE(p.segundoApellido, ''))`;
const titularNameSql = `TRIM(p_titular.primerNombre || ' ' || COALESCE(p_titular.segundoNombre, '') || ' ' || p_titular.primerApellido || ' ' || COALESCE(p_titular.segundoApellido, ''))`;
const fullCedulaSql = `CASE WHEN p.nacionalidad IS NOT NULL AND p.cedulaNumero IS NOT NULL THEN p.nacionalidad || '-' || p.cedulaNumero ELSE NULL END`;
const fullCedulaSearchSql = `(p.nacionalidad || '-' || p.cedulaNumero)`;

// --- Authorization Helpers ---
async function ensureAdminPermission() {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user || !['superuser', 'administrator'].includes(session.user.role.id)) {
        throw new Error('Acción no autorizada. Se requiere rol de administrador o superusuario.');
    }
}

async function ensureDataEntryPermission() {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user || !['superuser', 'administrator', 'asistencial'].includes(session.user.role.id)) {
        throw new Error('Acción no autorizada. Se requiere permiso para ingreso de datos.');
    }
}

// --- Persona Actions (Centralized Person Management) ---

async function getOrCreatePersona(db: any, personaData: Omit<Persona, 'id' | 'fechaNacimiento'> & { fechaNacimiento: string; representanteId?: string; }) {
    let existingPersona;
    if (personaData.nacionalidad && personaData.cedulaNumero) {
        existingPersona = await db.get('SELECT id FROM personas WHERE nacionalidad = ? AND cedulaNumero = ?', personaData.nacionalidad, personaData.cedulaNumero);
    }
    
    if (existingPersona) {
        return existingPersona.id;
    }
    
    const age = calculateAge(new Date(personaData.fechaNacimiento));
    if (age < 18 && !personaData.cedulaNumero && !personaData.representanteId) {
        throw new Error('Un menor de edad sin cédula debe tener un representante asignado.');
    }
    
    const personaId = generateId('p');
    await db.run(
        'INSERT INTO personas (id, primerNombre, segundoNombre, primerApellido, segundoApellido, nacionalidad, cedulaNumero, fechaNacimiento, genero, telefono1, telefono2, email, direccion, representanteId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        personaId,
        personaData.primerNombre,
        personaData.segundoNombre,
        personaData.primerApellido,
        personaData.segundoApellido,
        personaData.nacionalidad,
        personaData.cedulaNumero,
        personaData.fechaNacimiento,
        personaData.genero,
        personaData.telefono1,
        personaData.telefono2,
        personaData.email,
        personaData.direccion,
        personaData.representanteId || null,
        new Date().toISOString()
    );

    await getOrCreatePaciente(db, personaId);
    return personaId;
}


export async function getPersonas(query?: string, page: number = 1, pageSize: number = 20): Promise<{ personas: Persona[], totalCount: number }> {
    const db = await getDb();

    const whereParams: any[] = [];
    let whereClause = '';
    if (query && query.trim().length > 1) {
        const searchQuery = `%${query.trim()}%`;
        whereClause = `
            WHERE ${fullNameSql} LIKE ? 
            OR ${fullCedulaSearchSql} LIKE ?
            OR email LIKE ?
        `;
        whereParams.push(searchQuery, searchQuery, searchQuery);
    }

    const countQuery = `SELECT COUNT(*) as count FROM personas p${whereClause}`;
    const totalResult = await db.get(countQuery, ...whereParams);
    const totalCount = totalResult?.count || 0;

    const offset = (page - 1) * pageSize;
    let selectQuery = `
        SELECT id, primerNombre, segundoNombre, primerApellido, segundoApellido, nacionalidad, cedulaNumero, fechaNacimiento, genero, telefono1, telefono2, email, direccion, representanteId,
        ${fullNameSql} as nombreCompleto,
        ${fullCedulaSql} as cedula
        FROM personas p
        ${whereClause}
        ORDER BY primerNombre, primerApellido
        LIMIT ? OFFSET ?
    `;
    const selectParams = [...whereParams, pageSize, offset];
    
    const rows = await await db.all(selectQuery, ...selectParams);
    const personas = rows.map((row: any) => ({
        ...row,
        fechaNacimiento: new Date(row.fechaNacimiento),
    }));

    return { personas, totalCount };
}

export async function getPersonaById(personaId: string): Promise<Persona | null> {
    const db = await getDb();
    const row = await db.get(`
        SELECT *, ${fullNameSql} as nombreCompleto, ${fullCedulaSql} as cedula
        FROM personas p
        WHERE p.id = ?
    `, personaId);

    if (!row) return null;
    return { ...row, fechaNacimiento: new Date(row.fechaNacimiento) };
}


// --- Titular Actions ---

export async function getTitulares(query?: string, page: number = 1, pageSize: number = 10): Promise<{ titulares: Titular[], totalCount: number }> {
    const db = await getDb();
    
    const whereParams: any[] = [];
    let whereClause = '';
    if (query && query.trim().length > 1) {
        const searchQuery = `%${query.trim()}%`;
        whereClause = `
            WHERE ${fullNameSql} LIKE ? 
            OR ${fullCedulaSearchSql} LIKE ?
        `;
        whereParams.push(searchQuery, searchQuery);
    }

    const countQuery = `
        SELECT COUNT(*) as count 
        FROM titulares t 
        JOIN personas p ON t.personaId = p.id
        ${whereClause}`;
    const totalResult = await db.get(countQuery, ...whereParams);
    const totalCount = totalResult?.count || 0;

    const offset = (page - 1) * pageSize;
    let selectQuery = `
        SELECT 
            t.id, t.personaId, t.unidadServicio, t.numeroFicha,
            ${fullNameSql} as nombreCompleto, ${fullCedulaSql} as cedula, p.fechaNacimiento, p.genero, p.telefono1, p.telefono2, p.email, p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido, p.direccion, p.nacionalidad, p.cedulaNumero,
            (SELECT COUNT(*) FROM beneficiarios b WHERE b.titularId = t.id) as beneficiariosCount
        FROM titulares t
        JOIN personas p ON t.personaId = p.id
        ${whereClause}
        ORDER BY p.primerNombre, p.primerApellido
        LIMIT ? OFFSET ?
    `;
    const selectParams = [...whereParams, pageSize, offset];
    
    const rows = await await db.all(selectQuery, ...selectParams);
    
    const titulares = rows.map(row => ({
        id: row.id,
        personaId: row.personaId,
        unidadServicio: row.unidadServicio,
        numeroFicha: row.numeroFicha,
        beneficiariosCount: row.beneficiariosCount,
        persona: {
            id: row.personaId,
            nombreCompleto: row.nombreCompleto,
            cedula: row.cedula,
            nacionalidad: row.nacionalidad,
            cedulaNumero: row.cedulaNumero,
            fechaNacimiento: new Date(row.fechaNacimiento),
            genero: row.genero,
            primerNombre: row.primerNombre,
            segundoNombre: row.segundoNombre,
            primerApellido: row.primerApellido,
            segundoApellido: row.segundoApellido,
            telefono1: row.telefono1,
            telefono2: row.telefono2,
            email: row.email,
            direccion: row.direccion
        }
    }));

    return { titulares, totalCount };
}


export async function getTitularById(id: string): Promise<Titular | null> {
    const db = await getDb();
    const row = await db.get(`
        SELECT 
            t.id, t.personaId, t.unidadServicio, t.numeroFicha,
            ${fullNameSql} as nombreCompleto, ${fullCedulaSql} as cedula, p.nacionalidad, p.cedulaNumero, p.fechaNacimiento, p.genero, p.telefono1, p.telefono2, p.email, p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido, p.direccion, p.representanteId
        FROM titulares t
        JOIN personas p ON t.personaId = p.id
        WHERE t.id = ?
    `, id);

    if (!row) return null;

    return {
        id: row.id,
        personaId: row.personaId,
        unidadServicio: row.unidadServicio,
        numeroFicha: row.numeroFicha,
        persona: {
            id: row.personaId,
            nombreCompleto: row.nombreCompleto,
            cedula: row.cedula,
            nacionalidad: row.nacionalidad,
            cedulaNumero: row.cedulaNumero,
            fechaNacimiento: new Date(row.fechaNacimiento),
            genero: row.genero,
            primerNombre: row.primerNombre,
            segundoNombre: row.segundoNombre,
            primerApellido: row.primerApellido,
            segundoApellido: row.segundoApellido,
            telefono1: row.telefono1,
            telefono2: row.telefono2,
            email: row.email,
            direccion: row.direccion,
            representanteId: row.representanteId
        }
    };
}


export async function createTitular(data: {
    persona: Omit<Persona, 'id' | 'fechaNacimiento' | 'nombreCompleto' | 'cedula'> & { fechaNacimiento: Date };
    unidadServicio: string;
    numeroFicha?: string;
} | {
    personaId: string;
    unidadServicio: string;
    numeroFicha?: string;
}) {
    await ensureDataEntryPermission();
    const db = await getDb();
    const titularId = generateId('t');
    
    try {
        await db.exec('BEGIN TRANSACTION');

        let personaId: string;

        if ('personaId' in data) {
            const existingTitular = await db.get('SELECT id FROM titulares WHERE personaId = ?', data.personaId);
            if (existingTitular) {
                throw new Error('Esta persona ya es un titular.');
            }
            personaId = data.personaId;
        } else {
            const personaData = { ...data.persona, fechaNacimiento: data.persona.fechaNacimiento.toISOString() };
            personaId = await getOrCreatePersona(db, personaData as any);
        }

        await db.run(
            'INSERT INTO titulares (id, personaId, unidadServicio, numeroFicha) VALUES (?, ?, ?, ?)',
            titularId,
            personaId,
            data.unidadServicio,
            data.numeroFicha || null
        );

        await db.exec('COMMIT');
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error("Error creating titular:", error);
        throw error;
    }
    
    revalidatePath('/dashboard/pacientes');
    return { id: titularId };
}

export async function updateTitular(titularId: string, personaId: string, data: Omit<Persona, 'id' | 'fechaNacimiento' | 'nombreCompleto' | 'cedula'> & { fechaNacimiento: Date; unidadServicio: string; representanteId?: string; numeroFicha?: string; }) {
    await ensureDataEntryPermission();
    const db = await getDb();

    try {
        await db.exec('BEGIN TRANSACTION');
        
        await updatePersona(personaId, data);

        await db.run(
            'UPDATE titulares SET unidadServicio = ?, numeroFicha = ? WHERE id = ?',
            data.unidadServicio,
            data.numeroFicha || null,
            titularId
        );

        await db.exec('COMMIT');
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error("Error updating titular:", error);
        throw error;
    }

    revalidatePath('/dashboard/pacientes');
    revalidatePath(`/dashboard/pacientes/${titularId}/beneficiarios`);
    return { id: titularId };
}


export async function deleteTitular(id: string): Promise<{ success: boolean }> {
    await ensureDataEntryPermission();
    const db = await getDb();

    const beneficiaryCountResult = await db.get('SELECT COUNT(*) as count FROM beneficiarios WHERE titularId = ?', id);
    if (beneficiaryCountResult && beneficiaryCountResult.count > 0) {
        throw new Error('Este titular tiene beneficiarios asociados. Por favor, gestione los beneficiarios primero.');
    }

    const result = await db.run('DELETE FROM titulares WHERE id = ?', id);
    if (result.changes === 0) {
        throw new Error('Titular no encontrado para eliminar');
    }
    
    revalidatePath('/dashboard/pacientes');
    return { success: true };
}


// --- Beneficiary Actions ---

export async function getBeneficiarios(titularId: string): Promise<Beneficiario[]> {
    const db = await getDb();
    const rows = await db.all(`
        SELECT 
            b.id, b.titularId, b.personaId,
            ${fullNameSql} as nombreCompleto, p.*
        FROM beneficiarios b
        JOIN personas p ON b.personaId = p.id
        WHERE b.titularId = ? 
        ORDER BY p.primerNombre, p.primerApellido
    `, titularId);
    return rows.map(row => ({
        ...row,
        persona: { ...row, fechaNacimiento: new Date(row.fechaNacimiento), cedula: `${row.nacionalidad}-${row.cedulaNumero}` }
    }));
}

export async function getAllBeneficiarios(query?: string): Promise<BeneficiarioConTitular[]> {
    const db = await getDb();
    let selectQuery = `
        SELECT 
            b.id, 
            b.personaId, 
            b.titularId,
            ${fullNameSql} as nombreCompleto,
            ${fullCedulaSql} as cedula,
            p.nacionalidad, p.cedulaNumero,
            p.fechaNacimiento, p.genero, p.telefono1, p.telefono2, p.email, p.direccion,
            p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido,
            ${titularNameSql} as titularNombre
        FROM beneficiarios b
        JOIN personas p ON b.personaId = p.id
        JOIN titulares t ON b.titularId = t.id
        JOIN personas p_titular ON t.personaId = p_titular.id
    `;
    const params: any[] = [];
    
    if (query && query.trim().length > 1) {
        const searchQuery = `%${query.trim()}%`;
        selectQuery += `
            WHERE ${fullNameSql} LIKE ? 
            OR ${fullCedulaSearchSql} LIKE ?
            OR ${titularNameSql} LIKE ?
        `;
        params.push(searchQuery, searchQuery, searchQuery);
    }
    
    selectQuery += ' ORDER BY p.primerNombre, p.primerApellido';
    
    const rows = await await db.all(selectQuery, ...params);
    return rows.map((row: any) => ({
        id: row.id,
        personaId: row.personaId,
        titularId: row.titularId,
        titularNombre: row.titularNombre,
        persona: { ...row, fechaNacimiento: new Date(row.fechaNacimiento) }
    }));
}


export async function createBeneficiario(titularId: string, data: { persona: Omit<Persona, 'id' | 'fechaNacimiento' | 'nombreCompleto' | 'cedula'> & { fechaNacimiento: Date } } | { personaId: string }): Promise<Beneficiario> {
    await ensureDataEntryPermission();
    const db = await getDb();
    const beneficiarioId = generateId('b');
    let personaId: string = '';

    try {
        await db.exec('BEGIN TRANSACTION');
        
        if ('personaId' in data) {
             const existingBeneficiario = await db.get('SELECT id FROM beneficiarios WHERE personaId = ? AND titularId = ?', data.personaId, titularId);
            if (existingBeneficiario) {
                throw new Error('Esta persona ya es beneficiaria de este titular.');
            }
            personaId = data.personaId;
        } else {
            const personaData = { ...data.persona, fechaNacimiento: data.persona.fechaNacimiento.toISOString() };
            personaId = await getOrCreatePersona(db, personaData as any);
        }

        await db.run(
            'INSERT INTO beneficiarios (id, titularId, personaId) VALUES (?, ?, ?)',
            beneficiarioId,
            titularId,
            personaId
        );
        await db.exec('COMMIT');

    } catch (error) {
        await db.exec('ROLLBACK');
        console.error("Error creating beneficiario:", error);
        throw error;
    }
    
    revalidatePath(`/dashboard/pacientes/${titularId}/beneficiarios`);
    revalidatePath('/dashboard/pacientes');
    revalidatePath('/dashboard/beneficiarios');

    const createdPersona = await db.get('SELECT * FROM personas WHERE id = ?', personaId);
    return {
        id: beneficiarioId,
        titularId,
        personaId,
        persona: { ...createdPersona, fechaNacimiento: new Date(createdPersona.fechaNacimiento) }
    };
}


export async function updateBeneficiario(beneficiarioId: string, personaId: string, data: Omit<Persona, 'id' | 'fechaNacimiento' | 'nombreCompleto' | 'cedula'> & { fechaNacimiento: Date }): Promise<Beneficiario> {
    await ensureDataEntryPermission();
    const db = await getDb();
    
    await updatePersona(personaId, data as any);

    const updatedRow = await db.get(`SELECT *, ${fullNameSql} as nombreCompleto, ${fullCedulaSql} as cedula FROM personas p WHERE id = ?`, personaId);
    const beneficiarioRow = await db.get('SELECT titularId FROM beneficiarios WHERE id = ?', beneficiarioId);

    revalidatePath(`/dashboard/pacientes/${beneficiarioRow.titularId}/beneficiarios`);
    revalidatePath('/dashboard/beneficiarios');

    return {
        id: beneficiarioId,
        titularId: beneficiarioRow.titularId,
        personaId: personaId,
        persona: { ...updatedRow, fechaNacimiento: new Date(updatedRow.fechaNacimiento) }
    };
}

export async function deleteBeneficiario(id: string): Promise<{ success: boolean; titularId: string }> {
    await ensureDataEntryPermission();
    const db = await getDb();
    
    const beneficiario = await db.get('SELECT titularId FROM beneficiarios WHERE id = ?', id);
    if (!beneficiario) {
        throw new Error('Beneficiario no encontrado para eliminar');
    }

    await db.run('DELETE FROM beneficiarios WHERE id = ?', id);
    
    revalidatePath(`/dashboard/pacientes/${beneficiario.titularId}/beneficiarios`);
    revalidatePath('/dashboard/pacientes');
    revalidatePath('/dashboard/beneficiarios');
    
    return { success: true, titularId: beneficiario.titularId };
}


// --- Patient Check-in and Search Actions ---

export async function searchPeopleForCheckin(query: string): Promise<SearchResult[]> {
    const db = await getDb();
    const searchQuery = `%${query.trim()}%`;
    const hasQuery = query && query.trim().length > 0;

    const personasQuery = `
        SELECT *, ${fullNameSql} as nombreCompleto, ${fullCedulaSql} as cedula
        FROM personas p
        ${hasQuery ? `WHERE ${fullNameSql} LIKE ? OR ${fullCedulaSearchSql} LIKE ?` : ''}
        ORDER BY primerNombre, primerApellido
        LIMIT 20
    `;
    const personasParams = hasQuery ? [searchQuery, searchQuery] : [];
    const personas = await await db.all(personasQuery, ...personasParams);
    
    if (personas.length === 0) return [];
    
    const personaIds = personas.map(p => p.id);
    const placeholders = personaIds.map(() => '?').join(',');

    const titularesInfo = await await db.all(`
        SELECT personaId, id, unidadServicio FROM titulares WHERE personaId IN (${placeholders})
    `, ...personaIds);

    const beneficiariosInfo = await await db.all(`
        SELECT b.personaId, b.titularId, ${titularNameSql} as titularNombre
        FROM beneficiarios b
        JOIN titulares t ON b.titularId = t.id
        JOIN personas p_titular ON t.personaId = p_titular.id
        WHERE b.personaId IN (${placeholders})
    `, ...personaIds);

    const titularesMap = new Map(titularesInfo.map(t => [t.personaId, t]));
    const beneficiariosMap = new Map<string, any[]>();
    beneficiariosInfo.forEach(b => {
        if (!beneficiariosMap.has(b.personaId)) {
            beneficiariosMap.set(b.personaId, []);
        }
        beneficiariosMap.get(b.personaId)!.push({ titularId: b.titularId, titularNombre: b.titularNombre });
    });

    const results: SearchResult[] = personas.map(p => ({
        persona: {
            ...p,
            fechaNacimiento: new Date(p.fechaNacimiento),
        },
        titularInfo: titularesMap.get(p.id) ? { id: titularesMap.get(p.id).id, unidadServicio: titularesMap.get(p.id).unidadServicio } : undefined,
        beneficiarioDe: beneficiariosMap.get(p.id) || []
    }));

    return results;
}

export async function getAccountTypeByTitularId(titularId: string): Promise<string | null> {
    const db = await getDb();
    const row = await db.get('SELECT unidadServicio FROM titulares WHERE id = ?', titularId);
    // This logic might need to be more complex if you have different account types
    // For now, we assume a direct mapping or a default.
    if (row?.unidadServicio) {
        // A placeholder logic. You might need a mapping from unidadServicio to account type.
        if (["Gerencia General", "Recursos Humanos", "Junta Directiva"].includes(row.unidadServicio)) {
            return 'Empleado';
        }
        return 'Afiliado Corporativo';
    }
    return 'Privado';
}

// --- Waitlist Actions ---

async function getOrCreatePaciente(db: any, personaId: string): Promise<string> {
    const existingPatient = await db.get('SELECT id FROM pacientes WHERE personaId = ?', personaId);
    if (existingPatient) {
        return existingPatient.id;
    }
    const pacienteId = generateId('pac');
    await db.run('INSERT INTO pacientes (id, personaId) VALUES (?, ?)', pacienteId, personaId);
    return pacienteId;
}

export async function getWaitlist(): Promise<Patient[]> {
    const db = await getDb();
    const rows = await db.all(`
        SELECT 
            w.id, w.personaId, w.pacienteId, w.name, w.kind, w.serviceType, w.accountType, w.status, w.checkInTime,
            p.fechaNacimiento, p.genero
        FROM waitlist w
        JOIN personas p ON w.personaId = p.id
        WHERE w.status NOT IN ('Completado', 'Cancelado')
        ORDER BY w.checkInTime ASC
    `);
    return rows.map((row: any) => ({
        ...row,
        checkInTime: new Date(row.checkInTime),
        fechaNacimiento: new Date(row.fechaNacimiento),
    }));
}

export async function addPatientToWaitlist(data: Omit<Patient, 'id'| 'pacienteId'>): Promise<Patient> {
    const db = await getDb();
    
    const pacienteId = await getOrCreatePaciente(db, data.personaId);
    
    const newPatient: Patient = {
        ...data,
        id: generateId('q'),
        pacienteId: pacienteId,
    };

    await db.run(
        'INSERT INTO waitlist (id, personaId, pacienteId, name, kind, serviceType, accountType, status, checkInTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        newPatient.id,
        newPatient.personaId,
        newPatient.pacienteId,
        newPatient.name,
        newPatient.kind,
        newPatient.serviceType,
        newPatient.accountType,
        newPatient.status,
        newPatient.checkInTime.toISOString()
    );

    revalidatePath('/dashboard');
    return newPatient;
}

export async function updatePatientStatus(
    id: string,
    status: PatientStatus,
    rescheduledDateTime?: Date
): Promise<{ success: boolean }> {
    const db = await getDb();

    if (status === 'Cancelado') {
        const patient = await db.get('SELECT status FROM waitlist WHERE id = ?', id);
        if (!patient) throw new Error('Paciente en lista de espera no encontrado');
        
        if (patient.status === 'En Consulta' || patient.status === 'En Tratamiento') {
            throw new Error('No se puede cancelar una cita que ya está en curso (en consulta o tratamiento).');
        }
    }

    let query = 'UPDATE waitlist SET status = ?';
    const params: any[] = [status];

    if (status === 'Pospuesto' && rescheduledDateTime) {
        query += ', checkInTime = ?';
        params.push(rescheduledDateTime.toISOString());
    }
    
    query += ' WHERE id = ?';
    params.push(id);

    const result = await db.run(query, ...params);

    if (result.changes === 0) throw new Error('Paciente en lista de espera no encontrado');

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/sala-de-espera');
    revalidatePath('/dashboard/consulta');
    return { success: true };
}


// --- EHR Actions ---

async function parseConsultation(db: any, row: any): Promise<Consultation | null> {
    if (!row) return null;
    const { fum, ...restOfGineco } = row.antecedentesGinecoObstetricos ? JSON.parse(row.antecedentesGinecoObstetricos) : {};

    const diagnoses = await await db.all('SELECT cie10Code, cie10Description FROM consultation_diagnoses WHERE consultationId = ?', row.id);
    const documents = await await db.all('SELECT * FROM consultation_documents WHERE consultationId = ? ORDER BY uploadedAt ASC', row.id);
    
    const orderRow = await db.get('SELECT * FROM treatment_orders WHERE consultationId = ?', row.id);
    let treatmentOrder: TreatmentOrder | undefined = undefined;
    if (orderRow) {
        const items = await await db.all('SELECT * FROM treatment_order_items WHERE treatmentOrderId = ?', orderRow.id);
        treatmentOrder = { ...orderRow, items: items, createdAt: new Date(orderRow.createdAt) };
    }
    
    const invoiceRow = await db.get('SELECT * FROM invoices WHERE consultationId = ?', row.id);
    let invoice: Invoice | undefined = undefined;
    if(invoiceRow) {
        const items = await await db.all('SELECT * FROM invoice_items WHERE invoiceId = ?', invoiceRow.id);
        invoice = { ...invoiceRow, items: items, createdAt: new Date(invoiceRow.createdAt) };
    }
    
    // Fetch patient data
    const pacienteRow = await db.get(
        `SELECT p.*, w.serviceType, w.accountType, w.kind, w.name, ${fullNameSql} as nombreCompleto, ${fullCedulaSql} as cedula
         FROM pacientes pac
         JOIN personas p ON pac.personaId = p.id
         JOIN waitlist w ON pac.id = w.pacienteId
         WHERE pac.id = ?`,
        row.pacienteId
    );
    
    const paciente = {
        ...pacienteRow,
        fechaNacimiento: new Date(pacienteRow.fechaNacimiento),
    }

    return {
        ...row,
        paciente,
        consultationDate: new Date(row.consultationDate),
        motivoConsulta: row.motivoConsulta ? JSON.parse(row.motivoConsulta) : undefined,
        signosVitales: row.signosVitales ? JSON.parse(row.signosVitales) : undefined,
        antecedentesPersonales: row.antecedentesPersonales ? JSON.parse(row.antecedentesPersonales) : undefined,
        antecedentesGinecoObstetricos: row.antecedentesGinecoObstetricos ? { ...restOfGineco, fum: fum ? new Date(fum) : undefined } : undefined,
        antecedentesPediatricos: row.antecedentesPediatricos ? JSON.parse(row.antecedentesPediatricos) : undefined,
        diagnoses,
        documents: documents.map(d => ({ ...d, uploadedAt: new Date(d.uploadedAt) })),
        treatmentOrder,
        invoice,
    };
}


export async function getPatientHistory(personaId: string): Promise<HistoryEntry[]> {
    const db = await getDb();
    
    const consultationsRows = await await db.all(
        `SELECT c.* FROM consultations c
         JOIN pacientes pac ON c.pacienteId = pac.id
         WHERE pac.personaId = ?
         ORDER BY c.consultationDate DESC`,
        personaId
    );

    const consultations: HistoryEntry[] = await Promise.all(
        consultationsRows.map(async (row) => {
            const parsedConsultation = await parseConsultation(db, row);
            return {
                type: 'consultation' as const,
                data: parsedConsultation!
            };
        })
    );

    const labOrdersRows = await await db.all(
        `SELECT lo.*, c.treatmentPlan, (SELECT GROUP_CONCAT(cd.cie10Description, '; ') FROM consultation_diagnoses cd WHERE cd.consultationId = lo.consultationId) as diagnosticoPrincipal
         FROM lab_orders lo
         JOIN pacientes pac ON lo.pacienteId = pac.id
         JOIN consultations c ON lo.consultationId = c.id
         WHERE pac.personaId = ?
         ORDER BY lo.orderDate DESC`,
        personaId
    );
    
    const labOrders: HistoryEntry[] = await Promise.all(labOrdersRows.map(async (order) => {
        const items = await await db.all('SELECT testName FROM lab_order_items WHERE labOrderId = ?', order.id);
        const persona = await db.get(`SELECT *, ${fullNameSql} as nombreCompleto, ${fullCedulaSql} as cedula FROM personas p WHERE p.id = ?`, personaId);
        return {
            type: 'lab_order' as const,
            data: {
                ...order,
                orderDate: new Date(order.orderDate),
                tests: items.map(i => i.testName),
                paciente: {
                    ...persona,
                    fechaNacimiento: new Date(persona.fechaNacimiento)
                },
                diagnosticoPrincipal: order.diagnosticoPrincipal,
                treatmentPlan: order.treatmentPlan
            }
        };
    }));


    const allHistory = [...consultations, ...labOrders];
    
    allHistory.sort((a, b) => {
        const dateA = a.type === 'consultation' ? a.data.consultationDate : a.data.orderDate;
        const dateB = b.type === 'consultation' ? b.data.consultationDate : b.data.orderDate;
        return dateB.getTime() - dateA.getTime();
    });

    return allHistory;
}


export async function createConsultation(data: CreateConsultationInput): Promise<Consultation> {
    const session = await getSession();
    const user = session.user;
    if (!user || !['superuser', 'doctor'].includes(user.role.id)) {
        throw new Error('Acción no autorizada. Se requiere rol de doctor o superusuario.');
    }
    
    const db = await getDb();
    const consultationId = generateId('c');
    const consultationDate = new Date();
    const surveyInvitationToken = generateId('inv');

    try {
        await db.exec('BEGIN TRANSACTION');
        
        await db.run(
            `INSERT INTO consultations (
                id, pacienteId, waitlistId, consultationDate, motivoConsulta, enfermedadActual, 
                revisionPorSistemas, antecedentesPersonales, antecedentesFamiliares, 
                antecedentesGinecoObstetricos, antecedentesPediatricos, signosVitales, 
                examenFisicoGeneral, treatmentPlan, surveyInvitationToken, radiologyOrders, reposo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            consultationId, data.pacienteId, data.waitlistId,
            consultationDate.toISOString(),
            data.motivoConsulta ? JSON.stringify(data.motivoConsulta) : null,
            data.enfermedadActual, data.revisionPorSistemas || null,
            data.antecedentesPersonales ? JSON.stringify(data.antecedentesPersonales) : null,
            data.antecedentesFamiliares || null,
            data.antecedentesGinecoObstetricos ? JSON.stringify(data.antecedentesGinecoObstetricos) : null,
            data.antecedentesPediatricos ? JSON.stringify(data.antecedentesPediatricos) : null,
            data.signosVitales ? JSON.stringify(data.signosVitales) : null,
            data.examenFisicoGeneral, data.treatmentPlan,
            surveyInvitationToken,
            data.radiologyOrder,
            data.reposo
        );
        
        if (data.diagnoses && data.diagnoses.length > 0) {
            const diagnosisStmt = await await db.prepare('INSERT INTO consultation_diagnoses (id, consultationId, cie10Code, cie10Description) VALUES (?, ?, ?, ?)');
            for (const diagnosis of data.diagnoses) {
                await diagnosisStmt.run(generateId('d'), consultationId, diagnosis.cie10Code, diagnosis.cie10Description);
            }
            await diagnosisStmt.finalize();
        }

        if (data.documents && data.documents.length > 0) {
            const docStmt = await await db.prepare('INSERT INTO consultation_documents (id, consultationId, fileName, fileType, documentType, description, fileData, uploadedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            for (const doc of data.documents) {
                await docStmt.run(
                    generateId('doc'), consultationId, doc.fileName, doc.fileType,
                    doc.documentType, doc.description, doc.fileData, new Date().toISOString()
                );
            }
            await docStmt.finalize();
        }
        
        if (data.treatmentItems && data.treatmentItems.length > 0) {
            const orderId = generateId('to');
            await db.run(
                'INSERT INTO treatment_orders (id, pacienteId, consultationId, status, createdAt) VALUES (?, ?, ?, ?, ?)',
                orderId, data.pacienteId, consultationId, 'Pendiente', new Date().toISOString()
            );

            const itemStmt = await await db.prepare(`
                INSERT INTO treatment_order_items 
                (id, treatmentOrderId, medicamentoProcedimiento, dosis, via, frecuencia, duracion, instrucciones, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            for(const item of data.treatmentItems) {
                await itemStmt.run(
                    generateId('toi'), orderId, item.medicamentoProcedimiento, item.dosis,
                    item.via, item.frecuencia, item.duracion, item.instrucciones, 'Pendiente'
                );
            }
            await itemStmt.finalize();
        }
        
        const activeSurvey = await db.get("SELECT id FROM surveys WHERE isActive = 1 LIMIT 1");
        if(activeSurvey) {
            await db.run(
                "INSERT INTO survey_invitations (token, consultationId, surveyId, createdAt) VALUES (?, ?, ?, ?)",
                surveyInvitationToken, consultationId, activeSurvey.id, new Date().toISOString()
            );
        }

        await db.run('UPDATE waitlist SET status = ? WHERE id = ?', 'Completado', data.waitlistId);

        await db.exec('COMMIT');

    } catch (error) {
        await db.exec('ROLLBACK');
        console.error("Error creating consultation:", error);
        throw new Error('No se pudo guardar la consulta.');
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/hce');
    revalidatePath('/dashboard/bitacora');
    revalidatePath('/dashboard/lista-pacientes');
    
    const createdConsultationRaw = await db.get('SELECT * from consultations WHERE id = ?', consultationId);
    const createdConsultation = await parseConsultation(db, createdConsultationRaw);

    if (!createdConsultation) {
        throw new Error('Failed to retrieve the created consultation after saving.');
    }

    return createdConsultation;
}


// --- Company Actions (Largely unchanged) ---

export async function getEmpresas(query?: string, page: number = 1, pageSize: number = 10): Promise<{ empresas: Empresa[], totalCount: number }> {
    const db = await getDb();
    
    const whereParams: any[] = [];
    let whereClause = '';
    if (query && query.trim().length > 1) {
        const searchQuery = `%${query.trim()}%`;
        whereClause = ' WHERE name LIKE ? OR rif LIKE ?';
        whereParams.push(searchQuery, searchQuery);
    }
    
    const countQuery = `SELECT COUNT(*) as count FROM empresas${whereClause}`;
    const totalResult = await db.get(countQuery, ...whereParams);
    const totalCount = totalResult?.count || 0;

    const offset = (page - 1) * pageSize;
    let selectQuery = `SELECT * FROM empresas${whereClause} ORDER BY name LIMIT ? OFFSET ?`;
    const selectParams = [...whereParams, pageSize, offset];

    const empresas = await await db.all(selectQuery, ...selectParams);
    
    return { empresas, totalCount };
}

export async function createEmpresa(data: Omit<Empresa, 'id'>): Promise<Empresa> {
    await ensureDataEntryPermission();
    const db = await getDb();
    const newEmpresaData = { ...data, id: generateId('emp') };
    await db.run(
        'INSERT INTO empresas (id, name, rif, telefono, direccion) VALUES (?, ?, ?, ?, ?)',
        newEmpresaData.id, newEmpresaData.name, newEmpresaData.rif, newEmpresaData.telefono, newEmpresaData.direccion
    );
    revalidatePath('/dashboard/empresas');
    revalidatePath('/dashboard/pacientes');
    return newEmpresaData;
}

export async function updateEmpresa(data: Empresa): Promise<Empresa> {
    await ensureAdminPermission();
    const db = await getDb();
    const result = await db.run(
        'UPDATE empresas SET name = ?, rif = ?, telefono = ?, direccion = ? WHERE id = ?',
        data.name, data.rif, data.telefono, data.direccion, data.id
    );
    if (result.changes === 0) throw new Error('Empresa no encontrada');
    revalidatePath('/dashboard/empresas');
    revalidatePath('/dashboard/pacientes');
    return data;
}

export async function deleteEmpresa(id: string): Promise<{ success: boolean }> {
    await ensureAdminPermission();
    const db = await getDb();
    
    // We no longer link companies to 'titulares' directly.
    // If you add that link back, you will need to re-add the check here.
    // const countResult = await db.get('SELECT COUNT(*) as count FROM titulares WHERE empresaId = ?', id);
    // if (countResult.count > 0) {
    //     throw new Error('No se puede eliminar la empresa porque tiene titulares asociados.');
    // }
    
    const result = await db.run('DELETE FROM empresas WHERE id = ?', id);
    if (result.changes === 0) throw new Error('Empresa no encontrada para eliminar');
    revalidatePath('/dashboard/empresas');
    revalidatePath('/dashboard/pacientes');
    return { success: true };
}

// --- Central Person Management Actions ---

export async function createPersona(data: Omit<Persona, 'id' | 'fechaNacimiento' | 'nombreCompleto' | 'cedula' | 'createdAt'> & { fechaNacimiento: Date, representanteId?: string }) {
    await ensureDataEntryPermission();
    const db = await getDb();
    
    const age = calculateAge(data.fechaNacimiento);
    if (age < 18 && !data.cedulaNumero && !data.representanteId) {
        throw new Error('Un menor de edad sin cédula debe tener un representante asignado.');
    }

    if (data.nacionalidad && data.cedulaNumero) {
        const existingPersona = await db.get('SELECT id FROM personas WHERE nacionalidad = ? AND cedulaNumero = ?', data.nacionalidad, data.cedulaNumero);
        if (existingPersona) {
            throw new Error('Ya existe una persona con esa cédula.');
        }
    }

    const personaId = generateId('p');

    await db.run(
        'INSERT INTO personas (id, primerNombre, segundoNombre, primerApellido, segundoApellido, nacionalidad, cedulaNumero, fechaNacimiento, genero, telefono1, telefono2, email, direccion, representanteId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        personaId,
        data.primerNombre,
        data.segundoNombre,
        data.primerApellido,
        data.segundoApellido,
        data.nacionalidad || null,
        data.cedulaNumero || null,
        data.fechaNacimiento.toISOString(),
        data.genero,
        data.telefono1,
        data.telefono2,
        data.email,
        data.direccion,
        data.representanteId || null,
        new Date().toISOString()
    );

    await getOrCreatePaciente(db, personaId);

    revalidatePath('/dashboard/personas');
    
    const createdPersona = await db.get('SELECT * FROM personas WHERE id = ?', personaId);
    return { ...createdPersona, fechaNacimiento: new Date(createdPersona.fechaNacimiento) };
}

export async function bulkCreatePersonas(
    personasData: (Omit<Persona, 'id' | 'fechaNacimiento' | 'nombreCompleto'> & { fechaNacimiento: string })[]
): Promise<{ imported: number; skipped: number; errors: string[] }> {
    await ensureDataEntryPermission();
    const db = await getDb();
    let importedCount = 0;
    let skippedCount = 0;
    const errorMessages: string[] = [];

    await db.exec('BEGIN TRANSACTION');
    try {
        for (const [index, data] of personasData.entries()) {
            if (!data.primerNombre || !data.primerApellido || !data.fechaNacimiento || !data.genero) {
                skippedCount++;
                errorMessages.push(`Fila ${index + 1}: Faltan campos requeridos (primer nombre, primer apellido, fecha de nacimiento, género).`);
                continue;
            }

            const { cedula: cedulaCompleta, ...restOfData } = data;
            let nacionalidad: string | null = null;
            let cedulaNumero: string | null = null;

            if (cedulaCompleta) {
                const parts = cedulaCompleta.split('-');
                if (parts.length === 2 && (parts[0] === 'V' || parts[0] === 'E') && /^\d+$/.test(parts[1])) {
                    nacionalidad = parts[0];
                    cedulaNumero = parts[1];
                } else {
                    errorMessages.push(`Fila ${index + 1}: Formato de cédula inválido '${cedulaCompleta}'. Se esperaba V-######## o E-########.`);
                    skippedCount++;
                    continue;
                }
            }
            
            if (nacionalidad && cedulaNumero) {
                const existingPersona = await db.get('SELECT id FROM personas WHERE nacionalidad = ? AND cedulaNumero = ?', nacionalidad, cedulaNumero);
                if (existingPersona) {
                    skippedCount++;
                    continue;
                }
            }

            const personaId = generateId('p');
            
            await db.run(
                'INSERT INTO personas (id, primerNombre, segundoNombre, primerApellido, segundoApellido, nacionalidad, cedulaNumero, fechaNacimiento, genero, telefono1, telefono2, email, direccion, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                personaId,
                data.primerNombre,
                data.segundoNombre,
                data.primerApellido,
                data.segundoApellido,
                nacionalidad,
                cedulaNumero,
                new Date(data.fechaNacimiento).toISOString(),
                data.genero,
                data.telefono1,
                data.telefono2,
                data.email,
                data.direccion,
                new Date().toISOString()
            );
            
            await getOrCreatePaciente(db, personaId);
            
            importedCount++;
        }
        await db.exec('COMMIT');
    } catch (error: any) {
        await db.exec('ROLLBACK');
        console.error("Error bulk inserting personas:", error);
        throw new Error('Error masivo al insertar personas. Se revirtieron todos los cambios.');
    }

    revalidatePath('/dashboard/personas');
    return {
        imported: importedCount,
        skipped: skippedCount,
        errors: errorMessages,
    };
}


export async function updatePersona(personaId: string, data: Omit<Persona, 'id' | 'fechaNacimiento' | 'nombreCompleto' | 'cedula'> & { fechaNacimiento: Date; representanteId?: string; }) {
    await ensureDataEntryPermission();
    const db = await getDb();

    const age = calculateAge(data.fechaNacimiento);
    if (age < 18 && !data.cedulaNumero && !data.representanteId) {
        throw new Error('Un menor de edad sin cédula debe tener un representante asignado.');
    }

    if (data.nacionalidad && data.cedulaNumero) {
        const existingPersonaWithCedula = await db.get('SELECT id FROM personas WHERE nacionalidad = ? AND cedulaNumero = ? AND id != ?', data.nacionalidad, data.cedulaNumero, personaId);
        if (existingPersonaWithCedula) {
            throw new Error('Ya existe otra persona con la misma cédula.');
        }
    }

    await db.run(
        'UPDATE personas SET primerNombre = ?, segundoNombre = ?, primerApellido = ?, segundoApellido = ?, nacionalidad = ?, cedulaNumero = ?, fechaNacimiento = ?, genero = ?, telefono1 = ?, telefono2 = ?, email = ?, direccion = ?, representanteId = ? WHERE id = ?',
        data.primerNombre, data.segundoNombre, data.primerApellido, data.segundoApellido,
        data.nacionalidad || null,
        data.cedulaNumero || null,
        data.fechaNacimiento.toISOString(),
        data.genero,
        data.telefono1,
        data.telefono2,
        data.email,
        data.direccion,
        data.representanteId || null,
        personaId
    );

    revalidatePath('/dashboard/personas');
    revalidatePath('/dashboard/pacientes'); // Titulares
    revalidatePath('/dashboard/beneficiarios');
    revalidatePath('/dashboard/lista-pacientes');
    revalidatePath('/dashboard/bitacora');


    const updatedPersona = await db.get('SELECT * FROM personas WHERE id = ?', personaId);
    return { ...updatedPersona, fechaNacimiento: new Date(updatedPersona.fechaNacimiento) };
}


export async function deletePersona(personaId: string): Promise<{ success: boolean }> {
    await ensureDataEntryPermission();
    const db = await getDb();

    // Check if the person is a titular with beneficiaries before deleting
    const titular = await db.get('SELECT id FROM titulares WHERE personaId = ?', personaId);
    if (titular) {
        const beneficiaryCount = await db.get('SELECT COUNT(*) as count FROM beneficiarios WHERE titularId = ?', titular.id);
        if (beneficiaryCount.count > 0) {
            throw new Error('No se puede eliminar esta persona porque es un titular con beneficiarios asociados. Por favor, gestione los beneficiarios primero desde el módulo de Titulares.');
        }
    }
    
    // ON DELETE CASCADE will handle relationships in titulares, beneficiarios, pacientes, waitlist.
    const result = await db.run('DELETE FROM personas WHERE id = ?', personaId);

    if (result.changes === 0) {
        throw new Error('Persona no encontrada para eliminar.');
    }

    revalidatePath('/dashboard/personas');
    revalidatePath('/dashboard/pacientes'); // Titulares
    revalidatePath('/dashboard/beneficiarios');
    revalidatePath('/dashboard/lista-pacientes');
    revalidatePath('/dashboard/bitacora');


    return { success: true };
}


// --- CIE-10 Actions ---
export async function getManagedCie10Codes(
  query?: string,
  page?: number,
  pageSize?: number
): Promise<{ codes: Cie10Code[]; totalCount: number }> {
  const db = await getDb();

  const whereParams: any[] = [];
  let whereClause = '';
  if (query && query.trim().length > 0) {
    const searchQuery = `%${query.trim()}%`;
    whereClause = ' WHERE code LIKE ? OR description LIKE ?';
    whereParams.push(searchQuery, searchQuery);
  }

  const countQuery = `SELECT COUNT(*) as count FROM cie10_codes${whereClause}`;
  const totalResult = await db.get(countQuery, ...whereParams);
  const totalCount = totalResult?.count || 0;

  let selectQuery = `SELECT * FROM cie10_codes${whereClause} ORDER BY code`;
  const selectParams = [...whereParams];

  if (page && pageSize) {
    const offset = (page - 1) * pageSize;
    selectQuery += ' LIMIT ? OFFSET ?';
    selectParams.push(pageSize, offset);
  }

  const codes = await await db.all(selectQuery, ...selectParams);

  return { codes, totalCount };
}

export async function createCie10Code(data: Cie10Code): Promise<Cie10Code> {
    await ensureAdminPermission();
    const db = await getDb();
    try {
        await db.run(
            'INSERT INTO cie10_codes (code, description) VALUES (?, ?)',
            data.code.toUpperCase(), data.description
        );
    } catch (error: any) {
        if (error.code === 'SQLITE_CONSTRAINT') {
            throw new Error('El código CIE-10 ya existe.');
        }
        throw error;
    }
    revalidatePath('/dashboard/cie10');
    return data;
}

export async function updateCie10Code(code: string, data: { description: string }): Promise<Cie10Code> {
    await ensureAdminPermission();
    const db = await getDb();
    const result = await db.run(
        'UPDATE cie10_codes SET description = ? WHERE code = ?',
        data.description, code
    );
    if (result.changes === 0) throw new Error('Código CIE-10 no encontrado');
    revalidatePath('/dashboard/cie10');
    return { code: code, description: data.description };
}

export async function deleteCie10Code(code: string): Promise<{ success: boolean }> {
    await ensureAdminPermission();
    const db = await getDb();
    const usage = await db.get('SELECT COUNT(*) as count FROM consultation_diagnoses WHERE cie10Code = ?', code);
    if (usage.count > 0) {
        throw new Error('Este código CIE-10 está en uso y no puede ser eliminado.');
    }
    
    const result = await db.run('DELETE FROM cie10_codes WHERE id = ?', code);
    if (result.changes === 0) throw new Error('Código CIE-10 no encontrado para eliminar');
    revalidatePath('/dashboard/cie10');
    return { success: true };
}

export async function bulkCreateCie10Codes(codes: Cie10Code[]): Promise<{ imported: number; skipped: number }> {
    await ensureAdminPermission();
    const db = await getDb();
    let importedCount = 0;

    await db.exec('BEGIN TRANSACTION');
    try {
        const stmt = await await db.prepare('INSERT OR IGNORE INTO cie10_codes (code, description) VALUES (?, ?)');
        for (const code of codes) {
            const result = await stmt.run(code.code.toUpperCase(), code.description);
            if (result.changes > 0) {
                importedCount++;
            }
        }
        await stmt.finalize();
        await db.exec('COMMIT');
    } catch (error: any) {
        await db.exec('ROLLBACK');
        console.error("Error bulk inserting CIE-10 codes:", error);
        throw new Error('Error masivo al insertar códigos CIE-10.');
    }

    revalidatePath('/dashboard/cie10');
    return {
        imported: importedCount,
        skipped: codes.length - importedCount,
    };
}


export async function searchCie10Codes(query: string): Promise<Cie10Code[]> {
    const db = await getDb();
    if (!query || query.trim().length < 2) return [];
    const searchQuery = `%${query.trim()}%`;
    return await db.all(
        'SELECT * FROM cie10_codes WHERE code LIKE ? OR description LIKE ? LIMIT 10',
        searchQuery,
        searchQuery
    );
}

export async function getListaPacientes(query?: string): Promise<PacienteConInfo[]> {
    const db = await getDb();
    let selectQuery = `
        SELECT
            p.id,
            ${fullNameSql} as nombreCompleto,
            ${fullCedulaSql} as cedula,
            p.nacionalidad,
            p.cedulaNumero,
            p.fechaNacimiento,
            p.genero,
            p.telefono1,
            p.telefono2,
            p.email,
            MAX(t.id IS NOT NULL) as isTitular,
            MAX(b.id IS NOT NULL) as isBeneficiario
        FROM personas p
        LEFT JOIN titulares t ON p.id = t.personaId
        LEFT JOIN beneficiarios b ON p.id = b.personaId
        JOIN pacientes ON p.id = pacientes.personaId
    `;
    const params: any[] = [];
    
    if (query && query.trim().length > 1) {
        const searchQuery = `%${query.trim()}%`;
        selectQuery += ` WHERE ${fullNameSql} LIKE ? OR ${fullCedulaSearchSql} LIKE ? OR p.email LIKE ?`;
        params.push(searchQuery, searchQuery, searchQuery);
    }
    
    selectQuery += ' GROUP BY p.id ORDER BY p.primerNombre, p.primerApellido';

    const rows = await await db.all(selectQuery, ...params);
    
    return rows.map((row: any) => {
        const roles = [];
        if (row.isTitular) roles.push('Titular');
        if (row.isBeneficiario) roles.push('Beneficiario');
        
        return {
            ...row,
            fechaNacimiento: new Date(row.fechaNacimiento),
            roles: roles.length > 0 ? roles : ['Sin Rol'],
        };
    });
}

// --- Treatment Log Actions ---

export async function getPacienteByPersonaId(personaId: string): Promise<{ id: string } | null> {
    const db = await getDb();
    const paciente = await db.get('SELECT id FROM pacientes WHERE personaId = ?', personaId);
    return paciente;
}

export async function getTreatmentOrders(query?: string): Promise<TreatmentOrder[]> {
    const db = await getDb();
    
    let params: any[] = [];
    let baseQuery = `
        SELECT o.id
        FROM treatment_orders o
        JOIN pacientes pac ON o.pacienteId = pac.id
        JOIN personas p ON pac.personaId = p.id
    `;
    
    if (query && query.trim().length > 1) {
        const searchQuery = `%${query.trim()}%`;
        baseQuery += ` WHERE ${fullNameSql} LIKE ? OR ${fullCedulaSearchSql} LIKE ?`;
        params.push(searchQuery, searchQuery);
    }

    baseQuery += ' ORDER BY o.createdAt DESC';
    
    const orderIdsResult = await await db.all<{ id: string }>(baseQuery, ...params);
    const orderIds = orderIdsResult.map(r => r.id);

    if (orderIds.length === 0) {
        return [];
    }

    const orders: TreatmentOrder[] = [];
    for (const orderId of orderIds) {
        const row = await db.get(`
            SELECT
                o.id, o.pacienteId, o.consultationId, o.status, o.createdAt,
                p.id as personaId,
                ${fullNameSql} as pacienteNombre,
                ${fullCedulaSql} as pacienteCedula,
                (SELECT GROUP_CONCAT(cd.cie10Description, '; ') FROM consultation_diagnoses cd WHERE cd.consultationId = o.consultationId) as diagnosticoPrincipal
            FROM treatment_orders o
            JOIN pacientes pac ON o.pacienteId = pac.id
            JOIN personas p ON pac.personaId = p.id
            WHERE o.id = ?
        `, orderId);

        if (row) {
            const items = await await db.all<TreatmentOrderItem[]>('SELECT * FROM treatment_order_items WHERE treatmentOrderId = ?', row.id);
            orders.push({
                ...row,
                createdAt: new Date(row.createdAt),
                items,
                paciente: {
                    id: row.pacienteId,
                    personaId: row.personaId,
                    nombreCompleto: row.pacienteNombre,
                    cedula: row.pacienteCedula
                }
            } as any);
        }
    }
    return orders;
}

export async function createTreatmentExecution(data: CreateTreatmentExecutionInput): Promise<TreatmentExecution> {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user || !['doctor', 'enfermera', 'superuser'].includes(session.user.role.id)) {
        throw new Error('Acción no autorizada.');
    }
    const executedBy = session.user.name || session.user.username;
    const db = await getDb();
    const executionId = generateId('te');
    const executionTime = new Date();

    try {
        await db.exec('BEGIN TRANSACTION');

        await db.run(
            'INSERT INTO treatment_executions (id, treatmentOrderItemId, executionTime, observations, executedBy) VALUES (?, ?, ?, ?, ?)',
            executionId,
            data.treatmentOrderItemId,
            executionTime.toISOString(),
            data.observations,
            executedBy
        );

        await db.run(
            'UPDATE treatment_order_items SET status = ? WHERE id = ?',
            'Administrado',
            data.treatmentOrderItemId
        );
        
        await db.exec('COMMIT');
    } catch(e) {
        await db.exec('ROLLBACK');
        console.error("Error creating treatment execution:", e);
        throw new Error("No se pudo registrar la ejecución del tratamiento.");
    }
    
    revalidatePath('/dashboard/bitacora');
    revalidatePath('/dashboard/hce');
    
    return {
        id: executionId,
        treatmentOrderItemId: data.treatmentOrderItemId,
        executionTime,
        observations: data.observations,
        executedBy: executedBy,
    };
}

export async function updateTreatmentOrderStatus(orderId: string, status: 'En Progreso' | 'Completado' | 'Cancelado'): Promise<{ success: boolean }> {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user || !['doctor', 'enfermera', 'superuser'].includes(session.user.role.id)) {
        throw new Error('Acción no autorizada.');
    }
    const db = await getDb();

    if (status === 'Completado') {
        const executions = await db.get(
            `SELECT COUNT(*) as count FROM treatment_executions te
             JOIN treatment_order_items toi ON te.treatmentOrderItemId = toi.id
             WHERE toi.treatmentOrderId = ?`,
            orderId
        );
        if (executions.count === 0) {
            throw new Error('No se puede completar una orden de tratamiento sin haber registrado al menos una ejecución.');
        }

        const pendingItems = await db.get(
            `SELECT COUNT(*) as count FROM treatment_order_items WHERE treatmentOrderId = ? AND status = 'Pendiente'`,
            orderId
        );
        if (pendingItems.count > 0) {
            throw new Error('No se puede completar la orden. Aún hay ítems pendientes de administrar.');
        }
    }
    
    const result = await db.run(
        'UPDATE treatment_orders SET status = ? WHERE id = ?',
        status,
        orderId
    );
    if (result.changes === 0) throw new Error('Orden de tratamiento no encontrada');
    revalidatePath('/dashboard/bitacora');
    return { success: true };
}


// --- Reports Actions ---

export async function getMorbidityReport(filters: { from: Date; to: Date; accountType?: string; empresaId?: string; }): Promise<MorbidityReportRow[]> {
    const db = await getDb();
    const { from, to, accountType, empresaId } = filters;
    
    let query = `
        SELECT
            cd.cie10Code,
            cd.cie10Description,
            COUNT(cd.id) as frequency
        FROM consultation_diagnoses cd
        JOIN consultations c ON cd.consultationId = c.id
        JOIN waitlist w ON c.waitlistId = w.id
    `;
    const params: any[] = [];
    const whereClauses: string[] = [];

    whereClauses.push(`c.consultationDate BETWEEN ? AND ?`);
    params.push(from.toISOString(), to.toISOString());

    if (accountType) {
        whereClauses.push(`w.accountType = ?`);
        params.push(accountType);
    }
    
    // This logic needs to be adapted if company is re-introduced
    // if (empresaId) {
    //     whereClauses.push(`
    //         w.personaId IN (
    //             SELECT t.personaId FROM titulares t WHERE t.empresaId = ?
    //             UNION
    //             SELECT b.personaId FROM beneficiarios b JOIN titulares t ON b.titularId = t.id WHERE t.empresaId = ?
    //         )
    //     `);
    //     params.push(empresaId, empresaId);
    // }
    
    if (whereClauses.length > 0) {
        query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += `
        GROUP BY cd.cie10Code, cd.cie10Description
        ORDER BY frequency DESC
    `;
    
    const data = await await db.all(query, ...params);
    return data;
}

export async function getOperationalReport(filters: { from: Date, to: Date }): Promise<OperationalReportData> {
    const db = await getDb();
    const { from, to } = filters;

    const fromISO = from.toISOString();
    const toISO = to.toISOString();

    const stayTimeResult = await db.get(`
        SELECT AVG(strftime('%s', c.consultationDate) - strftime('%s', w.checkInTime)) as avgStaySeconds
        FROM consultations c
        JOIN waitlist w ON c.waitlistId = w.id
        WHERE c.consultationDate BETWEEN ? AND ? AND w.status = 'Completado'
    `, fromISO, toISO);

    const patientsPerDay = await await db.all(`
        SELECT
            DATE(consultationDate) as day,
            COUNT(id) as patientCount
        FROM consultations
        WHERE consultationDate BETWEEN ? AND ?
        GROUP BY day
        ORDER BY day ASC
    `, fromISO, toISO);

    const totalPatientsResult = await db.get(`
        SELECT COUNT(id) as total
        FROM consultations
        WHERE consultationDate BETWEEN ? AND ?
    `, fromISO, toISO);

    return {
        avgStaySeconds: stayTimeResult?.avgStaySeconds || 0,
        patientsPerDay,
        totalPatients: totalPatientsResult?.total || 0,
    };
}


// --- Lab Order Actions ---
export async function createLabOrder(consultationId: string, pacienteId: string, tests: string[]): Promise<LabOrder> {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user || !['superuser', 'doctor'].includes(session.user.role.id)) {
        throw new Error('Acción no autorizada.');
    }
    const db = await getDb();
    const orderId = generateId('lab');
    const orderDate = new Date();

    try {
        await db.exec('BEGIN TRANSACTION');

        await db.run(
            'INSERT INTO lab_orders (id, pacienteId, consultationId, orderDate, status) VALUES (?, ?, ?, ?, ?)',
            orderId,
            pacienteId,
            consultationId,
            orderDate.toISOString(),
            'Pendiente'
        );

        const itemStmt = await await db.prepare('INSERT INTO lab_order_items (id, labOrderId, testName) VALUES (?, ?, ?)');
        for (const testName of tests) {
            await itemStmt.run(generateId('lab_item'), orderId, testName);
        }
        await itemStmt.finalize();
        
        await db.exec('COMMIT');
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error("Error creating lab order:", error);
        throw new Error('No se pudo guardar la orden de laboratorio.');
    }

    revalidatePath('/dashboard/hce');
    
    const persona = await db.get(`SELECT *, ${fullNameSql} as nombreCompleto, ${fullCedulaSql} as cedula FROM personas p JOIN pacientes ON p.id = pacientes.personaId WHERE pacientes.id = ?`, pacienteId);
    
    const consultationInfo = await db.get(
      `SELECT treatmentPlan, (SELECT GROUP_CONCAT(cie10Description, '; ') FROM consultation_diagnoses WHERE consultationId = c.id) as diagnosticoPrincipal
       FROM consultations c WHERE c.id = ?`,
      consultationId
    );

    return {
        id: orderId,
        pacienteId,
        consultationId,
        orderDate,
        status: 'Pendiente',
        tests,
        paciente: {
            ...persona,
            fechaNacimiento: new Date(persona.fechaNacimiento),
        },
        diagnosticoPrincipal: consultationInfo?.diagnosticoPrincipal,
        treatmentPlan: consultationInfo?.treatmentPlan,
    };
}


// --- Dashboard KPI Actions ---

export async function getWaitlistCount(): Promise<number> {
    const db = await getDb();
    const result = await db.get("SELECT COUNT(*) as count FROM waitlist WHERE status NOT IN ('Completado', 'Cancelado')");
    return result?.count || 0;
}

export async function getTodayConsultationsCount(): Promise<number> {
    const db = await getDb();
    const todayStart = startOfDay(new Date()).toISOString();
    const todayEnd = endOfDay(new Date()).toISOString();
    
    const result = await db.get(
        "SELECT COUNT(*) as count FROM consultations WHERE consultationDate BETWEEN ? AND ?",
        todayStart,
        todayEnd
    );
    return result?.count || 0;
}

export async function getTodayRegisteredPeopleCount(): Promise<number> {
    const db = await getDb();
    const todayStart = startOfDay(new Date()).toISOString();
    const todayEnd = endOfDay(new Date()).toISOString();
    
    const result = await db.get(
        "SELECT COUNT(*) as count FROM personas WHERE createdAt BETWEEN ? AND ?",
        todayStart,
        todayEnd
    );
    return result?.count || 0;
}


// --- HCE Patient Summary ---
export async function getPatientSummary(personaId: string): Promise<PatientSummary> {
  const history = await getPatientHistory(personaId);
  
  const consultationHistory = history.filter(entry => {
    if (entry.type !== 'consultation') return false;
    // Ensure there is some text content to summarize
    return entry.data.motivoConsulta || entry.data.enfermedadActual || entry.data.diagnoses.length > 0 || entry.data.treatmentPlan;
  });

  if (consultationHistory.length === 0) {
    return {
      knownAllergies: [],
      chronicOrImportantDiagnoses: [],
      currentMedications: [],
    };
  }
  
  const historyString = consultationHistory
    .map(entry => {
      if (entry.type === 'consultation') {
        const c = entry.data;
        let entryStr = `Fecha: ${c.consultationDate.toLocaleDateString('es-VE')}\n`;
        if (c.motivoConsulta) {
          entryStr += `Motivo: ${c.motivoConsulta.sintomas.join(', ')} ${c.motivoConsulta.otros || ''}\n`;
        }
        entryStr += `Enfermedad Actual: ${c.enfermedadActual || 'N/A'}\n`;
        if (c.antecedentesPersonales?.alergicos?.length) {
            entryStr += `Alergias Registradas: ${c.antecedentesPersonales.alergicos.join(', ')}\n`;
        }
         if (c.antecedentesPersonales?.alergicosOtros) {
            entryStr += `Otras Alergias: ${c.antecedentesPersonales.alergicosOtros}\n`;
        }
        if (c.antecedentesPersonales?.medicamentos) {
            entryStr += `Medicamentos Anteriores: ${c.antecedentesPersonales.medicamentos}\n`;
        }
        if (c.diagnoses.length > 0) {
            entryStr += `Diagnósticos: ${c.diagnoses.map(d => `${d.cie10Description} (${d.cie10Code})`).join('; ')}\n`;
        }
        entryStr += `Plan de Tratamiento: ${c.treatmentPlan || 'N/A'}\n`;
        if (c.treatmentOrder?.items.length) {
            entryStr += `Receta: ${c.treatmentOrder.items.map(i => `${i.medicamentoProcedimiento} ${i.dosis || ''}`).join('; ')}\n`;
        }
        return entryStr;
      }
      return '';
    })
    .join('\n---\n')
    .trim();
    
  if (!historyString || historyString.trim() === '') {
    return {
      knownAllergies: [],
      chronicOrImportantDiagnoses: [],
      currentMedications: [],
    };
  }

  const summary = await summarizePatientHistory({ history: historyString });

  return summary;
}

    

    



