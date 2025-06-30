
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
    TitularType,
    BeneficiarioConTitular,
    PacienteConInfo,
    TreatmentOrder,
    CreateTreatmentOrderInput,
    CreateTreatmentExecutionInput,
    TreatmentExecution,
    HistoryEntry,
    MorbidityReportRow,
    OperationalReportData,
    LabOrder,
    MotivoConsulta
} from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

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

// --- ID Generation ---
const generateId = (prefix: string) => `${prefix}${Date.now()}${Math.random().toString(36).substring(2, 6)}`;

// --- Persona Actions (Centralized Person Management) ---

async function getOrCreatePersona(db: any, personaData: Omit<Persona, 'id' | 'fechaNacimiento'> & { fechaNacimiento: string }): Promise<string> {
    // Check if persona exists by cedula
    const existingPersona = await db.get('SELECT id FROM personas WHERE cedula = ?', personaData.cedula);
    if (existingPersona) {
        return existingPersona.id;
    }
    // Create new persona
    const personaId = generateId('p');
    await db.run(
        'INSERT INTO personas (id, nombreCompleto, cedula, fechaNacimiento, genero, telefono, telefonoCelular, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        personaId,
        personaData.nombreCompleto,
        personaData.cedula,
        personaData.fechaNacimiento,
        personaData.genero,
        personaData.telefono,
        personaData.telefonoCelular,
        personaData.email
    );
    // Also create a patient record for them
    await getOrCreatePaciente(db, personaId);
    return personaId;
}


export async function getPersonas(query?: string): Promise<Persona[]> {
    const db = await getDb();
    let selectQuery = `
        SELECT id, nombreCompleto, cedula, fechaNacimiento, genero, telefono, telefonoCelular, email 
        FROM personas
    `;
    const params: any[] = [];
    if (query && query.trim().length > 1) {
        const searchQuery = `%${query.trim()}%`;
        selectQuery += `
            WHERE nombreCompleto LIKE ? 
            OR cedula LIKE ? 
            OR email LIKE ?
        `;
        params.push(searchQuery, searchQuery, searchQuery);
    }
    selectQuery += ' ORDER BY nombreCompleto';
    const rows = await db.all(selectQuery, ...params);
    return rows.map((row: any) => ({
        ...row,
        fechaNacimiento: new Date(row.fechaNacimiento),
    }));
}


// --- Titular Actions ---

export async function getTitulares(query?: string): Promise<Titular[]> {
    const db = await getDb();
    let selectQuery = `
        SELECT 
            t.id, t.personaId, t.tipo, t.empresaId,
            p.nombreCompleto, p.cedula, p.fechaNacimiento, p.genero, p.telefono, p.telefonoCelular, p.email,
            e.name as empresaName,
            (SELECT COUNT(*) FROM beneficiarios b WHERE b.titularId = t.id) as beneficiariosCount
        FROM titulares t
        JOIN personas p ON t.personaId = p.id
        LEFT JOIN empresas e ON t.empresaId = e.id
    `;
    const params: any[] = [];

    if (query && query.trim().length > 1) {
        const searchQuery = `%${query.trim()}%`;
        selectQuery += `
            WHERE p.nombreCompleto LIKE ? 
            OR p.cedula LIKE ? 
            OR (t.tipo = 'corporate_affiliate' AND e.name LIKE ?)
        `;
        params.push(searchQuery, searchQuery, searchQuery);
    }
    
    selectQuery += ' ORDER BY p.nombreCompleto';
    const rows = await db.all(selectQuery, ...params);
    
    return rows.map(row => ({
        id: row.id,
        personaId: row.personaId,
        tipo: row.tipo,
        empresaId: row.empresaId,
        empresaName: row.empresaName,
        beneficiariosCount: row.beneficiariosCount,
        persona: {
            id: row.personaId,
            nombreCompleto: row.nombreCompleto,
            cedula: row.cedula,
            fechaNacimiento: new Date(row.fechaNacimiento),
            genero: row.genero,
            telefono: row.telefono,
            telefonoCelular: row.telefonoCelular,
            email: row.email,
        }
    }));
}


