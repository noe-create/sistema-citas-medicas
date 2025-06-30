

'use server';

import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import type { Empresa, Permission } from './types';
import path from 'path';
import fs from 'fs/promises';
import bcrypt from 'bcryptjs';
import { ALL_PERMISSIONS } from './permissions';

let db: Database | null = null;

async function migratePersonaSchema(dbInstance: Database) {
    // Check if migration is needed by looking for an old column
    const cols = await dbInstance.all("PRAGMA table_info('personas')").catch(() => []);
    
    if (cols.some(c => c.name === 'nombreCompleto')) {
        console.log("Old 'personas' schema detected. Migrating to new schema...");
        try {
            await dbInstance.exec('BEGIN TRANSACTION;');

            // 1. Rename old table
            await dbInstance.exec('ALTER TABLE personas RENAME TO personas_old;');
            
            // 2. Create new table with the correct schema
            await createTables(dbInstance);

            // 3. Migrate data from old table to new table
            await dbInstance.exec(`
                INSERT INTO personas (id, primerNombre, primerApellido, cedula, fechaNacimiento, genero, telefono1, telefono2, email)
                SELECT 
                    id,
                    SUBSTR(nombreCompleto, 1, INSTR(nombreCompleto, ' ') - 1),
                    SUBSTR(nombreCompleto, INSTR(nombreCompleto, ' ') + 1),
                    cedula,
                    fechaNacimiento,
                    genero,
                    telefono,
                    telefonoCelular,
                    email
                FROM personas_old;
            `);

            // 4. Drop the old table
            await dbInstance.exec('DROP TABLE personas_old;');
            
            await dbInstance.exec('COMMIT;');
            console.log("Persona schema migration completed successfully.");
        } catch (error) {
            await dbInstance.exec('ROLLBACK;');
            console.error("Failed to migrate persona schema, rolling back.", error);
            // If migration fails, try to restore the old table
            await dbInstance.exec('DROP TABLE IF EXISTS personas;');
            await dbInstance.exec('ALTER TABLE personas_old RENAME TO personas;');
            throw new Error("Database migration for personas table failed.");
        }
    }
}

async function migrateCedulaToNullable(dbInstance: Database) {
    const cols = await dbInstance.all("PRAGMA table_info('personas')").catch(() => []);
    const cedulaCol = cols.find(c => c.name === 'cedula');

    if (cedulaCol && cedulaCol.notnull) { // notnull is 1 if NOT NULL, 0 otherwise
        console.log("Migrating 'personas.cedula' to be nullable...");
        
        await dbInstance.exec('PRAGMA foreign_keys=OFF;');
        await dbInstance.exec('BEGIN TRANSACTION;');

        try {
            await dbInstance.exec('ALTER TABLE personas RENAME TO personas_temp_migration;');
            
            // Re-create the table with the new schema
            await dbInstance.exec(`
                CREATE TABLE personas (
                    id TEXT PRIMARY KEY,
                    primerNombre TEXT NOT NULL,
                    segundoNombre TEXT,
                    primerApellido TEXT NOT NULL,
                    segundoApellido TEXT,
                    cedula TEXT UNIQUE,
                    fechaNacimiento TEXT NOT NULL,
                    genero TEXT NOT NULL,
                    telefono1 TEXT,
                    telefono2 TEXT,
                    email TEXT,
                    direccion TEXT
                );
            `);
            
            // Copy the data over explicitly
            await dbInstance.exec(`
                INSERT INTO personas (id, primerNombre, segundoNombre, primerApellido, segundoApellido, cedula, fechaNacimiento, genero, telefono1, telefono2, email, direccion)
                SELECT id, primerNombre, segundoNombre, primerApellido, segundoApellido, cedula, fechaNacimiento, genero, telefono1, telefono2, email, direccion FROM personas_temp_migration;
            `);

            await dbInstance.exec('DROP TABLE personas_temp_migration;');
            await dbInstance.exec('COMMIT;');
            console.log("Migration of 'personas.cedula' successful.");
        } catch (e) {
            console.error("Migration failed, rolling back.", e);
            await dbInstance.exec('ROLLBACK;');
        } finally {
            await dbInstance.exec('PRAGMA foreign_keys=ON;');
        }
    }
}


async function initializeDb(): Promise<Database> {
    const dbPath = path.join(process.cwd(), 'database.db');
    
    const dbInstance = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await dbInstance.exec('PRAGMA foreign_keys = ON;');
    
    await migratePersonaSchema(dbInstance);
    await migrateCedulaToNullable(dbInstance);
    
    // --- Safe Migration for Treatment Tables ---
    const treatmentOrdersCols = await dbInstance.all("PRAGMA table_info('treatment_orders')").catch(() => []);
    if (treatmentOrdersCols.length > 0 && treatmentOrdersCols.some(col => col.name === 'procedureDescription')) {
        console.log("Old treatment table structure detected. Migrating to new schema...");
        await dbInstance.exec('DROP TABLE IF EXISTS treatment_executions;');
        await dbInstance.exec('DROP TABLE IF EXISTS treatment_orders;');
        console.log("Old treatment tables dropped.");
    }

    await createTables(dbInstance);

    // Simple migration: check for hasSpecialty column in roles table
    const rolesCols = await dbInstance.all("PRAGMA table_info('roles')");
    if (!rolesCols.some(col => col.name === 'hasSpecialty')) {
        await dbInstance.exec('ALTER TABLE roles ADD COLUMN hasSpecialty BOOLEAN NOT NULL DEFAULT 0');
    }
    
    await seedDb(dbInstance);

    return dbInstance;
}


