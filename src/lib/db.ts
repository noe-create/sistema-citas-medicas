

'use server';

import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import type { Empresa, Permission } from './types';
import path from 'path';
import fs from 'fs/promises';
import bcrypt from 'bcryptjs';
import { ALL_PERMISSIONS } from './permissions';
import { calculateAge } from './utils';

let db: Database | null = null;


async function runMigrations(dbInstance: Database) {
    console.log('Checking database schema...');
    await dbInstance.exec('PRAGMA foreign_keys=OFF;');

    // Universal migration for 'personas' table
    const personasCols = await dbInstance.all("PRAGMA table_info('personas')").catch(() => []);
    const hasOldNombreCompleto = personasCols.some(c => c.name === 'nombreCompleto');
    const hasOldCedulaNotNull = personasCols.some(c => c.name === 'cedula' && c.notnull);
    const hasOldSingleCedula = personasCols.some(c => c.name === 'cedula');
    const hasNewCedula = personasCols.some(c => c.name === 'nacionalidad');

    if (personasCols.length > 0 && !hasNewCedula) {
        console.log("Old 'personas' schema detected. Running unified migration...");
        await dbInstance.exec('BEGIN TRANSACTION;');
        try {
            await dbInstance.exec('ALTER TABLE personas RENAME TO personas_old;');
            await createTables(dbInstance); // Creates the new clean schema

            const oldColumns = (await dbInstance.all("PRAGMA table_info('personas_old')")).map(c => c.name);

            const selectExpressions = [
                'id',
                hasOldNombreCompleto ? `SUBSTR(nombreCompleto, 1, INSTR(nombreCompleto, ' ') - 1)` : 'primerNombre',
                hasOldNombreCompleto ? `NULL` : 'segundoNombre',
                hasOldNombreCompleto ? `SUBSTR(nombreCompleto, INSTR(nombreCompleto, ' ') + 1)` : 'primerApellido',
                hasOldNombreCompleto ? `NULL` : 'segundoApellido',
                hasOldSingleCedula ? `CASE WHEN cedula IS NOT NULL AND INSTR(cedula, '-') > 0 THEN SUBSTR(cedula, 1, INSTR(cedula, '-') - 1) ELSE NULL END` : 'NULL', // nacionalidad
                hasOldSingleCedula ? `CASE WHEN cedula IS NOT NULL AND INSTR(cedula, '-') > 0 THEN SUBSTR(cedula, INSTR(cedula, '-') + 1) ELSE NULL END` : 'NULL', // cedulaNumero
                'fechaNacimiento',
                'genero',
                oldColumns.includes('telefono') ? 'telefono' : (oldColumns.includes('telefono1') ? 'telefono1' : 'NULL'), // telefono1
                oldColumns.includes('telefonoCelular') ? 'telefonoCelular' : (oldColumns.includes('telefono2') ? 'telefono2' : 'NULL'), // telefono2
                'email',
                'direccion',
                'representanteId'
            ];
            
            const fieldsToInsert = 'id, primerNombre, segundoNombre, primerApellido, segundoApellido, nacionalidad, cedulaNumero, fechaNacimiento, genero, telefono1, telefono2, email, direccion, representanteId';

            await dbInstance.exec(`INSERT INTO personas (${fieldsToInsert}) SELECT ${selectExpressions.join(', ')} FROM personas_old;`);

            await dbInstance.exec('DROP TABLE personas_old;');
            await dbInstance.exec('COMMIT;');
            console.log("Unified 'personas' migration successful.");
        } catch (error) {
            await dbInstance.exec('ROLLBACK;');
            console.error("Failed to migrate 'personas' schema, rolling back.", error);
            const tableExists = await dbInstance.get("SELECT name FROM sqlite_master WHERE type='table' AND name='personas_old';");
            if (tableExists) {
                await dbInstance.exec('DROP TABLE IF EXISTS personas;');
                await dbInstance.exec('ALTER TABLE personas_old RENAME TO personas;');
            }
            throw new Error("Database migration for personas table failed.");
        }
    }

    // Migration for treatment_orders (if old schema exists)
    const treatmentOrdersCols = await dbInstance.all("PRAGMA table_info('treatment_orders')").catch(() => []);
    if (treatmentOrdersCols.length > 0 && treatmentOrdersCols.some(col => col.name === 'procedureDescription')) {
        console.log("Old treatment table structure detected. Migrating to new schema...");
        await dbInstance.exec('DROP TABLE IF EXISTS treatment_executions;');
        await dbInstance.exec('DROP TABLE IF EXISTS treatment_orders;');
        await createTables(dbInstance); // Re-create just the needed tables
        console.log("Old treatment tables dropped and new ones created.");
    }

    // Migration for roles (if hasSpecialty column is missing)
    const rolesCols = await dbInstance.all("PRAGMA table_info('roles')").catch(() => []);
    if (rolesCols.length > 0 && !rolesCols.some(col => col.name === 'hasSpecialty')) {
        await dbInstance.exec('ALTER TABLE roles ADD COLUMN hasSpecialty BOOLEAN NOT NULL DEFAULT 0');
    }
    
    // Migration to add createdAt to personas
    if (personasCols.length > 0 && !personasCols.some(c => c.name === 'createdAt')) {
        await dbInstance.exec('ALTER TABLE personas ADD COLUMN createdAt TEXT');
        console.log("Added createdAt column to personas table.");
    }

    await dbInstance.exec('PRAGMA foreign_keys=ON;');
}