export async function getTitularById(id: string): Promise<Titular | null> {
    const db = await getDb();
    const row = await db.get(`
        SELECT 
            t.id, t.personaId, t.tipo, t.empresaId,
            p.nombreCompleto, p.cedula, p.fechaNacimiento, p.genero, p.telefono, p.telefonoCelular, p.email,
            e.name as empresaName
        FROM titulares t
        JOIN personas p ON t.personaId = p.id
        LEFT JOIN empresas e ON t.empresaId = e.id
        WHERE t.id = ?
    `, id);

    if (!row) return null;

    return {
        id: row.id,
        personaId: row.personaId,
        tipo: row.tipo,
        empresaId: row.empresaId,
        empresaName: row.empresaName,
        persona: {
            id: row.personaId,
            nombreCompleto: row.nombreCompleto,
            cedula: row.cedula,
            fechaNacimiento: new Date(row.fechaNacimiento),
            genero: row.genero,
            telefono: row.telefono,
            telefonoCelular: row.telefonoCelular,
            email: row.email,
        }
    };
}


export async function createTitular(data: {
    persona: Omit<Persona, 'id' | 'fechaNacimiento' | 'cedula'> & { fechaNacimiento: Date; cedula: string };
    tipo: TitularType;
    empresaId?: string;
} | {
    personaId: string;
    tipo: TitularType;
    empresaId?: string;
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
            personaId = await getOrCreatePersona(db, personaData);
        }

        await db.run(
            'INSERT INTO titulares (id, personaId, tipo, empresaId) VALUES (?, ?, ?, ?)',
            titularId,
            personaId,
            data.tipo,
            data.tipo === 'corporate_affiliate' ? data.empresaId : null
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

export async function updateTitular(titularId: string, personaId: string, data: Omit<Persona, 'id' | 'fechaNacimiento' | 'cedula'> & { fechaNacimiento: Date; cedula: string; tipo: TitularType; empresaId?: string }) {
    await ensureDataEntryPermission();
    const db = await getDb();

    try {
        await db.exec('BEGIN TRANSACTION');

        // Check for cedula duplication before updating
        const cedulaParts = data.cedula.split('-');
        const cedulaToCheck = `${cedulaParts[0]}-${cedulaParts.slice(1).join('')}`;
        const existingPersona = await db.get('SELECT id FROM personas WHERE cedula = ? AND id != ?', cedulaToCheck, personaId);
        if (existingPersona) {
            throw new Error('Ya existe otra persona con la misma cédula.');
        }

        await db.run(
            'UPDATE personas SET nombreCompleto = ?, cedula = ?, fechaNacimiento = ?, genero = ?, telefono = ?, telefonoCelular = ?, email = ? WHERE id = ?',
            data.nombreCompleto,
            cedulaToCheck,
            data.fechaNacimiento.toISOString(),
            data.genero,
            data.telefono,
            data.telefonoCelular,
            data.email,
            personaId
        );

        await db.run(
            'UPDATE titulares SET tipo = ?, empresaId = ? WHERE id = ?',
            data.tipo,
            data.tipo === 'corporate_affiliate' ? data.empresaId : null,
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
    const result = await db.run('DELETE FROM titulares WHERE id = ?', id);
    // The persona record is NOT deleted, only their role as a titular.
    // Beneficiary relationships are cascaded.

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
            p.nombreCompleto, p.cedula, p.fechaNacimiento, p.genero, p.telefono, p.telefonoCelular, p.email
        FROM beneficiarios b
        JOIN personas p ON b.personaId = p.id
        WHERE b.titularId = ? 
        ORDER BY p.nombreCompleto
    `, titularId);
    return rows.map(row => ({
        id: row.id,
        personaId: row.personaId,
        titularId: row.titularId,
        persona: {
            id: row.personaId,
            nombreCompleto: row.nombreCompleto,
            cedula: row.cedula,
            fechaNacimiento: new Date(row.fechaNacimiento),
            genero: row.genero,
            telefono: row.telefono,
            telefonoCelular: row.telefonoCelular,
            email: row.email
        }
    }));
}

export async function getAllBeneficiarios(query?: string): Promise<BeneficiarioConTitular[]> {
    const db = await getDb();
    let selectQuery = `
        SELECT 
            b.id, 
            b.personaId, 
            b.titularId,
            p.nombreCompleto, 
            p.cedula, 
            p.fechaNacimiento, 
            p.genero, 
            p.telefono, 
            p.telefonoCelular, 
            p.email,
            p_titular.nombreCompleto as titularNombre
        FROM beneficiarios b
        JOIN personas p ON b.personaId = p.id
        JOIN titulares t ON b.titularId = t.id
        JOIN personas p_titular ON t.personaId = p_titular.id
    `;
    const params: any[] = [];
    
    if (query && query.trim().length > 1) {
        const searchQuery = `%${query.trim()}%`;
        selectQuery += `
            WHERE p.nombreCompleto LIKE ? 
            OR p.cedula LIKE ? 
            OR p_titular.nombreCompleto LIKE ?
        `;
        params.push(searchQuery, searchQuery, searchQuery);
    }
    
    selectQuery += ' ORDER BY p.nombreCompleto';
    
    const rows = await db.all(selectQuery, ...params);
    return rows.map((row: any) => ({
        id: row.id,
        personaId: row.personaId,
        titularId: row.titularId,
        titularNombre: row.titularNombre,
        persona: {
            id: row.personaId,
            nombreCompleto: row.nombreCompleto,
            cedula: row.cedula,
            fechaNacimiento: new Date(row.fechaNacimiento),
            genero: row.genero,
            telefono: row.telefono,
            telefonoCelular: row.telefonoCelular,
            email: row.email,
        }
    }));
}


export async function createBeneficiario(titularId: string, data: { persona: Omit<Persona, 'id' | 'fechaNacimiento'> & { fechaNacimiento: Date } } | { personaId: string }): Promise<Beneficiario> {
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
            personaId = await getOrCreatePersona(db, personaData);
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


export async function updateBeneficiario(beneficiarioId: string, personaId: string, data: Omit<Persona, 'id' | 'fechaNacimiento'> & { fechaNacimiento: Date }): Promise<Beneficiario> {
    await ensureDataEntryPermission();
    const db = await getDb();
    
    await db.run(
        'UPDATE personas SET nombreCompleto = ?, cedula = ?, fechaNacimiento = ?, genero = ?, telefono = ?, telefonoCelular = ?, email = ? WHERE id = ?',
        data.nombreCompleto,
        data.cedula,
        data.fechaNacimiento.toISOString(),
        data.genero,
        data.telefono,
        data.telefonoCelular,
        data.email,
        personaId
    );

    const updatedRow = await db.get('SELECT * FROM personas WHERE id = ?', personaId);
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

    // Only deletes the relationship, not the persona
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
        SELECT id, nombreCompleto, cedula, fechaNacimiento, genero, telefono, telefonoCelular, email 
        FROM personas 
        ${hasQuery ? 'WHERE nombreCompleto LIKE ? OR cedula LIKE ?' : ''}
        ORDER BY nombreCompleto
        LIMIT 20
    `;
    const personasParams = hasQuery ? [searchQuery, searchQuery] : [];
    const personas = await db.all(personasQuery, ...personasParams);
    
    if (personas.length === 0) return [];
    
    const personaIds = personas.map(p => p.id);
    const placeholders = personaIds.map(() => '?').join(',');

    const titularesInfo = await db.all(`
        SELECT personaId, id, tipo FROM titulares WHERE personaId IN (${placeholders})
    `, ...personaIds);

    const beneficiariosInfo = await db.all(`
        SELECT b.personaId, b.titularId, p_titular.nombreCompleto as titularNombre
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
        titularInfo: titularesMap.get(p.id) ? { id: titularesMap.get(p.id).id, tipo: titularesMap.get(p.id).tipo } : undefined,
        beneficiarioDe: beneficiariosMap.get(p.id) || []
    }));

    return results;
}

export async function getTitularTypeByTitularId(titularId: string): Promise<TitularType | null> {
    const db = await getDb();
    const row = await db.get('SELECT tipo FROM titulares WHERE id = ?', titularId);
    return row?.tipo || null;
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

function parseConsultation(row: any) {
    if (!row) return null;
    const { fum, ...restOfGineco } = row.antecedentesGinecoObstetricos ? JSON.parse(row.antecedentesGinecoObstetricos) : {};

    return {
        ...row,
        consultationDate: new Date(row.consultationDate),
        motivoConsulta: row.motivoConsulta ? JSON.parse(row.motivoConsulta) : undefined,
        signosVitales: row.signosVitales ? JSON.parse(row.signosVitales) : undefined,
        antecedentesPersonales: row.antecedentesPersonales ? JSON.parse(row.antecedentesPersonales) : undefined,
        antecedentesGinecoObstetricos: row.antecedentesGinecoObstetricos ? { ...restOfGineco, fum: fum ? new Date(fum) : undefined } : undefined,
        antecedentesPediatricos: row.antecedentesPediatricos ? JSON.parse(row.antecedentesPediatricos) : undefined,
    }
}

export async function getPatientHistory(personaId: string): Promise<HistoryEntry[]> {
    const db = await getDb();
    
    const paciente = await db.get('SELECT id FROM pacientes WHERE personaId = ?', personaId);
    if (!paciente) return [];

    const consultationsRows = await db.all(
        'SELECT * FROM consultations WHERE pacienteId = ?',
        paciente.id
    );

    const consultations: HistoryEntry[] = await Promise.all(
        consultationsRows.map(async (row) => {
            const diagnoses = await db.all(
                'SELECT cie10Code, cie10Description FROM consultation_diagnoses WHERE consultationId = ?',
                row.id
            );
            const documents = await db.all(
                'SELECT * FROM consultation_documents WHERE consultationId = ? ORDER BY uploadedAt ASC',
                row.id
            );
            
            const parsedConsultation = parseConsultation(row);
            
            return {
                type: 'consultation' as const,
                data: {
                    ...parsedConsultation,
                    diagnoses,
                    documents: documents.map(d => ({ ...d, uploadedAt: new Date(d.uploadedAt) })),
                }
            };
        })
    );

    const treatmentExecutionsRows = await db.all(`
        SELECT te.*, tro.procedureDescription, tro.pacienteId
        FROM treatment_executions te
        JOIN treatment_orders tro ON te.treatmentOrderId = tro.id
        WHERE tro.pacienteId = ?
    `, paciente.id);

    const treatmentExecutions: HistoryEntry[] = treatmentExecutionsRows.map(row => ({
        type: 'treatment_execution' as const,
        data: {
            ...row,
            executionTime: new Date(row.executionTime),
        }
    }));
    
    const labOrdersRows = await db.all('SELECT * FROM lab_orders WHERE pacienteId = ?', paciente.id);
    const labOrders: HistoryEntry[] = await Promise.all(labOrdersRows.map(async (order) => {
        const items = await db.all('SELECT testName FROM lab_order_items WHERE labOrderId = ?', order.id);
        const persona = await db.get('SELECT * FROM personas JOIN pacientes ON personas.id = pacientes.personaId WHERE pacientes.id = ?', order.pacienteId);
        return {
            type: 'lab_order' as const,
            data: {
                ...order,
                orderDate: new Date(order.orderDate),
                tests: items.map(i => i.testName),
                paciente: {
                    ...persona,
                    fechaNacimiento: new Date(persona.fechaNacimiento)
                }
            }
        };
    }));


    const allHistory = [...consultations, ...treatmentExecutions, ...labOrders];
    
    allHistory.sort((a, b) => {
        let dateA: Date;
        if (a.type === 'consultation') dateA = a.data.consultationDate;
        else if (a.type === 'treatment_execution') dateA = a.data.executionTime;
        else dateA = a.data.orderDate;

        let dateB: Date;
        if (b.type === 'consultation') dateB = b.data.consultationDate;
        else if (b.type === 'treatment_execution') dateB = b.data.executionTime;
        else dateB = b.data.orderDate;
        
        return dateB.getTime() - dateA.getTime();
    });

    return allHistory;
}


export async function createConsultation(data: CreateConsultationInput): Promise<Consultation> {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user || !['superuser', 'doctor'].includes(session.user.role.id)) {
        throw new Error('Acción no autorizada. Se requiere rol de doctor o superusuario.');
    }
    
    const db = await getDb();
    const consultationId = generateId('c');
    const consultationDate = new Date();

    try {
        await db.exec('BEGIN TRANSACTION');
        
        await db.run(
            `INSERT INTO consultations (
                id, pacienteId, waitlistId, consultationDate, motivoConsulta, enfermedadActual, 
                revisionPorSistemas, antecedentesPersonales, antecedentesFamiliares, 
                antecedentesGinecoObstetricos, antecedentesPediatricos, signosVitales, 
                examenFisicoGeneral, treatmentPlan
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            consultationId,
            data.pacienteId,
            data.waitlistId,
            consultationDate.toISOString(),
            data.motivoConsulta ? JSON.stringify(data.motivoConsulta) : null,
            data.enfermedadActual,
            data.revisionPorSistemas || null,
            data.antecedentesPersonales ? JSON.stringify(data.antecedentesPersonales) : null,
            data.antecedentesFamiliares || null,
            data.antecedentesGinecoObstetricos ? JSON.stringify(data.antecedentesGinecoObstetricos) : null,
            data.antecedentesPediatricos ? JSON.stringify(data.antecedentesPediatricos) : null,
            data.signosVitales ? JSON.stringify(data.signosVitales) : null,
            data.examenFisicoGeneral,
            data.treatmentPlan
        );
        
        if (data.diagnoses && data.diagnoses.length > 0) {
            const diagnosisStmt = await db.prepare('INSERT INTO consultation_diagnoses (id, consultationId, cie10Code, cie10Description) VALUES (?, ?, ?, ?)');
            for (const diagnosis of data.diagnoses) {
                await diagnosisStmt.run(generateId('d'), consultationId, diagnosis.cie10Code, diagnosis.cie10Description);
            }
            await diagnosisStmt.finalize();
        }


        if (data.documents && data.documents.length > 0) {
            const docStmt = await db.prepare('INSERT INTO consultation_documents (id, consultationId, fileName, fileType, documentType, description, fileData, uploadedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            for (const doc of data.documents) {
                await docStmt.run(
                    generateId('doc'), 
                    consultationId, 
                    doc.fileName, 
                    doc.fileType,
                    doc.documentType,
                    doc.description,
                    doc.fileData, 
                    new Date().toISOString()
                );
            }
            await docStmt.finalize();
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

    
    const documents = await db.all('SELECT * FROM consultation_documents WHERE consultationId = ?', consultationId);
    
    const createdConsultationRaw = await db.get('SELECT * from consultations WHERE id = ?', consultationId);
    const createdConsultation = parseConsultation(createdConsultationRaw);

    if (!createdConsultation) {
        throw new Error('Failed to retrieve the created consultation after saving.');
    }

    return {
        ...createdConsultation,
        diagnoses: data.diagnoses || [],
        documents: documents.map(d => ({ ...d, uploadedAt: new Date(d.uploadedAt) })),
    };
}


// --- Company Actions (Largely unchanged) ---

export async function getEmpresas(query?: string): Promise<Empresa[]> {
    const db = await getDb();
    let selectQuery = 'SELECT * FROM empresas';
    const params: any[] = [];
    if (query && query.trim().length > 1) {
        const searchQuery = `%${query.trim()}%`;
        selectQuery += ' WHERE name LIKE ? OR rif LIKE ?';
        params.push(searchQuery, searchQuery);
    }
    selectQuery += ' ORDER BY name';
    return db.all(selectQuery, ...params);
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
    const countResult = await db.get('SELECT COUNT(*) as count FROM titulares WHERE empresaId = ?', id);
    if (countResult.count > 0) {
        throw new Error('No se puede eliminar la empresa porque tiene titulares asociados.');
    }
    const result = await db.run('DELETE FROM empresas WHERE id = ?', id);
    if (result.changes === 0) throw new Error('Empresa no encontrada para eliminar');
    revalidatePath('/dashboard/empresas');
    revalidatePath('/dashboard/pacientes');
    return { success: true };
}

// --- Central Person Management Actions ---

export async function createPersona(data: Omit<Persona, 'id' | 'fechaNacimiento' | 'cedula'> & { fechaNacimiento: Date; cedula: string; }) {
    await ensureDataEntryPermission();
    const db = await getDb();
    
    const existingPersona = await db.get('SELECT id FROM personas WHERE cedula = ?', data.cedula);
    if (existingPersona) {
        throw new Error('Ya existe una persona con esa cédula.');
    }

    const personaId = generateId('p');

    await db.run(
        'INSERT INTO personas (id, nombreCompleto, cedula, fechaNacimiento, genero, telefono, telefonoCelular, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        personaId,
        data.nombreCompleto,
        data.cedula,
        data.fechaNacimiento.toISOString(),
        data.genero,
        data.telefono,
        data.telefonoCelular,
        data.email
    );

    // Also create a patient record for them so they can have a clinical history
    await getOrCreatePaciente(db, personaId);

    revalidatePath('/dashboard/personas');
    
    const createdPersona = await db.get('SELECT * FROM personas WHERE id = ?', personaId);
    return { ...createdPersona, fechaNacimiento: new Date(createdPersona.fechaNacimiento) };
}

export async function updatePersona(personaId: string, data: Omit<Persona, 'id' | 'fechaNacimiento' | 'cedula'> & { fechaNacimiento: Date; cedula: string; }) {
    await ensureDataEntryPermission();
    const db = await getDb();

    const existingPersonaWithCedula = await db.get('SELECT id FROM personas WHERE cedula = ? AND id != ?', data.cedula, personaId);
    if (existingPersonaWithCedula) {
        throw new Error('Ya existe otra persona con la misma cédula.');
    }

    await db.run(
        'UPDATE personas SET nombreCompleto = ?, cedula = ?, fechaNacimiento = ?, genero = ?, telefono = ?, telefonoCelular = ?, email = ? WHERE id = ?',
        data.nombreCompleto,
        data.cedula,
        data.fechaNacimiento.toISOString(),
        data.genero,
        data.telefono,
        data.telefonoCelular,
        data.email,
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

  const codes = await db.all(selectQuery, ...selectParams);

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
    
    const result = await db.run('DELETE FROM cie10_codes WHERE code = ?', code);
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
        const stmt = await db.prepare('INSERT OR IGNORE INTO cie10_codes (code, description) VALUES (?, ?)');
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
    return db.all(
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
            p.nombreCompleto,
            p.cedula,
            p.fechaNacimiento,
            p.genero,
            p.telefono,
            p.telefonoCelular,
            p.email,
            MAX(t.id IS NOT NULL) as isTitular,
            MAX(b.id IS NOT NULL) as isBeneficiario
        FROM pacientes pac
        JOIN personas p ON pac.personaId = p.id
        LEFT JOIN titulares t ON p.id = t.personaId
        LEFT JOIN beneficiarios b ON p.id = b.personaId
    `;
    const params: any[] = [];
    if (query && query.trim().length > 1) {
        const searchQuery = `%${query.trim()}%`;
        selectQuery += `
            WHERE p.nombreCompleto LIKE ? 
            OR p.cedula LIKE ? 
            OR p.email LIKE ?
        `;
        params.push(searchQuery, searchQuery, searchQuery);
    }
    
    selectQuery += ' GROUP BY p.id ORDER BY p.nombreCompleto';

    const rows = await db.all(selectQuery, ...params);
    
    return rows.map((row: any) => {
        const roles = [];
        if (row.isTitular) roles.push('Titular');
        if (row.isBeneficiario) roles.push('Beneficiario');
        
        return {
            id: row.id,
            nombreCompleto: row.nombreCompleto,
            cedula: row.cedula,
            fechaNacimiento: new Date(row.fechaNacimiento),
            genero: row.genero,
            telefono: row.telefono,
            telefonoCelular: row.telefonoCelular,
            email: row.email,
            roles: roles.length > 0 ? roles : ['Paciente'],
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
    let selectQuery = `
        SELECT
            o.id, o.pacienteId, o.procedureDescription, o.frequency, o.startDate, o.endDate, o.notes, o.status, o.createdAt,
            p.nombreCompleto as pacienteNombre,
            p.cedula as pacienteCedula
        FROM treatment_orders o
        JOIN pacientes pac ON o.pacienteId = pac.id
        JOIN personas p ON pac.personaId = p.id
    `;
    const params: any[] = [];
    if (query && query.trim().length > 1) {
        const searchQuery = `%${query.trim()}%`;
        selectQuery += `
            WHERE p.nombreCompleto LIKE ? OR p.cedula LIKE ? OR o.procedureDescription LIKE ?
        `;
        params.push(searchQuery, searchQuery, searchQuery);
    }
    selectQuery += ' ORDER BY o.createdAt DESC';
    const rows = await db.all(selectQuery, ...params);
    return rows.map((row: any) => ({
        ...row,
        startDate: new Date(row.startDate),
        endDate: new Date(row.endDate),
        createdAt: new Date(row.createdAt),
    }));
}

export async function createTreatmentOrder(data: CreateTreatmentOrderInput): Promise<TreatmentOrder> {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user || !['doctor', 'superuser'].includes(session.user.role.id)) {
        throw new Error('Acción no autorizada.');
    }
    const db = await getDb();
    const orderId = generateId('to');
    const createdAt = new Date();
    
    await db.run(
        'INSERT INTO treatment_orders (id, pacienteId, procedureDescription, frequency, startDate, endDate, notes, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        orderId,
        data.pacienteId,
        data.procedureDescription,
        data.frequency,
        data.startDate.toISOString(),
        data.endDate.toISOString(),
        data.notes,
        'Activo',
        createdAt.toISOString()
    );

    revalidatePath('/dashboard/bitacora');

    const patientInfo = await db.get('SELECT p.nombreCompleto, p.cedula FROM pacientes pac JOIN personas p ON pac.personaId = p.id WHERE pac.id = ?', data.pacienteId);

    return {
        id: orderId,
        ...data,
        status: 'Activo',
        createdAt,
        pacienteNombre: patientInfo.nombreCompleto,
        pacienteCedula: patientInfo.cedula,
    };
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

    await db.run(
        'INSERT INTO treatment_executions (id, treatmentOrderId, executionTime, observations, executedBy) VALUES (?, ?, ?, ?, ?)',
        executionId,
        data.treatmentOrderId,
        executionTime.toISOString(),
        data.observations,
        executedBy
    );
    
    const orderInfo = await db.get('SELECT procedureDescription, pacienteId FROM treatment_orders WHERE id = ?', data.treatmentOrderId);
    
    revalidatePath('/dashboard/bitacora');
    revalidatePath('/dashboard/hce');
    
    return {
        id: executionId,
        treatmentOrderId: data.treatmentOrderId,
        executionTime,
        observations: data.observations,
        executedBy: executedBy,
        procedureDescription: orderInfo.procedureDescription,
        pacienteId: orderInfo.pacienteId
    };
}

export async function updateTreatmentOrderStatus(orderId: string, status: 'Activo' | 'Completado' | 'Cancelado'): Promise<{ success: boolean }> {
    const session = await getSession();
    if (!session.isLoggedIn || !session.user || !['doctor', 'enfermera', 'superuser'].includes(session.user.role.id)) {
        throw new Error('Acción no autorizada.');
    }
    const db = await getDb();

    if (status === 'Completado') {
        const executionCount = await db.get(
            'SELECT COUNT(*) as count FROM treatment_executions WHERE treatmentOrderId = ?',
            orderId
        );
        if (executionCount.count === 0) {
            throw new Error('No se puede completar una orden de tratamiento sin haber registrado al menos una ejecución.');
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
    
    if (empresaId) {
        whereClauses.push(`
            w.personaId IN (
                SELECT t.personaId FROM titulares t WHERE t.empresaId = ?
                UNION
                SELECT b.personaId FROM beneficiarios b JOIN titulares t ON b.titularId = t.id WHERE t.empresaId = ?
            )
        `);
        params.push(empresaId, empresaId);
    }
    
    if (whereClauses.length > 0) {
        query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += `
        GROUP BY cd.cie10Code, cd.cie10Description
        ORDER BY frequency DESC
    `;
    
    const data = await db.all(query, ...params);
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
        WHERE c.consultationDate BETWEEN ? AND ?
    `, fromISO, toISO);

    const patientsPerDay = await db.all(`
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

        const itemStmt = await db.prepare('INSERT INTO lab_order_items (id, labOrderId, testName) VALUES (?, ?, ?)');
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
    
    const persona = await db.get('SELECT * FROM personas JOIN pacientes ON personas.id = pacientes.personaId WHERE pacientes.id = ?', pacienteId);

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
        }
    };
}
