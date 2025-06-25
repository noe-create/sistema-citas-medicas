'use server';

import { readDb, writeDb } from '@/lib/db';
import type { Titular } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const generateId = () => `t${Date.now()}`;

export async function getTitulares() {
    const db = await readDb();
    // Sort by name by default
    return db.titulares.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
}

export async function getEmpresas() {
    const db = await readDb();
    return db.empresas;
}

export async function createTitular(data: Omit<Titular, 'id' | 'beneficiarios'>) {
    const db = await readDb();
    const newTitular: Titular = {
        ...data,
        id: generateId(),
        beneficiarios: [],
    };
    db.titulares.push(newTitular);
    await writeDb(db);
    revalidatePath('/dashboard/pacientes');
    return newTitular;
}

export async function updateTitular(data: Omit<Titular, 'beneficiarios'>) {
    const db = await readDb();
    const index = db.titulares.findIndex(t => t.id === data.id);
    if (index === -1) {
        throw new Error('Titular no encontrado');
    }
    // Preserve beneficiaries, only update titular data
    db.titulares[index] = { ...db.titulares[index], ...data };
    await writeDb(db);
    revalidatePath('/dashboard/pacientes');
    return db.titulares[index];
}

export async function deleteTitular(id: string): Promise<{ success: boolean }> {
    const db = await readDb();
    const initialLength = db.titulares.length;
    db.titulares = db.titulares.filter(t => t.id !== id);
    if (db.titulares.length === initialLength) {
        throw new Error('Titular no encontrado para eliminar');
    }
    await writeDb(db);
    revalidatePath('/dashboard/pacientes');
    return { success: true };
}