async function initializeDb(): Promise<Database> {
    const dbPath = path.join(process.cwd(), 'database.db');
    
    const dbInstance = await open({
        filename: dbPath,
        driver: sqlite3.Database,
        mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
    });

    await dbInstance.exec('PRAGMA foreign_keys = ON;');
    
    await createTables(dbInstance);
    await runMigrations(dbInstance);
    
    await seedDb(dbInstance);

    return dbInstance;
}


async function createTables(dbInstance: Database): Promise<void> {
     await dbInstance.exec(`
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
            nacionalidad TEXT,
            cedulaNumero TEXT,
            fechaNacimiento TEXT NOT NULL,
            genero TEXT NOT NULL,
            telefono1 TEXT,
            telefono2 TEXT,
            email TEXT,
            direccion TEXT,
            representanteId TEXT,
            createdAt TEXT,
            UNIQUE(nacionalidad, cedulaNumero),
            FOREIGN KEY (representanteId) REFERENCES personas(id) ON DELETE SET NULL
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
        
        CREATE TABLE IF NOT EXISTS treatment_orders (
            id TEXT PRIMARY KEY,
            pacienteId TEXT NOT NULL,
            consultationId TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pendiente', 
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
            status TEXT NOT NULL DEFAULT 'Pendiente', 
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

        CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY,
            pacienteId TEXT NOT NULL,
            doctorId TEXT NOT NULL,
            start TEXT NOT NULL,
            end TEXT NOT NULL,
            motivo TEXT,
            status TEXT NOT NULL,
            FOREIGN KEY (pacienteId) REFERENCES pacientes(id) ON DELETE CASCADE,
            FOREIGN KEY (doctorId) REFERENCES users(id) ON DELETE CASCADE
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
            administrator: ['companies.manage', 'cie10.manage', 'reports.view', 'people.manage', 'titulars.manage', 'beneficiaries.manage', 'patientlist.view', 'waitlist.manage', 'agenda.manage'],
            asistencial: ['people.manage', 'titulars.manage', 'beneficiaries.manage', 'patientlist.view', 'waitlist.manage', 'companies.manage', 'agenda.manage'],
            doctor: ['consultation.perform', 'hce.view', 'treatmentlog.manage', 'reports.view', 'waitlist.manage', 'agenda.manage'],
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
             { id: "p1", p_nombre: "Carlos", s_nombre: null, p_apellido: "Rodriguez", s_apellido: null, nac: 'V', ced: "12345678", fecha: "1985-02-20T05:00:00.000Z", gen: "Masculino", tel1: "0212-555-1234", tel2: "0414-1234567", email: "carlos.r@email.com", dir: "Av. Urdaneta" },
             { id: "p2", p_nombre: "Ana", s_nombre: null, p_apellido: "Martinez", s_apellido: null, nac: 'V', ced: "87654321", fecha: "1990-08-10T04:00:00.000Z", gen: "Femenino", tel1: "0241-555-5678", tel2: "0412-7654321", email: "ana.m@email.com", dir: null },
             { id: "p3", p_nombre: "Luis", s_nombre: null, p_apellido: "Hernandez", s_apellido: null, nac: 'E', ced: "98765432", fecha: "1978-12-05T05:00:00.000Z", gen: "Masculino", tel1: "0261-555-9012", tel2: "0424-9876543", email: "luis.h@email.com", dir: null },
             { id: "p4", p_nombre: "Sofia", s_nombre: null, p_apellido: "Gomez", s_apellido: null, nac: 'V', ced: "23456789", fecha: "1995-04-30T04:00:00.000Z", gen: "Femenino", tel1: "0212-555-3456", tel2: "0416-2345678", email: "sofia.g@email.com", dir: null },
             { id: "p5", p_nombre: "Laura", s_nombre: null, p_apellido: "Rodriguez", s_apellido: null, nac: 'V', ced: "29876543", fecha: "2010-06-15T04:00:00.000Z", gen: "Femenino", email: "laura.r@email.com", dir: null },
             { id: "p6", p_nombre: "David", s_nombre: null, p_apellido: "Rodriguez", s_apellido: null, nac: 'V', ced: "29876544", fecha: "2012-09-20T04:00:00.000Z", gen: "Masculino", email: "david.r@email.com", dir: null },
        ];
        const personaStmt = await dbInstance.prepare('INSERT INTO personas (id, primerNombre, segundoNombre, primerApellido, segundoApellido, nacionalidad, cedulaNumero, fechaNacimiento, genero, telefono1, telefono2, email, direccion, representanteId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)');
        for (const p of personas) {
            await personaStmt.run(p.id, p.p_nombre, p.s_nombre, p.p_apellido, p.s_apellido, p.nac, p.ced, p.fecha, p.gen, p.tel1, p.tel2, p.email, p.dir, new Date(p.fecha).toISOString());
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
