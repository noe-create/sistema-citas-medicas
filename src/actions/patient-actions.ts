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
    BeneficiarioConTitular
} from '@/lib/types';
import { revalidatePath } from 'next/cache';

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


export async function createTitular(data: Omit<Persona, 'id' | 'fechaNacimiento'> & { fechaNacimiento: Date, tipo: TitularType, empresaId?: string }) {
    const db = await getDb();
    const titularId = generateId('t');
    
    try {
        await db.exec('BEGIN TRANSACTION');

        const personaData = { ...data, fechaNacimiento: data.fechaNacimiento.toISOString() };
        const personaId = await getOrCreatePersona(db, personaData);

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

export async function updateTitular(titularId: string, personaId: string, data: Omit<Persona, 'id' | 'fechaNacimiento'> & { fechaNacimiento: Date, tipo: TitularType, empresaId?: string }) {
    const db = await getDb();

    try {
        await db.exec('BEGIN TRANSACTION');

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
            b.id, b.titularId,
            p.id as personaId, p.nombreCompleto, p.cedula, p.fechaNacimiento, p.genero, p.telefono, p.telefonoCelular, p.email
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
            b.id, b.personaId, b.titularId,
            p.nombreCompleto, p.cedula, p.fechaNacimiento, p.genero,
            pt.nombreCompleto as titularNombre
        FROM beneficiarios b
        JOIN personas p ON b.personaId = p.id
        JOIN titulares t ON b.titularId = t.id
        JOIN personas pt ON t.personaId = pt.id
    `;
    const params: any[] = [];
    
    if (query && query.trim().length > 1) {
        const searchQuery = `%${query.trim()}%`;
        selectQuery += `
            WHERE p.nombreCompleto LIKE ? 
            OR p.cedula LIKE ? 
            OR pt.nombreCompleto LIKE ?
        `;
        params.push(searchQuery, searchQuery, searchQuery);
    }
    
    selectQuery += ' ORDER BY p.nombreCompleto';
    
    const rows = await db.all(selectQuery, ...params);
    // This function return type is a bit of a legacy, let's adapt
    return rows.map((row: any) => ({
        id: row.id,
        personaId: row.personaId,
        titularId: row.titularId,
        nombreCompleto: row.nombreCompleto,
        cedula: row.cedula,
        fechaNacimiento: new Date(row.fechaNacimiento),
        genero: row.genero,
        titularNombre: row.titularNombre,
    }));
}


export async function createBeneficiario(titularId: string, data: Omit<Persona, 'id' | 'fechaNacimiento'> & { fechaNacimiento: Date }): Promise<Beneficiario> {
    const db = await getDb();
    const beneficiarioId = generateId('b');
    let personaId = '';

    try {
        await db.exec('BEGIN TRANSACTION');
        const personaData = { ...data, fechaNacimiento: data.fechaNacimiento.toISOString() };
        personaId = await getOrCreatePersona(db, personaData);

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
        SELECT * FROM waitlist 
        WHERE status != 'Completado' 
        ORDER BY checkInTime ASC
    `);
    return rows.map((row: any) => ({
        ...row,
        checkInTime: new Date(row.checkInTime),
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

export async function updatePatientStatus(id: string, status: PatientStatus): Promise<{ success: boolean }> {
    const db = await getDb();
    const result = await db.run(
        'UPDATE waitlist SET status = ? WHERE id = ?',
        status,
        id
    );
    if (result.changes === 0) throw new Error('Paciente en lista de espera no encontrado');
    revalidatePath('/dashboard');
    return { success: true };
}


// --- EHR Actions ---

export async function getPatientHistory(personaId: string): Promise<Consultation[]> {
    const db = await getDb();
    
    const paciente = await db.get('SELECT id FROM pacientes WHERE personaId = ?', personaId);
    if (!paciente) return []; // No patient record, so no history.

    const consultationsRows = await db.all(
        'SELECT * FROM consultations WHERE pacienteId = ? ORDER BY consultationDate DESC',
        paciente.id
    );

    const consultations: Consultation[] = await Promise.all(
        consultationsRows.map(async (row) => {
            const diagnoses = await db.all(
                'SELECT cie10Code, cie10Description FROM consultation_diagnoses WHERE consultationId = ?',
                row.id
            );
            return {
                ...row,
                consultationDate: new Date(row.consultationDate),
                diagnoses: diagnoses,
            };
        })
    );
    return consultations;
}

export async function createConsultation(data: CreateConsultationInput): Promise<Consultation> {
    const db = await getDb();
    const consultationId = generateId('c');
    const consultationDate = new Date();

    try {
        await db.exec('BEGIN TRANSACTION');
        
        await db.run(
            'INSERT INTO consultations (id, pacienteId, consultationDate, anamnesis, physicalExam, treatmentPlan) VALUES (?, ?, ?, ?, ?, ?)',
            consultationId,
            data.pacienteId,
            consultationDate.toISOString(),
            data.anamnesis,
            data.physicalExam,
            data.treatmentPlan
        );
        
        const diagnosisStmt = await db.prepare('INSERT INTO consultation_diagnoses (id, consultationId, cie10Code, cie10Description) VALUES (?, ?, ?, ?)');
        for (const diagnosis of data.diagnoses) {
            await diagnosisStmt.run(generateId('d'), consultationId, diagnosis.cie10Code, diagnosis.cie10Description);
        }
        await diagnosisStmt.finalize();

        await db.run('UPDATE waitlist SET status = ? WHERE id = ?', 'Completado', data.waitlistId);

        await db.exec('COMMIT');

    } catch (error) {
        await db.exec('ROLLBACK');
        console.error("Error creating consultation:", error);
        throw new Error('No se pudo guardar la consulta.');
    }

    revalidatePath('/dashboard');
    
    return {
        id: consultationId,
        pacienteId: data.pacienteId,
        consultationDate,
        anamnesis: data.anamnesis,
        physicalExam: data.physicalExam,
        treatmentPlan: data.treatmentPlan,
        diagnoses: data.diagnoses,
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


// --- CIE-10 Actions (Unchanged) ---
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
