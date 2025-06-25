'use server';

import fs from 'fs/promises';
import path from 'path';
import type { Empresa, Titular } from './types';

interface DB {
    empresas: Empresa[];
    titulares: Titular[];
}

const dbPath = path.join(process.cwd(), 'db.json');

export async function readDb(): Promise<DB> {
    try {
        const data = await fs.readFile(dbPath, 'utf-8');
        const db = JSON.parse(data) as DB;
        
        // Manually revive date strings into Date objects
        db.titulares.forEach(titular => {
            if (titular.fechaNacimiento) {
                titular.fechaNacimiento = new Date(titular.fechaNacimiento);
            }
            if (titular.beneficiarios) {
                titular.beneficiarios.forEach(beneficiario => {
                    if (beneficiario.fechaNacimiento) {
                        beneficiario.fechaNacimiento = new Date(beneficiario.fechaNacimiento);
                    }
                });
            }
        });
        
        return db;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            const defaultDb: DB = { empresas: [], titulares: [] };
            await writeDb(defaultDb);
            return defaultDb;
        }
        throw error;
    }
}

export async function writeDb(data: DB): Promise<void> {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}
