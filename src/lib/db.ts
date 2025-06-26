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
        const newDb = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        await seedDb(newDb);
        return newDb;
    }

    const existingDb = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });
    
    await createTables(existingDb);

    return existingDb;
}


async function createTables(dbInstance: Database): Promise<void> {
     await dbInstance.exec(`
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS empresas (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            rif TEXT NOT NULL UNIQUE,
            telefono TEXT NOT NULL,
            direccion TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS personas (
            id TEXT PRIMARY KEY,
            nombreCompleto TEXT NOT NULL,
            cedula TEXT NOT NULL UNIQUE,
            fechaNacimiento TEXT NOT NULL,
            genero TEXT NOT NULL,
            telefono TEXT,
            telefonoCelular TEXT,
            email TEXT UNIQUE
        );

        CREATE TABLE IF NOT EXISTS pacientes (
            id TEXT PRIMARY KEY,
            personaId TEXT NOT NULL UNIQUE,
            FOREIGN KEY (personaId) REFERENCES personas(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS titulares (
            id TEXT PRIMARY KEY,
            personaId TEXT NOT NULL UNIQUE,
            tipo TEXT NOT NULL,
            empresaId TEXT,
            FOREIGN KEY (personaId) REFERENCES personas(id) ON DELETE CASCADE,
            FOREIGN KEY (empresaId) REFERENCES empresas(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS beneficiarios (
            id TEXT PRIMARY KEY,
            personaId TEXT NOT NULL,
            titularId TEXT NOT NULL,
            UNIQUE(personaId, titularId),
            FOREIGN KEY (personaId) REFERENCES personas(id) ON DELETE CASCADE,
            FOREIGN KEY (titularId) REFERENCES titulares(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS waitlist (
            id TEXT PRIMARY KEY,
            personaId TEXT NOT NULL,
            pacienteId TEXT NOT NULL,
            name TEXT NOT NULL,
            kind TEXT NOT NULL,
            serviceType TEXT NOT NULL,
            accountType TEXT NOT NULL,
            status TEXT NOT NULL,
            checkInTime TEXT NOT NULL,
            FOREIGN KEY (personaId) REFERENCES personas(id) ON DELETE CASCADE,
            FOREIGN KEY (pacienteId) REFERENCES pacientes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS consultations (
            id TEXT PRIMARY KEY,
            pacienteId TEXT NOT NULL,
            consultationDate TEXT NOT NULL,
            anamnesis TEXT,
            physicalExam TEXT,
            treatmentPlan TEXT,
            FOREIGN KEY (pacienteId) REFERENCES pacientes(id) ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS consultation_diagnoses (
            id TEXT PRIMARY KEY,
            consultationId TEXT NOT NULL,
            cie10Code TEXT NOT NULL,
            cie10Description TEXT NOT NULL,
            FOREIGN KEY (consultationId) REFERENCES consultations(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS consultation_documents (
            id TEXT PRIMARY KEY,
            consultationId TEXT NOT NULL,
            fileName TEXT NOT NULL,
            fileType TEXT NOT NULL,
            fileData TEXT NOT NULL,
            uploadedAt TEXT NOT NULL,
            FOREIGN KEY (consultationId) REFERENCES consultations(id) ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS cie10_codes (
            code TEXT PRIMARY KEY,
            description TEXT NOT NULL
        );
    `);
}


