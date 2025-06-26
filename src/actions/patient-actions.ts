'use server';

import { getDb } from '@/lib/db';
import type { Titular, Beneficiario, SearchResult, TitularType, BeneficiarioConTitular, Empresa, Patient, PatientStatus } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const generateId = () => `t${Date.now()}`;
const generateBeneficiaryId = () => `b${Date.now()}`;

export async function getTitulares(query?: string): Promise<Titular[]> {
    const db = await getDb();
    let selectQuery = `
        SELECT t.*, e.name as empresaName 
        FROM titulares t
        LEFT JOIN empresas e ON t.empresaId = e.id
    `;
    const params: any[] = [];

    if (query && query.trim().length > 1) {
        const searchQuery = `%${query.trim()}%`;
        selectQuery += `
            WHERE t.nombreCompleto LIKE ? 
            OR t.cedula LIKE ? 
            OR (t.tipo = 'corporate_affiliate' AND e.name LIKE ?)
        `;
        params.push(searchQuery, searchQuery, searchQuery);
    }
    
    selectQuery += ' ORDER BY t.nombreCompleto';

    const rows = await db.all(selectQuery, ...params);
    
    const titularesWithBeneficiaryCount = await Promise.all(rows.map(async (row) => {
        const countResult = await db.get('SELECT COUNT(*) as count FROM beneficiarios WHERE titularId = ?', row.id);
        const titular: Titular = {
            ...row,
            fechaNacimiento: new Date(row.fechaNacimiento),
            beneficiarios: [], // Placeholder, not fetching full objects
        };
        // This is a bit of a hack to pass the count, but avoids changing the type everywhere
        (titular as any).beneficiarios.length = countResult.count;
        return titular;
    }));

    return titularesWithBeneficiaryCount;
}


export async function getTitularById(id: string): Promise<Titular | null> {
    const db = await getDb();
    const row = await db.get('SELECT * FROM titulares WHERE id = ?', id);
    if (!row) return null;

    return {
        ...row,
        fechaNacimiento: new Date(row.fechaNacimiento),
        beneficiarios: [] // Not fetching beneficiaries here for performance
    };
}

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

export async function createTitular(data: Omit<Titular, 'id' | 'beneficiarios' | 'empresaName' | 'cedula'> & { nacionalidad: string, cedula: string }) {
    const db = await getDb();
    const newTitularData = {
        ...data,
        id: generateId(),
        cedula: `${data.nacionalidad}-${data.cedula}`
    };
    
    await db.run(
        'INSERT INTO titulares (id, nombreCompleto, cedula, fechaNacimiento, genero, telefono, telefonoCelular, email, tipo, empresaId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        newTitularData.id,
        newTitularData.nombreCompleto,
        newTitularData.cedula,
        newTitularData.fechaNacimiento.toISOString(),
        newTitularData.genero,
        newTitularData.telefono,
        newTitularData.telefonoCelular,
        newTitularData.email,
        newTitularData.tipo,
        newTitularData.tipo === 'corporate_affiliate' ? newTitularData.empresaId : null
    );
    
    revalidatePath('/dashboard/pacientes');
    
    // Return the full object for type consistency
    const newTitular: Titular = { ...newTitularData, beneficiarios: [] };
    return newTitular;
}

export async function updateTitular(data: Omit<Titular, 'beneficiarios' | 'empresaName' | 'cedula'> & { nacionalidad: string, cedula: string }) {
    const db = await getDb();

    const result = await db.run(
        `UPDATE titulares 
         SET nombreCompleto = ?, cedula = ?, fechaNacimiento = ?, genero = ?, telefono = ?, telefonoCelular = ?, email = ?, tipo = ?, empresaId = ?
         WHERE id = ?`,
        data.nombreCompleto,
        `${data.nacionalidad}-${data.cedula}`,
        data.fechaNacimiento.toISOString(),
        data.genero,
        data.telefono,
        data.telefonoCelular,
        data.email,
        data.tipo,
        data.tipo === 'corporate_affiliate' ? data.empresaId : null,
        data.id
    );

    if (result.changes === 0) {
        throw new Error('Titular no encontrado');
    }

    revalidatePath('/dashboard/pacientes');
    
    const updatedTitularRow = await db.get('SELECT * FROM titulares WHERE id = ?', data.id);
     if (!updatedTitularRow) {
        throw new Error('Titular no encontrado después de la actualización');
    }
    
    // We need to return a fully-typed Titular object
    const updatedTitular: Titular = {
        ...updatedTitularRow,
        fechaNacimiento: new Date(updatedTitularRow.fechaNacimiento),
        beneficiarios: [] // Placeholder
    };
    return updatedTitular;
}

