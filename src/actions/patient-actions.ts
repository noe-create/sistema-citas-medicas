'use server';

import { getDb } from '@/lib/db';
import type { Titular } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const generateId = () => `t${Date.now()}`;

export async function getTitulares(): Promise<Titular[]> {
    const db = await getDb();
    // For now, beneficiaries are returned as an empty array.
    // They can be fetched with a separate query when needed.
    const rows = await db.all('SELECT * FROM titulares ORDER BY nombreCompleto');
    
    // Also fetch beneficiary counts for each titular
    const titularesWithBeneficiaryCount = await Promise.all(rows.map(async (row) => {
        const countResult = await db.get('SELECT COUNT(*) as count FROM beneficiarios WHERE titularId = ?', row.id);
        const titular = {
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

export async function getEmpresas() {
    const db = await getDb();
    return db.all('SELECT * FROM empresas');
}

export async function createTitular(data: Omit<Titular, 'id' | 'beneficiarios'>) {
    const db = await getDb();
    const newTitularData = {
        ...data,
        id: generateId(),
    };
    
    await db.run(
        'INSERT INTO titulares (id, nombreCompleto, cedula, fechaNacimiento, genero, telefono, email, tipo, empresaId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        newTitularData.id,
        newTitularData.nombreCompleto,
        newTitularData.cedula,
        newTitularData.fechaNacimiento.toISOString(),
        newTitularData.genero,
        newTitularData.telefono,
        newTitularData.email,
        newTitularData.tipo,
        newTitularData.tipo === 'corporate_affiliate' ? newTitularData.empresaId : null
    );
    
    revalidatePath('/dashboard/pacientes');
    
    // Return the full object for type consistency
    const newTitular: Titular = { ...newTitularData, beneficiarios: [] };
    return newTitular;
}

export async function updateTitular(data: Omit<Titular, 'beneficiarios'>) {
    const db = await getDb();

    const result = await db.run(
        `UPDATE titulares 
         SET nombreCompleto = ?, cedula = ?, fechaNacimiento = ?, genero = ?, telefono = ?, email = ?, tipo = ?, empresaId = ?
         WHERE id = ?`,
        data.nombreCompleto,
        data.cedula,
        data.fechaNacimiento.toISOString(),
        data.genero,
        data.telefono,
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