async function seedDb(dbInstance: Database): Promise<void> {
    await createTables(dbInstance);

    const empresaCountResult = await dbInstance.get('SELECT COUNT(*) as count FROM empresas');
    if (empresaCountResult.count === 0) {
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
    
    const personaCountResult = await dbInstance.get('SELECT COUNT(*) as count FROM personas');
    if (personaCountResult.count === 0) {
        const personas = [
            { id: "p1", nombreCompleto: "Carlos Rodriguez", cedula: "V-12345678", fechaNacimiento: "1985-02-20T05:00:00.000Z", genero: "Masculino", telefono: "0212-555-1234", telefonoCelular: "0414-1234567", email: "carlos.r@email.com" },
            { id: "p2", nombreCompleto: "Ana Martinez", cedula: "V-87654321", fechaNacimiento: "1990-08-10T04:00:00.000Z", genero: "Femenino", telefono: "0241-555-5678", telefonoCelular: "0412-7654321", email: "ana.m@email.com" },
            { id: "p3", nombreCompleto: "Luis Hernandez", cedula: "E-98765432", fechaNacimiento: "1978-12-05T05:00:00.000Z", genero: "Masculino", telefono: "0261-555-9012", telefonoCelular: "0424-9876543", email: "luis.h@email.com" },
            { id: "p4", nombreCompleto: "Sofia Gomez", cedula: "V-23456789", fechaNacimiento: "1995-04-30T04:00:00.000Z", genero: "Femenino", telefono: "0212-555-3456", telefonoCelular: "0416-2345678", email: "sofia.g@email.com" },
            { id: "p5", nombreCompleto: "Laura Rodriguez", cedula: "V-29876543", fechaNacimiento: "2010-06-15T04:00:00.000Z", genero: "Femenino", email: "laura.r@email.com" },
            { id: "p6", nombreCompleto: "David Rodriguez", cedula: "V-29876544", fechaNacimiento: "2012-09-20T04:00:00.000Z", genero: "Masculino", email: "david.r@email.com" },
        ];
        const personaStmt = await dbInstance.prepare('INSERT INTO personas (id, nombreCompleto, cedula, fechaNacimiento, genero, telefono, telefonoCelular, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        for (const p of personas) {
            await personaStmt.run(p.id, p.nombreCompleto, p.cedula, p.fechaNacimiento, p.genero, p.telefono, p.telefonoCelular, p.email);
        }
        await personaStmt.finalize();

        const titulares = [
            { id: "t1", personaId: "p1", tipo: "private", empresaId: null },
            { id: "t2", personaId: "p2", tipo: "internal_employee", empresaId: null },
            { id: "t3", personaId: "p3", tipo: "corporate_affiliate", empresaId: "emp1" },
            { id: "t4", personaId: "p4", tipo: "private", empresaId: null },
        ];
        const titularStmt = await dbInstance.prepare('INSERT INTO titulares (id, personaId, tipo, empresaId) VALUES (?, ?, ?, ?)');
        for (const t of titulares) {
            await titularStmt.run(t.id, t.personaId, t.tipo, t.empresaId);
        }
        await titularStmt.finalize();
        
        const beneficiarios = [
            { id: "b1", personaId: "p5", titularId: "t1" },
            { id: "b2", personaId: "p6", titularId: "t1" },
        ];
        const beneficiarioStmt = await dbInstance.prepare('INSERT INTO beneficiarios (id, personaId, titularId) VALUES (?, ?, ?)');
        for (const b of beneficiarios) {
            await beneficiarioStmt.run(b.id, b.personaId, b.titularId);
        }
        await beneficiarioStmt.finalize();

        const pacienteStmt = await dbInstance.prepare('INSERT INTO pacientes (id, personaId) VALUES (?, ?)');
        for (const p of personas) {
            await pacienteStmt.run(`pac-${p.id}`, p.id);
        }
        await pacienteStmt.finalize();
    }

    const cie10CountResult = await dbInstance.get('SELECT COUNT(*) as count FROM cie10_codes');
    if (cie10CountResult.count === 0) {
        const codes = [
            { code: 'J00', description: 'Nasofaringitis aguda (resfriado común)' },
            { code: 'J02.9', description: 'Faringitis aguda, no especificada' },
            { code: 'J03.9', description: 'Amigdalitis aguda, no especificada' },
            { code: 'A09X', description: 'Enfermedad diarreica y gastroenteritis de presunto origen infeccioso' },
            { code: 'R51', description: 'Cefalea' },
            { code: 'M54.5', description: 'Lumbago no especificado' },
            { code: 'L23.9', description: 'Dermatitis alérgica de contacto, de causa no especificada' },
            { code: 'H10.9', description: 'Conjuntivitis, no especificada' },
            { code: 'I10', description: 'Hipertensión esencial (primaria)' },
            { code: 'E11.9', description: 'Diabetes mellitus tipo 2, sin complicaciones' },
        ];
        const stmt = await dbInstance.prepare('INSERT INTO cie10_codes (code, description) VALUES (?, ?)');
        for (const c of codes) {
            await stmt.run(c.code, c.description);
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