export async function deleteTitular(id: string): Promise<{ success: boolean }> {
    const db = await getDb();
    // Using a transaction to ensure both titular and their beneficiaries are deleted
    try {
        await db.exec('BEGIN TRANSACTION');
        await db.run('DELETE FROM beneficiarios WHERE titularId = ?', id);
        const result = await db.run('DELETE FROM titulares WHERE id = ?', id);
        await db.exec('COMMIT');

        if (result.changes === 0) {
            throw new Error('Titular no encontrado para eliminar');
        }
    } catch (error) {
        await db.exec('ROLLBACK');
        throw error;
    }
    
    revalidatePath('/dashboard/pacientes');
    return { success: true };
}


// --- Beneficiary Actions ---

export async function getBeneficiarios(titularId: string): Promise<Beneficiario[]> {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM beneficiarios WHERE titularId = ? ORDER BY nombreCompleto', titularId);
    return rows.map(row => ({
        ...row,
        fechaNacimiento: new Date(row.fechaNacimiento),
    }));
}

export async function getAllBeneficiarios(query?: string): Promise<BeneficiarioConTitular[]> {
    const db = await getDb();
    let selectQuery = `
        SELECT b.*, t.nombreCompleto as titularNombre
        FROM beneficiarios b
        JOIN titulares t ON b.titularId = t.id
    `;
    const params: any[] = [];
    
    if (query && query.trim().length > 1) {
        const searchQuery = `%${query.trim()}%`;
        selectQuery += `
            WHERE b.nombreCompleto LIKE ? 
            OR b.cedula LIKE ? 
            OR t.nombreCompleto LIKE ?
        `;
        params.push(searchQuery, searchQuery, searchQuery);
    }
    
    selectQuery += ' ORDER BY b.nombreCompleto';
    
    const rows = await db.all(selectQuery, ...params);
    return rows.map(row => ({
        ...row,
        fechaNacimiento: new Date(row.fechaNacimiento),
    }));
}



export async function createBeneficiario(data: Omit<Beneficiario, 'id' | 'titularId'>, titularId: string): Promise<Beneficiario> {
    const db = await getDb();
    const newBeneficiarioData = {
        ...data,
        id: generateBeneficiaryId(),
        titularId: titularId,
    };

    await db.run(
        'INSERT INTO beneficiarios (id, titularId, nombreCompleto, cedula, fechaNacimiento, genero) VALUES (?, ?, ?, ?, ?, ?)',
        newBeneficiarioData.id,
        newBeneficiarioData.titularId,
        newBeneficiarioData.nombreCompleto,
        newBeneficiarioData.cedula,
        newBeneficiarioData.fechaNacimiento.toISOString(),
        newBeneficiarioData.genero
    );

    revalidatePath(`/dashboard/pacientes/${titularId}/beneficiarios`);
    revalidatePath('/dashboard/pacientes'); // To update beneficiary count
    revalidatePath('/dashboard/beneficiarios'); // To update the global beneficiary list

    return {
        ...newBeneficiarioData,
        fechaNacimiento: new Date(newBeneficiarioData.fechaNacimiento)
    };
}


export async function updateBeneficiario(data: Omit<Beneficiario, 'titularId'>): Promise<Beneficiario> {
    const db = await getDb();

    const result = await db.run(
        `UPDATE beneficiarios
         SET nombreCompleto = ?, cedula = ?, fechaNacimiento = ?, genero = ?
         WHERE id = ?`,
        data.nombreCompleto,
        data.cedula,
        data.fechaNacimiento.toISOString(),
        data.genero,
        data.id
    );

    if (result.changes === 0) {
        throw new Error('Beneficiario no encontrado');
    }

    const updatedRow = await db.get('SELECT * FROM beneficiarios WHERE id = ?', data.id);
    if (!updatedRow) {
        throw new Error('Beneficiario no encontrado después de la actualización');
    }
    
    revalidatePath(`/dashboard/pacientes/${updatedRow.titularId}/beneficiarios`);
    revalidatePath('/dashboard/beneficiarios'); // To update the global beneficiary list

    return {
        ...updatedRow,
        fechaNacimiento: new Date(updatedRow.fechaNacimiento)
    };
}


export async function deleteBeneficiario(id: string): Promise<{ success: boolean; titularId: string }> {
    const db = await getDb();
    
    const beneficiario = await db.get('SELECT titularId FROM beneficiarios WHERE id = ?', id);
    if (!beneficiario) {
        throw new Error('Beneficiario no encontrado para eliminar');
    }

    const result = await db.run('DELETE FROM beneficiarios WHERE id = ?', id);

    if (result.changes === 0) {
        throw new Error('Beneficiario no encontrado para eliminar');
    }
    
    revalidatePath(`/dashboard/pacientes/${beneficiario.titularId}/beneficiarios`);
    revalidatePath('/dashboard/pacientes'); // To update beneficiary count
    revalidatePath('/dashboard/beneficiarios'); // To update the global beneficiary list
    
    return { success: true, titularId: beneficiario.titularId };
}


