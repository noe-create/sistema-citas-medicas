'use server';

import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import type { Empresa } from './types';
import path from 'path';
import fs from 'fs/promises';

let db: Database | null = null;

async function initializeDb(): Promise<Database> {
    const dbPath = path.join(process.cwd(), 'database.db');
    
    try {
        await fs.access(dbPath);
    } catch {
        // If the file doesn't exist, we create it and seed it.
        // This is a workaround for environments where the file might be ephemeral.
        const newDb = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        await seedDb(newDb);
        return newDb;
    }

    // If it exists, we open it
    const existingDb = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });
    
    // We still need to ensure tables exist in case of an empty but existing file.
    await createTables(existingDb);
    // We could add a check here to seed if tables are empty, but for now, we assume
    // an existing DB is a valid, seeded DB.

    return existingDb;
}


async function createTables(dbInstance: Database): Promise<void> {
     await dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS empresas (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            rif TEXT NOT NULL UNIQUE,
            telefono TEXT NOT NULL,
            direccion TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS titulares (
            id TEXT PRIMARY KEY,
            nombreCompleto TEXT NOT NULL,
            cedula TEXT NOT NULL UNIQUE,
            fechaNacimiento TEXT NOT NULL,
            genero TEXT NOT NULL,
            telefono TEXT NOT NULL,
            telefonoCelular TEXT,
            email TEXT NOT NULL UNIQUE,
            tipo TEXT NOT NULL,
            empresaId TEXT,
            FOREIGN KEY (empresaId) REFERENCES empresas(id) ON DELETE SET NULL
        );
        CREATE TABLE IF NOT EXISTS beneficiarios (
            id TEXT PRIMARY KEY,
            titularId TEXT NOT NULL,
            nombreCompleto TEXT NOT NULL,
            cedula TEXT NOT NULL UNIQUE,
            fechaNacimiento TEXT NOT NULL,
            genero TEXT NOT NULL,
            FOREIGN KEY (titularId) REFERENCES titulares(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS waitlist (
            id TEXT PRIMARY KEY,
            patientDbId TEXT NOT NULL,
            name TEXT NOT NULL,
            kind TEXT NOT NULL,
            serviceType TEXT NOT NULL,
            accountType TEXT NOT NULL,
            status TEXT NOT NULL,
            checkInTime TEXT NOT NULL
        );
    `);
}


async function seedDb(dbInstance: Database): Promise<void> {
    await createTables(dbInstance);

    // Seed initial data
    const empresaCount = await dbInstance.get('SELECT COUNT(*) as count FROM empresas');
    if (empresaCount.count === 0) {
        const empresas: Empresa[] = [
            { id: "emp1", name: "Innovatech Solutions", rif: "J-12345678-9", telefono: "0212-555-1111", direccion: "Av. Principal, Caracas" },
            { id: "emp2", name: "Nexus Group", rif: "J-23456789-0", telefono: "0212-555-2222", direccion: "Calle Secundaria, Valencia" },
            { id: "emp3", name: "Quantum Industries", rif: "J-34567890-1", telefono: "0212-555-3333", direccion: "Torre Empresarial, Maracaibo" },
        ];
        const stmt = await dbInstance.prepare('INSERT INTO empresas (id, name, rif, telefono, direccion) VALUES (?, ?, ?, ?, ?)');
        for (const empresa of empresas) {
            await stmt.run(empresa.id, empresa.name, empresa.rif, empresa.telefono, empresa.direccion);
        }
        await stmt.finalize();
    }
    
    const titularCount = await dbInstance.get('SELECT COUNT(*) as count FROM titulares');
    if (titularCount.count === 0) {
        const titulares = [
            { id: "t1", nombreCompleto: "Carlos Rodriguez", cedula: "V-12345678", fechaNacimiento: "1985-02-20T05:00:00.000Z", genero: "Masculino", telefono: "0212-555-1234", telefonoCelular: "0414-1234567", email: "carlos.r@email.com", tipo: "private", empresaId: null },
            { id: "t2", nombreCompleto: "Ana Martinez", cedula: "V-87654321", fechaNacimiento: "1990-08-10T04:00:00.000Z", genero: "Femenino", telefono: "0241-555-5678", telefonoCelular: "0412-7654321", email: "ana.m@email.com", tipo: "internal_employee", empresaId: null },
            { id: "t3", nombreCompleto: "Luis Hernandez", cedula: "E-98765432", fechaNacimiento: "1978-12-05T05:00:00.000Z", genero: "Masculino", telefono: "0261-555-9012", telefonoCelular: "0424-9876543", email: "luis.h@email.com", tipo: "corporate_affiliate", empresaId: "emp1" },
            { id: "t4", nombreCompleto: "Sofia Gomez", cedula: "V-23456789", fechaNacimiento: "1995-04-30T04:00:00.000Z", genero: "Femenino", telefono: "0212-555-3456", telefonoCelular: "0416-2345678", email: "sofia.g@email.com", tipo: "private", empresaId: null },
        ];
        const stmt = await dbInstance.prepare('INSERT INTO titulares (id, nombreCompleto, cedula, fechaNacimiento, genero, telefono, telefonoCelular, email, tipo, empresaId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        for (const t of titulares) {
            await stmt.run(t.id, t.nombreCompleto, t.cedula, t.fechaNacimiento, t.genero, t.telefono, t.telefonoCelular, t.email, t.tipo, t.empresaId);
        }
        await stmt.finalize();
    }
    
    const beneficiarioCount = await dbInstance.get('SELECT COUNT(*) as count FROM beneficiarios');
    if (beneficiarioCount.count === 0) {
        const beneficiarios = [
             { id: "t1-b1", titularId: "t1", nombreCompleto: "Hijo de Carlos", cedula: "V-29876543", fechaNacimiento: "2010-06-15T04:00:00.000Z", genero: "Masculino" },
             { id: "t1-b2", titularId: "t1", nombreCompleto: "Hija de Carlos", cedula: "V-29876544", fechaNacimiento: "2012-09-20T04:00:00.000Z", genero: "Femenino" },
        ];
        const stmt = await dbInstance.prepare('INSERT INTO beneficiarios (id, titularId, nombreCompleto, cedula, fechaNacimiento, genero) VALUES (?, ?, ?, ?, ?, ?)');
        for (const b of beneficiarios) {
            await stmt.run(b.id, b.titularId, b.nombreCompleto, b.cedula, b.fechaNacimiento, b.genero);
        }
        await stmt.finalize();
    }
}


export async function getDb(): Promise<Database> {
    if (!db) {
        db = await initializeDb();
    }
    return db;
}
