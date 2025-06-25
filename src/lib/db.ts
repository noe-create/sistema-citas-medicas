'use server';

import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import type { Empresa } from './types';
import fs from 'fs';
import path from 'path';

// Use a singleton for the database connection
let db: Database | null = null;

// Ensure the database directory exists
const dbDir = path.join(process.cwd(), '.data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'database.db');


async function initializeDb(): Promise<Database> {
    const newDb = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Drop tables to ensure schema is always up-to-date in development
    await newDb.exec('DROP TABLE IF EXISTS beneficiarios;');
    await newDb.exec('DROP TABLE IF EXISTS titulares;');
    await newDb.exec('DROP TABLE IF EXISTS empresas;');

    await newDb.exec(`
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
            email TEXT NOT NULL UNIQUE,
            tipo TEXT NOT NULL,
            empresaId TEXT,
            FOREIGN KEY (empresaId) REFERENCES empresas(id)
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
    `);
    
    // Seed initial data if tables are empty
    const empresaCount = await newDb.get('SELECT COUNT(*) as count FROM empresas');
    if (empresaCount.count === 0) {
        const empresas: Empresa[] = [
            { id: "emp1", name: "Innovatech Solutions", rif: "J-12345678-9", telefono: "0212-555-1111", direccion: "Av. Principal, Caracas" },
            { id: "emp2", name: "Nexus Group", rif: "J-23456789-0", telefono: "0212-555-2222", direccion: "Calle Secundaria, Valencia" },
            { id: "emp3", name: "Quantum Industries", rif: "J-34567890-1", telefono: "0212-555-3333", direccion: "Torre Empresarial, Maracaibo" },
        ];
        const stmt = await newDb.prepare('INSERT INTO empresas (id, name, rif, telefono, direccion) VALUES (?, ?, ?, ?, ?)');
        for (const empresa of empresas) {
            await stmt.run(empresa.id, empresa.name, empresa.rif, empresa.telefono, empresa.direccion);
        }
        await stmt.finalize();
    }
    
    const titularCount = await newDb.get('SELECT COUNT(*) as count FROM titulares');
    if (titularCount.count === 0) {
        const titulares = [
            { id: "t1", nombreCompleto: "Carlos Rodriguez", cedula: "V-12345678", fechaNacimiento: "1985-02-20T05:00:00.000Z", genero: "Masculino", telefono: "0414-1234567", email: "carlos.r@email.com", tipo: "private", empresaId: null },
            { id: "t2", nombreCompleto: "Ana Martinez", cedula: "V-87654321", fechaNacimiento: "1990-08-10T04:00:00.000Z", genero: "Femenino", telefono: "0412-7654321", email: "ana.m@email.com", tipo: "internal_employee", empresaId: null },
            { id: "t3", nombreCompleto: "Luis Hernandez", cedula: "E-98765432", fechaNacimiento: "1978-12-05T05:00:00.000Z", genero: "Masculino", telefono: "0424-9876543", email: "luis.h@email.com", tipo: "corporate_affiliate", empresaId: "emp1" },
            { id: "t4", nombreCompleto: "Sofia Gomez", cedula: "V-23456789", fechaNacimiento: "1995-04-30T04:00:00.000Z", genero: "Femenino", telefono: "0416-2345678", email: "sofia.g@email.com", tipo: "private", empresaId: null },
        ];
        const stmt = await newDb.prepare('INSERT INTO titulares (id, nombreCompleto, cedula, fechaNacimiento, genero, telefono, email, tipo, empresaId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        for (const t of titulares) {
            await stmt.run(t.id, t.nombreCompleto, t.cedula, t.fechaNacimiento, t.genero, t.telefono, t.email, t.tipo, t.empresaId);
        }
        await stmt.finalize();
    }
    
    const beneficiarioCount = await newDb.get('SELECT COUNT(*) as count FROM beneficiarios');
    if (beneficiarioCount.count === 0) {
        const beneficiarios = [
             { id: "t1-b1", titularId: "t1", nombreCompleto: "Hijo de Carlos", cedula: "V-29876543", fechaNacimiento: "2010-06-15T04:00:00.000Z", genero: "Masculino" },
             { id: "t1-b2", titularId: "t1", nombreCompleto: "Hija de Carlos", cedula: "V-29876544", fechaNacimiento: "2012-09-20T04:00:00.000Z", genero: "Femenino" },
        ];
        const stmt = await newDb.prepare('INSERT INTO beneficiarios (id, titularId, nombreCompleto, cedula, fechaNacimiento, genero) VALUES (?, ?, ?, ?, ?, ?)');
        for (const b of beneficiarios) {
            await stmt.run(b.id, b.titularId, b.nombreCompleto, b.cedula, b.fechaNacimiento, b.genero);
        }
        await stmt.finalize();
    }

    return newDb;
}

export async function getDb(): Promise<Database> {
    if (!db) {
        db = await initializeDb();
    }
    return db;
}