async function createTables(dbInstance: Database): Promise<void> {
     await dbInstance.exec(`
        -- RBAC Tables
        CREATE TABLE IF NOT EXISTS roles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            hasSpecialty BOOLEAN NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS role_permissions (
            roleId TEXT NOT NULL,
            permissionId TEXT NOT NULL,
            PRIMARY KEY (roleId, permissionId),
            FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE
        );

        -- Main Application Tables
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            roleId TEXT NOT NULL,
            specialty TEXT,
            personaId TEXT,
            FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE RESTRICT,
            FOREIGN KEY (personaId) REFERENCES personas(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS empresas (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            rif TEXT NOT NULL UNIQUE,
            telefono TEXT NOT NULL,
            direccion TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS personas (
            id TEXT PRIMARY KEY,
            primerNombre TEXT NOT NULL,
            segundoNombre TEXT,
            primerApellido TEXT NOT NULL,
            segundoApellido TEXT,
            cedula TEXT UNIQUE,
            fechaNacimiento TEXT NOT NULL,
            genero TEXT NOT NULL,
            telefono1 TEXT,
            telefono2 TEXT,
            email TEXT,
            direccion TEXT
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
            waitlistId TEXT,
            consultationDate TEXT NOT NULL,
            motivoConsulta TEXT,
            enfermedadActual TEXT,
            revisionPorSistemas TEXT,
            antecedentesPersonales TEXT,
            antecedentesFamiliares TEXT,
            antecedentesGinecoObstetricos TEXT,
            antecedentesPediatricos TEXT,
            signosVitales TEXT,
            examenFisicoGeneral TEXT,
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
            documentType TEXT NOT NULL,
            description TEXT,
            fileData TEXT NOT NULL,
            uploadedAt TEXT NOT NULL,
            FOREIGN KEY (consultationId) REFERENCES consultations(id) ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS cie10_codes (
            code TEXT PRIMARY KEY,
            description TEXT NOT NULL
        );
        
        -- NEW Treatment Schema
        CREATE TABLE IF NOT EXISTS treatment_orders (
            id TEXT PRIMARY KEY,
            pacienteId TEXT NOT NULL,
            consultationId TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pendiente', -- Pendiente, En Progreso, Completado, Cancelado
            createdAt TEXT NOT NULL,
            FOREIGN KEY (pacienteId) REFERENCES pacientes(id) ON DELETE CASCADE,
            FOREIGN KEY (consultationId) REFERENCES consultations(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS treatment_order_items (
            id TEXT PRIMARY KEY,
            treatmentOrderId TEXT NOT NULL,
            medicamentoProcedimiento TEXT NOT NULL,
            dosis TEXT,
            via TEXT,
            frecuencia TEXT,
            duracion TEXT,
            instrucciones TEXT,
            status TEXT NOT NULL DEFAULT 'Pendiente', -- Pendiente, Administrado
            FOREIGN KEY (treatmentOrderId) REFERENCES treatment_orders(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS treatment_executions (
            id TEXT PRIMARY KEY,
            treatmentOrderItemId TEXT NOT NULL,
            executionTime TEXT NOT NULL,
            observations TEXT NOT NULL,
            executedBy TEXT NOT NULL,
            FOREIGN KEY (treatmentOrderItemId) REFERENCES treatment_order_items(id) ON DELETE CASCADE
        );


        CREATE TABLE IF NOT EXISTS lab_orders (
            id TEXT PRIMARY KEY,
            pacienteId TEXT NOT NULL,
            consultationId TEXT NOT NULL,
            orderDate TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pendiente',
            FOREIGN KEY (pacienteId) REFERENCES pacientes(id) ON DELETE CASCADE,
            FOREIGN KEY (consultationId) REFERENCES consultations(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS lab_order_items (
            id TEXT PRIMARY KEY,
            labOrderId TEXT NOT NULL,
            testName TEXT NOT NULL,
            FOREIGN KEY (labOrderId) REFERENCES lab_orders(id) ON DELETE CASCADE
        );
    `);
}