// --- Patient Check-in Actions ---

export async function searchCombinedPatients(query: string): Promise<SearchResult[]> {
    const db = await getDb();
    const searchQuery = `%${query.trim()}%`;
    const hasQuery = query && query.trim().length > 0;

    const titularesQuery = `
        SELECT id, nombreCompleto, cedula 
        FROM titulares 
        ${hasQuery ? 'WHERE nombreCompleto LIKE ? OR cedula LIKE ?' : ''}
    `;
    const titularesParams = hasQuery ? [searchQuery, searchQuery] : [];
    const titulares = await db.all(titularesQuery, ...titularesParams);

    const beneficiariosQuery = `
        SELECT b.id, b.nombreCompleto, b.cedula, t.id as titularId, t.nombreCompleto as titularNombre
        FROM beneficiarios b
        JOIN titulares t ON b.titularId = t.id
        ${hasQuery ? 'WHERE b.nombreCompleto LIKE ? OR b.cedula LIKE ?' : ''}
    `;
    const beneficiariosParams = hasQuery ? [searchQuery, searchQuery] : [];
    const beneficiarios = await db.all(beneficiariosQuery, ...beneficiariosParams);
    
    const results: SearchResult[] = [
        ...titulares.map(t => ({ ...t, kind: 'titular' as const })),
        ...beneficiarios.map((b: any) => ({
            id: b.id,
            nombreCompleto: b.nombreCompleto,
            cedula: b.cedula,
            kind: 'beneficiario' as const,
            titularInfo: {
                id: b.titularId,
                nombreCompleto: b.titularNombre,
            }
        }))
    ];
    
    results.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
    
    return results;
}

export async function getTitularTypeById(titularId: string): Promise<TitularType | null> {
    const db = await getDb();
    const row = await db.get('SELECT tipo FROM titulares WHERE id = ?', titularId);
    return row?.tipo || null;
}

// --- Company Actions ---

const generateCompanyId = () => `emp${Date.now()}`;

export async function createEmpresa(data: Omit<Empresa, 'id'>): Promise<Empresa> {
    const db = await getDb();
    const newEmpresaData = {
        ...data,
        id: generateCompanyId(),
    };

    await db.run(
        'INSERT INTO empresas (id, name, rif, telefono, direccion) VALUES (?, ?, ?, ?, ?)',
        newEmpresaData.id,
        newEmpresaData.name,
        newEmpresaData.rif,
        newEmpresaData.telefono,
        newEmpresaData.direccion
    );

    revalidatePath('/dashboard/empresas');
    revalidatePath('/dashboard/pacientes'); // In case a new titular is being created

    return newEmpresaData;
}

export async function updateEmpresa(data: Empresa): Promise<Empresa> {
    const db = await getDb();
    const result = await db.run(
        'UPDATE empresas SET name = ?, rif = ?, telefono = ?, direccion = ? WHERE id = ?',
        data.name,
        data.rif,
        data.telefono,
        data.direccion,
        data.id
    );

    if (result.changes === 0) {
        throw new Error('Empresa no encontrada');
    }

    revalidatePath('/dashboard/empresas');
    revalidatePath('/dashboard/pacientes');

    return data;
}

export async function deleteEmpresa(id: string): Promise<{ success: boolean }> {
    const db = await getDb();

    // Check if any titular is associated with this company
    const countResult = await db.get('SELECT COUNT(*) as count FROM titulares WHERE empresaId = ?', id);
    if (countResult.count > 0) {
        throw new Error('No se puede eliminar la empresa porque tiene titulares asociados.');
    }

    const result = await db.run('DELETE FROM empresas WHERE id = ?', id);

    if (result.changes === 0) {
        throw new Error('Empresa no encontrada para eliminar');
    }

    revalidatePath('/dashboard/empresas');
    revalidatePath('/dashboard/pacientes');

    return { success: true };
}


// --- Waitlist Actions ---

export async function getWaitlist(): Promise<Patient[]> {
    const db = await getDb();
    const rows = await db.all(`
        SELECT * FROM waitlist 
        WHERE status != 'Completado' 
        ORDER BY checkInTime ASC
    `);
    return rows.map(row => ({
        ...row,
        checkInTime: new Date(row.checkInTime),
    }));
}

export async function addPatientToWaitlist(data: Omit<Patient, 'id'>): Promise<Patient> {
    const db = await getDb();
    const newPatient: Patient = {
        ...data,
        id: `q-${Date.now()}`,
    };

    await db.run(
        'INSERT INTO waitlist (id, patientDbId, name, kind, serviceType, accountType, status, checkInTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        newPatient.id,
        newPatient.patientDbId,
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

    if (result.changes === 0) {
        throw new Error('Paciente en lista de espera no encontrado');
    }

    revalidatePath('/dashboard');
    return { success: true };
}