async function seedDb(dbInstance: Database): Promise<void> {
    const roleCount = await dbInstance.get('SELECT COUNT(*) as count FROM roles');
    if (roleCount.count === 0) {
        const roles = [
            { id: 'superuser', name: 'Superusuario', description: 'Acceso total a todas las funciones del sistema.', hasSpecialty: 1 },
            { id: 'administrator', name: 'Administrador', description: 'Gestiona la parametrización del sistema como empresas y catálogos.', hasSpecialty: 0 },
            { id: 'asistencial', name: 'Asistencial', description: 'Personal de recepción encargado de la admisión de pacientes.', hasSpecialty: 0 },
            { id: 'doctor', name: 'Doctor', description: 'Personal médico que realiza consultas.', hasSpecialty: 1 },
            { id: 'enfermera', name: 'Enfermera', description: 'Personal de enfermería que aplica tratamientos.', hasSpecialty: 0 },
        ];
        const stmt = await dbInstance.prepare('INSERT INTO roles (id, name, description, hasSpecialty) VALUES (?, ?, ?, ?)');
        for (const role of roles) {
            await stmt.run(role.id, role.name, role.description, role.hasSpecialty);
        }
        await stmt.finalize();

        const rolePermissions = {
            administrator: ['companies.manage', 'cie10.manage', 'reports.view', 'people.manage', 'titulars.manage', 'beneficiaries.manage', 'patientlist.view', 'waitlist.manage'],
            asistencial: ['people.manage', 'titulars.manage', 'beneficiaries.manage', 'patientlist.view', 'waitlist.manage', 'companies.manage'],
            doctor: ['consultation.perform', 'hce.view', 'treatmentlog.manage', 'reports.view', 'waitlist.manage'],
            enfermera: ['treatmentlog.manage', 'waitlist.manage'],
        };

        const permStmt = await dbInstance.prepare('INSERT INTO role_permissions (roleId, permissionId) VALUES (?, ?)');
        for (const [roleId, permissions] of Object.entries(rolePermissions)) {
            for (const permissionId of permissions) {
                await permStmt.run(roleId, permissionId);
            }
        }
        await permStmt.finalize();
    }

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
            { id: "p1", primerNombre: "Carlos", primerApellido: "Rodriguez", cedula: "V-12345678", fechaNacimiento: "1985-02-20T05:00:00.000Z", genero: "Masculino", telefono1: "0212-555-1234", telefono2: "0414-1234567", email: "carlos.r@email.com", direccion: "Av. Urdaneta" },
            { id: "p2", primerNombre: "Ana", primerApellido: "Martinez", segundoApellido: "(Doctora)", cedula: "V-87654321", fechaNacimiento: "1990-08-10T04:00:00.000Z", genero: "Femenino", telefono1: "0241-555-5678", telefono2: "0412-7654321", email: "ana.m@email.com" },
            { id: "p3", primerNombre: "Luis", primerApellido: "Hernandez", cedula: "E-98765432", fechaNacimiento: "1978-12-05T05:00:00.000Z", genero: "Masculino", telefono1: "0261-555-9012", telefono2: "0424-9876543", email: "luis.h@email.com" },
            { id: "p4", primerNombre: "Sofia", primerApellido: "Gomez", segundoApellido: "(Asistente)", cedula: "V-23456789", fechaNacimiento: "1995-04-30T04:00:00.000Z", genero: "Femenino", telefono1: "0212-555-3456", telefono2: "0416-2345678", email: "sofia.g@email.com" },
            { id: "p5", primerNombre: "Laura", primerApellido: "Rodriguez", cedula: "V-29876543", fechaNacimiento: "2010-06-15T04:00:00.000Z", genero: "Femenino", email: "laura.r@email.com" },
            { id: "p6", primerNombre: "David", primerApellido: "Rodriguez", cedula: "V-29876544", fechaNacimiento: "2012-09-20T04:00:00.000Z", genero: "Masculino", email: "david.r@email.com" },
        ];
        const personaStmt = await dbInstance.prepare('INSERT INTO personas (id, primerNombre, primerApellido, cedula, fechaNacimiento, genero, telefono1, telefono2, email, direccion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        for (const p of personas) {
            await personaStmt.run(p.id, p.primerNombre, p.primerApellido, p.cedula, p.fechaNacimiento, p.genero, p.telefono1, p.telefono2, p.email, p.direccion);
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
    
    const userCount = await dbInstance.get('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
        const users = [
            { id: 'usr-super', username: 'superuser', password: 'password123', roleId: 'superuser', specialty: null, personaId: null, name: 'Super Usuario' },
            { id: 'usr-admin', username: 'admin', password: 'password123', roleId: 'administrator', specialty: null, personaId: null, name: 'Administrador' },
            { id: 'usr-assist', username: 'asistente', password: 'password123', roleId: 'asistencial', specialty: null, personaId: 'p4', name: 'Sofia Gomez' },
            { id: 'usr-doctor', username: 'pediatra', password: 'password123', roleId: 'doctor', specialty: 'medico pediatra', personaId: 'p2', name: 'Ana Martinez' },
            { id: 'usr-nurse', username: 'enfermera', password: 'password123', roleId: 'enfermera', specialty: null, personaId: null, name: 'Enfermera Jefa' },
        ];

        const userStmt = await dbInstance.prepare('INSERT INTO users (id, username, password, roleId, specialty, personaId) VALUES (?, ?, ?, ?, ?, ?)');
        for (const u of users) {
            const hashedPassword = await bcrypt.hash(u.password, 10);
            await userStmt.run(u.id, u.username, hashedPassword, u.roleId, u.specialty, u.personaId);
        }
        await userStmt.finalize();
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
